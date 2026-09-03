export default {
  async fetch(request) {
    const url = new URL(request.url);
    const supabaseUrl = `https://hjldktzxzeaxqvoxoesc.supabase.co${url.pathname}${url.search}`;

    const CACHED_PATHS = [
      "/storage/v1/object/public/products/",
    ];

    const isStaticAsset = CACHED_PATHS.some(path => url.pathname.startsWith(path));

    const response = await fetch(supabaseUrl, {
      cf: isStaticAsset
        ? { cacheEverything: true, cacheTtl: 2592000 }
        : { cacheEverything: false }
    });

    const newResponse = new Response(response.body, response);

    if (isStaticAsset) {
      // Product images get a fresh random filename on every upload, so a cached
      // object is never stale — safe to cache at the edge for the full 30 days.
      newResponse.headers.set("Cache-Control", "public, max-age=2592000, immutable");
    } else {
      newResponse.headers.set("Cache-Control", "no-store");
    }

    return newResponse;
  }
};
