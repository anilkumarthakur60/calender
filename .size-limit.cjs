// Bundle-size budgets, enforced by size-limit in CI.
// Run `pnpm size` locally to see the report.
// Run `pnpm size:why` to inspect what's contributing.

module.exports = [
  {
    name: '@anil-labs/calendar-core (ESM)',
    path: 'packages/core/dist/index.js',
    limit: '14 KB',
  },
  {
    name: '@anil-labs/calendar-styles (compiled CSS)',
    path: 'packages/styles/dist/calender.css',
    limit: '6 KB',
  },
  {
    name: '@anil-labs/calendar-web-component (ESM, includes core)',
    path: 'packages/web-component/dist/index.js',
    limit: '24 KB',
    import: '{ defineCalenderPicker }',
  },
  {
    // Includes the bundled core engine; framework deps excluded by `ignore`.
    name: '@anil-labs/calendar-react (ESM, with core, excl. React)',
    path: 'packages/react/dist/index.js',
    limit: '18 KB',
    import: '{ DatePicker, DateField, useDatePicker }',
    ignore: ['react', 'react-dom'],
  },
  {
    name: '@anil-labs/calendar-vue (ESM, with core, excl. Vue)',
    path: 'packages/vue/dist/index.js',
    limit: '17 KB',
    import: '{ DatePicker, DateField, useDatePicker }',
    ignore: ['vue'],
  },
  {
    name: '@anil-labs/calendar-svelte (ESM, excl. core)',
    path: 'packages/svelte/dist/index.js',
    limit: '2 KB',
    ignore: ['@anil-labs/calendar-core'],
  },
  {
    name: '@anil-labs/calendar-solid (ESM, excl. core & solid-js)',
    path: 'packages/solid/dist/index.js',
    limit: '2 KB',
    ignore: ['@anil-labs/calendar-core', 'solid-js'],
  },
  {
    // The CDN drop-in script  minified IIFE with core bundled.
    name: '@anil-labs/calendar-web-component (CDN auto-register, minified)',
    path: 'packages/web-component/dist/auto-register.global.js',
    limit: '40 KB',
  },
];
