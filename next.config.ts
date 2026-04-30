import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
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
