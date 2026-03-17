/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude backend directory from webpack bundling
    config.externals = [...(config.externals || []), 'backend'];
    return config;
  },
  // Ensure public, app, components are only Next.js directories
  eslint: {
    // Don't run ESLint on Python backend files
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
