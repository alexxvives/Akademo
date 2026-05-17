/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5gb',
    },
    // Tree-shake barrel-export packages so webpack doesn't create dozens of
    // tiny chunks for every named import (major source of chunk explosion).
    optimizePackageImports: [
      '@headlessui/react',
      'recharts',
      'date-fns',
      'framer-motion',
      'motion',
    ],
  },
  // Enable compression and optimize images
  compress: true,
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });

    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          // Keep parallel requests low — ERR_INSUFFICIENT_RESOURCES happens
          // when the browser opens too many file handles at once.
          maxInitialRequests: 15,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // React core — tiny, always needed, long-lived cache.
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Modules shared by 2+ pages → single "commons" chunk.
            // (Removed the per-module hash "lib" group — that was the
            //  main culprit, creating 10-15 extra chunks per page load.)
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
