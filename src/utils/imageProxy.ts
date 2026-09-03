// Rewrites a raw Supabase Storage public URL to the Vercel Edge Function
// (`api/img/[...path].ts`) that caches it on Vercel's CDN for 30 days. See that
// file for why the app-level proxy exists.
//
// Any URL that is not a Supabase public-object URL for an allow-listed bucket is
// returned untouched, so this is always safe to wrap around a value that might be
// a local path, a placeholder, or already-proxied.

const SUPABASE_STORAGE_BASE = 'https://hjldktzxzeaxqvoxoesc.supabase.co';
const PROXY_BASE = '/api/img';

// Keep in sync with ALLOWED_PREFIX(ES) in api/img/[...path].ts. Currently only
// the `products` bucket is proxied; `orders` is added in a later change together
// with the Edge Function allow-list.
const PROXYABLE = /\/storage\/v1\/object\/public\/(products)\//;

export function toProxiedImageUrl(
  url?: string | null,
  opts?: { absolute?: boolean },
): string {
  if (!url) return '';
  if (!url.startsWith(SUPABASE_STORAGE_BASE) || !PROXYABLE.test(url)) return url;

  const path = url.replace(SUPABASE_STORAGE_BASE, PROXY_BASE);
  return opts?.absolute && typeof window !== 'undefined'
    ? `${window.location.origin}${path}`
    : path;
}
