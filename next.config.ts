import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  env: {
    NEXTAUTH_URL: process.env.NODE_ENV === 'production' ? 'https://vexo.social' : 'http://localhost:3002',
  },
};

export default nextConfig;
