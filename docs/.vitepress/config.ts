import { defineConfig } from 'vitepress';

export default defineConfig({
  // '/' for local dev and custom domains; the Pages workflow sets DOCS_BASE
  // to the project-site path (e.g. '/calender/').
  base: process.env.DOCS_BASE ?? '/',
  title: '@anil-labs',
  description:
    'Headless, framework-agnostic calendar / date-picker for React, Vue, Svelte, Solid, Angular & Web Components. AD + Bikram Sambat.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/calendar.svg' }],
    ['link', { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css' }],
  ],

  vite: {
    // Don't try to parse <calender-picker> / <calender-input> as Vue components
    //  they're registered as custom elements at runtime.
    server: { port: 5179 },
  },

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: tag => tag.startsWith('calender-'),
      },
    },
  },

  themeConfig: {
    logo: '/calendar.svg',
    siteTitle: '@anil-labs',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Adapters', link: '/adapters/react' },
      { text: 'API', link: '/api/engine' },
      {
        text: 'Playgrounds',
        items: [
          { text: 'Web Component', link: 'http://localhost:5180' },
          { text: 'React', link: 'http://localhost:5174' },
          { text: 'Vue', link: 'http://localhost:5173' },
          { text: 'Svelte', link: 'http://localhost:5175' },
          { text: 'Solid', link: 'http://localhost:5176' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Concepts', link: '/guide/concepts' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Selection modes', link: '/guide/selection-modes' },
            { text: 'Form integration', link: '/guide/forms' },
            { text: 'Format & parsing', link: '/guide/formats' },
            { text: 'Calendar systems (AD / BS)', link: '/guide/bs-calendar' },
            { text: 'Time & DateTime', link: '/guide/time' },
            { text: 'Navigation', link: '/guide/navigation' },
            { text: 'Visual options', link: '/guide/visual' },
            { text: 'Constraints', link: '/guide/constraints' },
            { text: 'Presets & shortcuts', link: '/guide/presets' },
          ],
        },
        {
          text: 'Recipes',
          items: [
            { text: 'Cookbook', link: '/guide/cookbook' },
            { text: 'Linked pickers', link: '/guide/linked-pickers' },
            { text: 'Server-side rendering', link: '/guide/ssr' },
          ],
        },
        {
          text: 'Ops',
          items: [{ text: 'Deployment', link: '/guide/deployment' }],
        },
      ],
      '/adapters/': [
        {
          text: 'Adapters',
          items: [
            { text: 'Web Component', link: '/adapters/web-component' },
            { text: 'React', link: '/adapters/react' },
            { text: 'Vue 3', link: '/adapters/vue' },
            { text: 'Svelte', link: '/adapters/svelte' },
            { text: 'Solid', link: '/adapters/solid' },
            { text: 'Angular', link: '/adapters/angular' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API reference',
          items: [
            { text: 'Engine', link: '/api/engine' },
            { text: 'Options', link: '/api/options' },
            { text: 'Types', link: '/api/types' },
            { text: 'Presets', link: '/api/presets' },
            { text: 'Format engine', link: '/api/format' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/' }],

    footer: {
      message: 'Released under MIT.',
      copyright: 'Built with 💙  @anil-labs',
    },

    search: { provider: 'local' },
  },
});
