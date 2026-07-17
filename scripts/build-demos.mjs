// Assemble all framework playgrounds into a single static demos site.
//
//   dist-demos/
//     index.html      <- landing page (generated below)
//     wc/             <- wc-playground built with base=/wc/
//     react/          <- react-playground built with base=/react/
//     vue/ svelte/ solid/
//
// Run from the repo root:  pnpm build:demos
// Deploy dist-demos/ to any static host (or point a Vercel project's build
// command at this script with output directory dist-demos).

import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'dist-demos');

const run = cmd => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
};

const demos = [
  {
    slug: 'wc',
    filter: '@calender/wc-playground',
    dir: 'apps/wc-playground',
    label: 'Web Component',
    desc: '<calender-picker> + <calender-input> on plain HTML — the most thorough feature showcase.',
  },
  {
    slug: 'react',
    filter: '@calender/react-playground',
    dir: 'apps/react-playground',
    label: 'React',
    desc: '<DatePicker>, <DateField> and <DateRangeField> with the useDatePicker hook.',
  },
  {
    slug: 'vue',
    filter: '@calender/vue-playground',
    dir: 'apps/vue-playground',
    label: 'Vue 3',
    desc: '<DatePicker> and <DateField> components plus the useDatePicker composable.',
  },
  {
    slug: 'svelte',
    filter: '@calender/svelte-playground',
    dir: 'apps/svelte-playground',
    label: 'Svelte 5',
    desc: 'createDatePicker store driving a hand-rolled grid.',
  },
  {
    slug: 'solid',
    filter: '@calender/solid-playground',
    dir: 'apps/solid-playground',
    label: 'Solid',
    desc: 'createDatePicker signals with fine-grained updates.',
  },
];

// Fresh output dir.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Libraries first, then each playground with its subpath base.
run('pnpm -r --filter "./packages/**" run build');
for (const { slug, filter, dir } of demos) {
  run(`pnpm --filter ${filter} exec vite build --base=/${slug}/`);
  cpSync(join(root, dir, 'dist'), join(outDir, slug), { recursive: true });
}

// Landing page.
const cards = demos
  .map(
    ({ slug, label, desc }) => `      <a class="card" href="./${slug}/">
        <h2>${label}</h2>
        <p>${desc.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </a>`,
  )
  .join('\n');

writeFileSync(
  join(outDir, 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>@calender — live demos</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
    body { margin: 0 auto; max-width: 56rem; padding: 3rem 1.5rem; }
    h1 { font-size: 1.9rem; margin-bottom: 0.25rem; }
    .sub { opacity: 0.7; margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 1rem; }
    .card { display: block; padding: 1.25rem; border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
            border-radius: 0.75rem; text-decoration: none; color: inherit; }
    .card:hover { border-color: color-mix(in srgb, currentColor 45%, transparent); }
    .card h2 { margin: 0 0 0.4rem; font-size: 1.1rem; }
    .card p { margin: 0; font-size: 0.9rem; opacity: 0.75; }
    footer { margin-top: 2.5rem; font-size: 0.85rem; opacity: 0.6; }
  </style>
</head>
<body>
  <h1>@calender</h1>
  <p class="sub">One headless calendar engine, every framework. Pick a playground:</p>
  <div class="grid">
${cards}
  </div>
  <footer><a href="https://github.com/anilkumarthakur60/calender">GitHub</a></footer>
</body>
</html>
`,
);

console.log(`\nDemos site assembled at ${outDir}`);
