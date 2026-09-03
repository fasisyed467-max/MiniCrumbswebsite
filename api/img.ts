// Vercel Function: caching proxy for Supabase Storage product images.
//
// Why: the Cloudflare Worker on *.workers.dev never durably cached images (per-PoP
// best-effort cache, evicts between our sparse visits), so every shop view
// re-pulled all product images from Supabase Storage origin and burned the
// 5 GB/month cached-egress allowance. Vercel's CDN honours
// `Vercel-CDN-Cache-Control` with durable region-wide edge caching, so Supabase
// serves each image ~once per 30 days.
//
// Routing: a rewrite in vercel.json maps
//   /api/img/<supabase object path>  ->  /api/img?path=<supabase object path>
// so this single file handles every product-image request. Product filenames are
// randomised per upload, so a cached object is never stale — safe as immutable.

const SUPABASE_BASE = 'https://hjldktzxzeaxqvoxoesc.supabase.co';
const ALLOWED_PREFIX = '/storage/v1/object/public/products/';
const MAX_AGE = 2592000; // 30 days

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const raw = url.searchParams.get('path') ?? '';
    const objectPath = raw.startsWith('/') ? raw : `/${raw}`;

    if (!objectPath.startsWith(ALLOWED_PREFIX) || objectPath.includes('..')) {
      return new Response('Not found', { status: 404 });
    }

    const upstream = await fetch(SUPABASE_BASE + objectPath, {
      headers: { accept: request.headers.get('accept') ?? 'image/*' },
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
    // Vercel Edge (CDN) cache — kept even if the browser TTL is later shortened.
    headers.set('Vercel-CDN-Cache-Control', `public, max-age=${MAX_AGE}`);

    return new Response(upstream.body, { status: 200, headers });
  },
};
