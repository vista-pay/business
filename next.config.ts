import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Done at the routing layer instead of a root page.tsx that calls redirect():
  // under cacheComponents/partialPrefetching, throwing NEXT_REDIRECT during the
  // prerender breaks `instant` shell validation for "/".
  async redirects() {
    return [{ source: "/", destination: "/overview", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
