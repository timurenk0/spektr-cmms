import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "imgs.search.brave.com",
        pathname: "/**"
      }
    ]
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  }
};

export default nextConfig;
