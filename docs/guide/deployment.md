# Deployment

The repo has two independent, secret-free deploy targets: the **demos site**
(all framework examples, on Vercel) and the **docs site** (this VitePress site,
on GitHub Pages).

## Demos → Vercel (one project)

`scripts/build-demos.mjs` builds every example and assembles them into a single
static site under `dist-demos/`:

```
dist-demos/
  index.html      # landing page linking each demo
  wc/             # example-wc     built with base=/wc/
  react/          # example-react  built with base=/react/
  vue/  svelte/  solid/
```

The root `vercel.json` points **one** Vercel project at that script:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "node scripts/build-demos.mjs",
  "outputDirectory": "dist-demos",
  "installCommand": "pnpm install"
}
```

### One-time setup

1. Push the repo to GitHub.
2. On vercel.com, click **Add New → Project** and import the repo.
3. Keep **Root Directory** at `/` (Vercel reads the root `vercel.json`).
4. Click **Deploy**.

That's it  **no tokens, no GitHub secrets, no per-app matrix**. Vercel's native
Git integration then deploys `main` to production and posts a preview URL on
every pull request automatically.

Reproduce the exact build locally with:

```bash
pnpm build:demos
npx serve dist-demos
```

## Docs → GitHub Pages

`.github/workflows/docs.yml` builds this VitePress site and publishes it to
GitHub Pages on every push to `main` that touches `docs/**` (or via **Run
workflow**). Enable it once under **Settings → Pages → Source: GitHub Actions**.

The workflow sets `DOCS_BASE=/calender/` so assets resolve under the
project-site path (`<user>.github.io/calender/`). The VitePress config reads it
and falls back to `/` for local dev and custom domains:

```ts
// docs/.vitepress/config.ts
export default defineConfig({
  base: process.env.DOCS_BASE ?? '/',
  // …
});
```

Using a custom domain (e.g. `calender.dev`)? Leave `DOCS_BASE` unset (or set it
to `/`) and add the domain in the Pages settings.

## CI

`.github/workflows/ci.yml` runs on every push and PR: lint, format check, build,
typecheck, test, package checks (publint + arethetypeswrong), a Node import
smoke test, `build:examples`, and the size budgets  on Node 22, 24, and 26. It does
not deploy anything; deployment is handled by Vercel (demos) and the Docs
workflow (docs).

## Local build to verify

```bash
pnpm install --frozen-lockfile
pnpm build:all        # packages + every example
pnpm build:demos      # the exact Vercel artifact → dist-demos/
pnpm docs:build       # the exact Pages artifact → docs/.vitepress/dist
```
