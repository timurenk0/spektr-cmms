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
  logging: process.env.NODE_ENV === "development" ? {
    fetches: {
      fullUrl: true,
    },
  }: undefined,
  reactStrictMode: true
};

export default nextConfig;
