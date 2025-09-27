import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 🚫 Ignores ESLint errors during production builds (`next build`)
    ignoreDuringBuilds: true,
  },

};

export default nextConfig;
