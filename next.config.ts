import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Baked in once, when this config module loads at `next build` time — not
  // per-request — so the footer can show a real "last deployed" stamp.
  // VERCEL_GIT_COMMIT_SHA is a Vercel System Environment Variable, present
  // automatically on Vercel builds; falls back to "local" for local builds.
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_BUILD_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
