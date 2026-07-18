import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  experimental: { cpus: 1 },
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
};
export default nextConfig;
