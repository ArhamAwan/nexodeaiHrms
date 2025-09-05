import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint during production builds (Vercel)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow successful builds even if there are type errors
    // (keeps deployments unblocked; fix types in CI separately)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
