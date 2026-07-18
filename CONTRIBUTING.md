# Contributing

Thanks for your interest in `@anil-labs`. This guide is intentionally short —
the [main README](./README.md) has the full project structure and dev
workflow.

## TL;DR

```bash
git clone https://github.com/anilkumarthakur60/calender.git
cd calender
pnpm install --frozen-lockfile
pnpm dev:wc        # see something render
pnpm check         # lint + format:check + typecheck + test
```

## What gets accepted

We're picky about scope — the library is small and stays that way. Good PRs:

- **Fix a bug** with a regression test.
- **Add a feature requested in an issue** (please open an issue first if it's
  more than ~30 lines).
- **Improve docs**.
- **Improve a11y / performance** with a measurement.

PRs that get pushback:

- Speculative refactors with no behaviour change.
- New options that could be done in user-land (combinators of existing options).
- Pulling in heavy runtime deps (`date-fns`, `dayjs`, Floating UI, …). Core is
  zero-dep on purpose.

## Branch + commit conventions

- Branch from `main`. Name like `feat/header-selectors` or `fix/range-leap`.
- Commit messages: imperative, present tense ("Add header selectors", not
  "Added"). Conventional Commits encouraged but not required.

## What CI checks

Every PR runs `.github/workflows/ci.yml` — see [`README.md` → CI/CD](./README.md#cicd-with-github-actions).

That's: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build`,
`pnpm test`, package checks (publint + arethetypeswrong), `pnpm build:apps`,
and `pnpm size`. All must pass.

Preview deployments for every adapter playground + the docs site are posted
to the PR run summary by `.github/workflows/preview.yml`.

## Adding a feature

The README has a [9-step recipe](./README.md#adding-a-new-feature-end-to-end)
for the typical engine → renderer → adapter → playground → docs flow. Follow
it and your PR will be easy to review.

## Releasing

Maintainers use [Changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset            # describe your change
git add . && git commit
```

The `release` workflow opens a "Version Packages" PR — merging that PR
publishes to npm.

## Code of Conduct

Be kind. See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).
