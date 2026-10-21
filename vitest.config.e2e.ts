import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // swc emits the decorator metadata that NestJS and @nestjs/mongoose rely on (the default transformer does not).
  plugins: [tsconfigPaths(), swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    setupFiles: ['./test/setup-env.ts'],
    // Each file boots the full app on its own in-memory MongoDB; the first run may download the binary.
    testTimeout: 30_000,
    hookTimeout: 180_000,
  },
});
