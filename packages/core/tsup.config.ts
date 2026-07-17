import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: 'es2022',
    splitting: false,
    minify: false,
  },
  {
    // CDN drop-in build: <script src="https://unpkg.com/@anil-labs/core"></script>
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'CalenderCore',
    sourcemap: true,
    clean: false,
    target: 'es2022',
    minify: true,
  },
]);
