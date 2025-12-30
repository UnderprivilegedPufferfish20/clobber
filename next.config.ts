import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb"
    }
  },
  images: {
    remotePatterns: [new URL("https://lh3.googleusercontent.com/**")]
  },
  cacheComponents: true,
};

export default nextConfig;
