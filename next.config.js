const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
              "worker-src blob: 'self'",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https: wss:",
              "font-src 'self' https: data:",
              "frame-src 'self' https:",
              "media-src 'self' blob: https:",
            ].join('; '),
          },
          {
            // Allow camera/mic/screen-share inside cross-origin iframes (Daily.co)
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, display-capture=*, fullscreen=*',
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
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

module.exports = withSentryConfig(nextConfig, {
  org: 'akademo',
  project: 'node-cloudflare-workers',
  silent: true,
  // Disable server-side Sentry instrumentation (not compatible with Cloudflare edge)
  disableServerWebpackPlugin: true,
  // Only upload source maps if SENTRY_AUTH_TOKEN is available
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Tree-shake unused Sentry features (no Session Replay, no debug logging)
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayCanvas: true,
    excludeReplayWorker: true,
  },
});
