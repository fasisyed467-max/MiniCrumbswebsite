// Vercel Edge Function: caching proxy for Supabase Storage product images.
//
// Why this exists: hitting Supabase Storage directly (or via a *.workers.dev
// Worker, where Cloudflare's edge cache is silently disabled) means every image
// view is a fresh pull from Supabase and counts against cached egress. Vercel's
// Edge Network DOES cache function responses that carry a long-lived
// Cache-Control / Vercel-CDN-Cache-Control, and it does so on the free
// *.vercel.app domain. So: first request per object pulls from Supabase, every
// request after is served from Vercel's CDN for 30 days.
//
// Product image filenames are randomised on every upload, so a cached object is
// never stale and it is safe to treat them as immutable.

export const config = { runtime: 'edge' };

const SUPABASE_BASE = 'https://hjldktzxzeaxqvoxoesc.supabase.co';
const ALLOWED_PREFIX = '/storage/v1/object/public/products/';
const MAX_AGE = 2592000; // 30 days

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Path arrives as /api/img/storage/v1/object/public/products/<file>
  const objectPath = url.pathname.replace(/^\/api\/img/, '');

  if (!objectPath.startsWith(ALLOWED_PREFIX) || objectPath.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const upstream = await fetch(SUPABASE_BASE + objectPath, {
    headers: { accept: req.headers.get('accept') ?? 'image/*' },
  });

  if (!upstream.ok) {
    return new Response('Upstream error', { status: upstream.status });
  }

  const headers = new Headers();
  headers.set(
    'Content-Type',
    upstream.headers.get('content-type') ?? 'application/octet-stream',
  );
  const len = upstream.headers.get('content-length');
  if (len) headers.set('Content-Length', len);

  // Browser cache.
  headers.set('Cache-Control', `public, max-age=${MAX_AGE}, immutable`);
  // Vercel Edge (CDN) cache — kept even if a future change shortens the browser TTL.
  headers.set('Vercel-CDN-Cache-Control', `public, max-age=${MAX_AGE}`);

  return new Response(upstream.body, { status: 200, headers });
}
