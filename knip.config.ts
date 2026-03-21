/**
 * Knip - Dead code detection config
 * Run: npm run knip
 * 
 * NOTE: Requires Node.js < 24 due to fast-glob null-byte bug.
 * Use `nvm use 22` or similar before running.
 */
import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/app/**/page.tsx',
    'src/app/**/layout.tsx',
    'src/app/**/route.ts',
    'src/middleware.ts',
  ],
  project: [
    'src/**/*.ts',
    'src/**/*.tsx',
  ],
  ignore: [
    'scripts/**',
    'migrations/**',
    'docs/**',
    'workers/**',
    'packages/**',
  ],
  ignoreDependencies: [
    '@cloudflare/workerd-windows-64',
    'autoprefixer',
    'postcss',
    'tailwindcss',
    'wrangler',
    '@daily-co/daily-js',
    '@opennextjs/cloudflare',
  ],
};

export default config;
