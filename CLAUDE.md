# CLAUDE.md

Personal website of Melina Stutz. Static Next.js export served by nginx in Dominic Furchert's k3s homelab.
Read [DEPLOYMENT.md](DEPLOYMENT.md) before touching nginx, the Dockerfile, CI or `k8s/`.

## Working with Melina

Melina is not a programmer. Do all technical work yourself; ask her only for content, decisions, browser
sign-ins and clicks on GitHub. One task for her per message, in plain German (Swiss spelling, no ß), every
technical term explained once. Never ask for passwords or tokens in chat. She merges pull requests herself on
GitHub, only when every check is green.

## Stack and commands

Node 22.23.4 (`.nvmrc`), pnpm 9.15.4 (`packageManager`). Next.js 16 App Router, React 19, TypeScript 6,
next-intl 4, Vitest, ESLint.

```bash
pnpm install --frozen-lockfile
pnpm dev        # http://localhost:3000/de/
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # build writes out/
scripts/smoke-test.sh <image>   # container contract test (CI)
scripts/validate-k8s.sh         # kustomize + kubeconform, pinned (CI, Linux)
```

On Melina's Mac the tools live in `~/.local/bin`, which is not on PATH: prefix commands with
`export PATH="$HOME/.local/bin:$PATH"`.

## Rules

- **Static export only** (`output: 'export'`). Forbidden: Server Actions, route handlers with runtime logic,
  `middleware.ts` / `proxy.ts`, `headers()` / `redirects()` / `rewrites()` in `next.config`, `cookies()` /
  `headers()`, ISR / `revalidate`, runtime env variables. Dynamic segments only with `generateStaticParams`
  and `dynamicParams = false`. Metadata routes (`robots.ts`, `sitemap.ts`) use `dynamic = 'force-static'`.
- **No third-party requests at runtime**: fonts via `next/font` (downloaded at build), no CDNs, analytics,
  external scripts or iframes. That is why the site needs no cookie banner.
- **Pin everything exactly**: no `^`/`~` (`.npmrc` `save-exact=true`), commit `pnpm-lock.yaml`, install with
  `--frozen-lockfile`; images as `tag@sha256:<index digest>`; actions by commit SHA with a version comment.
  Never `latest`. New dependencies only after asking Melina.
- **nginx header trap**: an `add_header` in a `location` drops all server-level `add_header`s. Keep headers in
  the `server` block only; the smoke test checks them on every path class.
- **Runtime stage of the Dockerfile has no `RUN`**, so the multi-arch build needs no QEMU.
- **Contact address**: only through `<ContactEmail>` (assembled in the browser). Never write the address as one
  string anywhere in the repo or render it on the server; CI greps `out/` for it.
- URLs: `localePath()` for internal links (always a trailing slash); canonical, hreflang and sitemap URLs end
  with `/`.
- Copy lives in `src/i18n/messages/{de,en}.json` with identical keys (tested). CV facts live in
  `src/data/cv.ts`. Bump the page date in `src/lib/seo/pages.ts` when a page's content changes.
- Design follows the unslop direction in the header of `src/styles/globals.css`: tinted neutral ramp, one sage
  accent, serif only for headlines, sentence case, dates as `2017-08` in tabular figures, 4px grid.
- Everything in the repo (code, comments, docs, commit messages) is in English; site content in German and
  English.
- Work on a branch, open a pull request, never push to `main` directly (Flux commits image tags to `main`, so
  `git pull` first). No force pushes.
- **Never touch the cluster** (`kubectl apply`, `flux`, `helm`), Cloudflare, DNS or Dominic's other repositories,
  and do not change repository or package settings without Melina.

## Content still missing

`<Pending>` blocks on the research page mark content Melina has not supplied yet (research question, lab
methods, projects, posters). `LINKEDIN_URL` in `src/data/cv.ts` is empty until she sends it. All of these must be
filled or removed before the site goes live.
