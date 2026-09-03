/**
 * One-off: shrink oversized product images already in Supabase Storage.
 *
 * The menu ships every product image at full upload resolution — several are raw
 * phone photos (3024x4032, ~380KB) rendered in cards a few hundred pixels wide.
 * That is the bulk of our storage egress. This resizes them to WEBP/800px,
 * uploads under a new filename, and repoints products.image_url.
 *
 * Dry run (default) — downloads, resizes, reports sizes, writes nothing:
 *   npx tsx scripts/resize-product-images.ts
 *
 * Apply — uploads resized copies and updates the products table:
 *   npx tsx scripts/resize-product-images.ts --apply
 *
 * Old objects are left in place: the products table still points at them until
 * the update lands, so a failed run never leaves a product with a broken image.
 * Delete them manually once the site looks right.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

dotenv.config();

const MAX_DIMENSION = 800;
// 75 measured ~25% smaller than 82 with no visible difference at card size;
// below 70 the savings flatten out and artifacts start showing.
const WEBP_QUALITY = 75;
const BUCKET = 'products';

const APPLY = process.argv.includes('--apply');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Prefer a service-role key when one is present; the anon key works only if
// storage/table policies allow writes from it.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL / key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

async function main() {
  console.log(APPLY ? '=== APPLY (writes!) ===' : '=== DRY RUN (no writes) ===');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image_url');

  if (error) throw error;

  const targets = (products || []).filter((p) =>
    p.image_url?.includes('/storage/v1/object/public/products/')
  );

  console.log(`${targets.length} products with Supabase-hosted images\n`);

  if (APPLY) {
    // Snapshot the current URLs first: restoring is just replaying this file,
    // and the old objects are never deleted so they stay reachable.
    const backupPath = `product-image-urls.backup.${Date.now()}.json`;
    writeFileSync(backupPath, JSON.stringify(targets, null, 2));
    console.log(`rollback snapshot written to ${backupPath}\n`);
  }

  let before = 0;
  let after = 0;
  const failures: string[] = [];

  for (const product of targets) {
    try {
      const res = await fetch(product.image_url);
      if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
      const original = Buffer.from(await res.arrayBuffer());

      const meta = await sharp(original).metadata();
      const resized = await sharp(original)
        .rotate() // honour EXIF orientation before we strip metadata
        .resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      const newMeta = await sharp(resized).metadata();
      before += original.length;
      after += resized.length;

      const saved = (1 - resized.length / original.length) * 100;
      console.log(
        `${product.name}\n` +
          `   ${meta.width}x${meta.height} ${kb(original.length)}` +
          ` -> ${newMeta.width}x${newMeta.height} ${kb(resized.length)}` +
          `  (-${saved.toFixed(0)}%)`
      );

      if (!APPLY) continue;

      const filePath = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.webp`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, resized, {
          contentType: 'image/webp',
          cacheControl: '31536000, immutable',
          upsert: false,
        });
      if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', product.id);
      if (updateError) throw new Error(`db update failed: ${updateError.message}`);

      console.log(`   -> ${publicUrl}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`   FAILED ${product.name}: ${message}`);
      failures.push(product.name);
    }
  }

  console.log(
    `\nper page view: ${kb(before)} -> ${kb(after)}` +
      (before ? `  (-${((1 - after / before) * 100).toFixed(0)}%)` : '')
  );
  if (failures.length) {
    console.log(`failed: ${failures.join(', ')}`);
  }
  if (!APPLY) {
    console.log('\nNothing was written. Re-run with --apply to commit these.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
