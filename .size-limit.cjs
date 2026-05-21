// Bundle-size budgets, enforced by size-limit in CI.
// Run `pnpm size` locally to see the report.
// Run `pnpm size:why` to inspect what's contributing.

module.exports = [
  {
    name: '@calender/core (ESM)',
    path: 'packages/core/dist/index.js',
    limit: '14 KB',
  },
  {
    name: '@calender/styles (compiled CSS)',
    path: 'packages/styles/dist/calender.css',
    limit: '6 KB',
  },
  {
    name: '@calender/web-component (ESM, includes core)',
    path: 'packages/web-component/dist/index.js',
    limit: '24 KB',
    import: '{ defineCalenderPicker }',
  },
  {
    // Includes the bundled core engine; framework deps excluded by `ignore`.
    name: '@calender/react (ESM, with core, excl. React)',
    path: 'packages/react/dist/index.js',
    limit: '15 KB',
    import: '{ DatePicker, DateField, useDatePicker }',
    ignore: ['react', 'react-dom'],
  },
  {
    name: '@calender/vue (ESM, with core, excl. Vue)',
    path: 'packages/vue/dist/index.js',
    limit: '15 KB',
    import: '{ DatePicker, DateField, useDatePicker }',
    ignore: ['vue'],
  },
];
