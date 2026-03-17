/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      // Ensure backend Python code isn't bundled
    },
  },
};

export default nextConfig;

