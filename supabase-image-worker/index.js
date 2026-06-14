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
        ? { cacheEverything: true, cacheTtl: 86400 }
        : { cacheEverything: false }
    });

    const newResponse = new Response(response.body, response);

    if (isStaticAsset) {
      newResponse.headers.set("Cache-Control", "public, max-age=86400");
    } else {
      newResponse.headers.set("Cache-Control", "no-store");
    }

    return newResponse;
  }
};
