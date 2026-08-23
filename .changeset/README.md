# Changesets

This directory tracks pending releases.

## Why?

This repo uses [Changesets](https://github.com/changesets/changesets) to manage
versioning and changelogs across the eight `@anil-labs/*` packages. The
`linked` config keeps every public package on the same version number — when
you cut a release, they all move in lock-step. That matches user expectations
("I installed `@anil-labs/calendar-react@1.2.0`, so my `@anil-labs/calendar-core` is 1.2.0 too").

## How to add a changeset

For any user-facing change (feature, fix, breaking change):

```bash
pnpm changeset
```

It asks:

1. **Which packages are affected?** Select with arrow + space.
2. **What kind of bump?** `patch` for bug fixes, `minor` for features,
   `major` for breaking changes.
3. **Write a summary.** This goes straight to the public CHANGELOG, so be
   clear: "Add `headerSelectors` prop to `DatePicker`" — not "tweak picker".

The command writes a markdown file in this directory. Commit it with your PR.

## How releases happen

On every push to `main`:

1. `.github/workflows/release.yml` runs `changesets/action`.
2. If there are pending changesets, it opens (or updates) a PR titled
   **"chore: version packages"** that bumps the versions + writes per-package
   CHANGELOGs + clears the pending changesets.
3. When a maintainer merges that PR, the same workflow re-runs and **publishes
   to npm** (`pnpm -r publish --access public`).

## Empty / no-op PRs

If your PR doesn't need a release (docs-only, build-only, refactor), skip
`pnpm changeset` — CI tolerates the absence on docs/CI changes.
