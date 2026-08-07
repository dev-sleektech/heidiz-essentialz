import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Unsplash-hosted stock photography standing in for real product
    // photography (see src/lib/placeholder-data.ts). Remove once the
    // catalog moves to the client's own images/CDN.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
