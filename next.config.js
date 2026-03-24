/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  // Force clean build v2
  turbopack: {
    root: __dirname,
    resolveAlias: {
      '@': __dirname,
      '@/lib': `${__dirname}/lib`,
      '@/lib/auth-utils': `${__dirname}/lib/auth-utils.ts`,
      '@/lib/suno/music-service': `${__dirname}/lib/suno/music-service.ts`,
      '@/lib/subscription/subscription-service': `${__dirname}/lib/subscription/subscription-service.ts`,
    },
  },
  webpack: (config, { isServer }) => {
    // Ignore the music API directory to prevent git-cached broken routes from building
    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /app\/api\/music/ }
      ];
    }
    return config;
  },
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Headers for security and performance
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ],
    },
  ],
};

export default nextConfig;


