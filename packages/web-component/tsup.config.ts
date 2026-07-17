import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/auto-register.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: 'es2022',
    splitting: false,
    external: ['@calender/core'],
  },
  {
    // CDN drop-in build: one <script> tag registers <calender-picker> and the
    // input element, with the core engine bundled in.
    entry: ['src/auto-register.ts'],
    format: ['iife'],
    globalName: 'CalenderWC',
    sourcemap: true,
    clean: false,
    target: 'es2022',
    minify: true,
    noExternal: ['@calender/core'],
  },
]);
