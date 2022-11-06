// https://vitejs.dev/config/
import { defineConfig, UserConfigExport } from 'vitest/config';

export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      name: 'index.mjs',
      entry: './index.ts',
      minify: false,
    },
    rollupOptions: {
      external: 'react',
      output: {
        globals: { react: 'react' },
      },
    },
  },
} as UserConfigExport);
