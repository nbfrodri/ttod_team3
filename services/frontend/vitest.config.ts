/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig so vitest can resolve `.astro` imports for container API tests.
export default getViteConfig({
  test: {
    exclude: [
      'node_modules/**',
      'dist/**',
      'e2e/**',
      'src/components/graph/layout.test.mjs'
    ]
  }
});
