# Deployment

Every app in this repo (the VitePress docs and each playground) is a **static
build** — `dist/` contains plain HTML/JS/CSS. Any static host works.

## What gets deployed

| App                      | Output                        | Suggested URL         |
| ------------------------ | ----------------------------- | --------------------- |
| `apps/docs`              | `apps/docs/.vitepress/dist`   | `calender.dev` (root) |
| `apps/wc-playground`     | `apps/wc-playground/dist`     | `wc.calender.dev`     |
| `apps/react-playground`  | `apps/react-playground/dist`  | `react.calender.dev`  |
| `apps/vue-playground`    | `apps/vue-playground/dist`    | `vue.calender.dev`    |
| `apps/svelte-playground` | `apps/svelte-playground/dist` | `svelte.calender.dev` |
| `apps/solid-playground`  | `apps/solid-playground/dist`  | `solid.calender.dev`  |

## Recommended: Vercel — separate project per app

The repo ships with **6 `vercel.json` files** (one per app) and a **GitHub
Actions workflow** that deploys each on push to `main`. Each app lives at its
own Vercel project; mapping subdomains is then a one-click step in the Vercel
dashboard.

### One-time setup (per app)

1. Push the repo to GitHub.
2. On vercel.com, click **Add New → Project** and import the repo.
3. **Important** — in the project settings, set:
   - **Root Directory** → `apps/<app>` (e.g. `apps/wc-playground`)
   - **Framework Preset** → leave Vercel to read from `vercel.json` (it auto-detects)
4. Click **Deploy**.
5. Repeat for each of the 6 apps. Each lands at `https://<project>.vercel.app`.

Each project's `vercel.json` already contains the correct monorepo-aware
install/build commands:

```json
{
  "framework": "vite",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm -r --filter \"./packages/**\" run build && pnpm --filter @calender/<app> run build",
  "outputDirectory": "dist",
  "cleanUrls": true
}
```

### Custom domains

In each project's settings → **Domains**, add the subdomain you want
(`wc.calender.dev`, `react.calender.dev`, …). Vercel walks you through DNS
setup (CNAME or `cname.vercel-dns.com`).

### GitHub Actions auto-deploy

`.github/workflows/deploy.yml` deploys all six apps on every push to `main` —
in parallel, via the Vercel CLI. To enable it, add these secrets to the GitHub
repo (Settings → Secrets and variables → Actions):

| Secret                     | Where to get it                                                |
| -------------------------- | -------------------------------------------------------------- |
| `VERCEL_TOKEN`             | vercel.com → Account Settings → Tokens                         |
| `VERCEL_ORG_ID`            | run `vercel link` once locally, look in `.vercel/project.json` |
| `VERCEL_PROJECT_ID_DOCS`   | each project's Settings → General → Project ID                 |
| `VERCEL_PROJECT_ID_WC`     |                                                                |
| `VERCEL_PROJECT_ID_REACT`  |                                                                |
| `VERCEL_PROJECT_ID_VUE`    |                                                                |
| `VERCEL_PROJECT_ID_SVELTE` |                                                                |
| `VERCEL_PROJECT_ID_SOLID`  |                                                                |

The same matrix-style workflow also runs preview deploys on every PR
(`.github/workflows/preview.yml`).

::: tip Auto-deploy without Actions
If you'd rather not maintain the CI yourself, **delete the workflows** and let
Vercel's native git integration handle it. Each project's "Git" tab on Vercel
already watches the repo — every push triggers a deploy, preview branches get
preview URLs automatically. The workflows are there if you want more control or
a single source of truth.
:::

## Alternative: Cloudflare Pages

Best free tier (unlimited bandwidth, fast CDN, free custom domains).

Per app, create a Pages project pointing at this repo with:

- **Root directory**: `/` (the monorepo root)
- **Build command**: `pnpm install --frozen-lockfile && pnpm -r --filter "./packages/**" run build && pnpm --filter @calender/<app> run build`
- **Build output directory**: `apps/<app>/dist`
- **Env vars**: `NODE_VERSION=20`, `PNPM_VERSION=10`

## Alternative: Netlify

Per app, create a site with:

- **Base directory**: `apps/<app>`
- **Build command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm -r --filter "./packages/**" run build && pnpm --filter @calender/<app> run build`
- **Publish directory**: `apps/<app>/dist`
- **Env vars**: `NODE_VERSION=20`, `PNPM_VERSION=10`

A `netlify.toml` per app would mirror the `vercel.json` shapes.

## Alternative: GitHub Pages

One Pages site under `<user>.github.io/calender/` with subpaths.
**Tradeoff**: each playground needs Vite's `base` set to its subpath
(`base: '/calender/wc/'`, etc.) so assets resolve correctly.

A `.github/workflows/gh-pages.yml` would build everything and publish to the
`gh-pages` branch using `peaceiris/actions-gh-pages` or similar. Not included
by default — pick Vercel/Cloudflare instead if you have a choice.

## Local build to verify

```bash
pnpm install --frozen-lockfile
pnpm build:all          # builds packages + every app
ls apps/docs/.vitepress/dist
ls apps/wc-playground/dist
```

Then `npx serve apps/docs/.vitepress/dist` (or any static server) to preview
before pushing.
