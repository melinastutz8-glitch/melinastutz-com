# melinastutz-com

Personal website of Melina Stutz, MSc student in Biomedicine at the University of Zurich, served at
<https://melinastutz.com/>. German (default) and English.

A **static** Next.js export (no server logic, no API, no database, no secrets), served by unprivileged nginx
in Dominic Furchert's k3s homelab. Conventions follow [furchert-ch](https://github.com/doemefu/furchert-ch);
see [DEPLOYMENT.md](DEPLOYMENT.md) for the runtime contract and the hand-over checklist.

## Stack

- Next.js 16 (App Router, `output: 'export'`), React 19, TypeScript 6, next-intl 4
- Self-hosted fonts via `next/font` (DM Sans, DM Mono, Newsreader), no third-party requests at runtime
- nginx-unprivileged 1.30 (stable) serving `out/`
- Vitest, ESLint
- GitHub Actions → multi-arch image on GHCR → Flux in the cluster

## Local development

Requires Node 22.23.4 (`.nvmrc`) and pnpm 9.15.4 (`corepack enable`).

```bash
pnpm install --frozen-lockfile
pnpm dev            # http://localhost:3000/de/
```

There is no middleware, so `http://localhost:3000/` has no page in dev; open `/de/` or `/en/`. In production
nginx redirects `/` to `/de/`.

## Checks and build

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build          # writes the static site to out/
```

## Container

```bash
docker build -t melinastutz-com:local .
docker run --rm --read-only --tmpfs /tmp --user 101:101 -p 8080:8080 melinastutz-com:local
# http://localhost:8080/  → 302 to /de/
scripts/smoke-test.sh melinastutz-com:local   # the CI smoke test
```

## Layout

| Path | What |
| --- | --- |
| `src/app/[locale]/` | Pages: home, research, cv, contact, imprint, privacy |
| `src/app/not-found.tsx` | The bilingual 404 page (`out/404.html`) |
| `src/app/[locale]/og-image.png/route.tsx` | Share image per locale, rendered at build time (`out/de/og-image.png`, `out/en/og-image.png`) |
| `src/i18n/messages/` | All page copy, `de.json` and `en.json` (same keys, tested) |
| `src/data/cv.ts` | CV data used by the home timeline and the CV page |
| `src/data/contact-email.ts` | The contact address, assembled only in the browser |
| `src/lib/seo/` | Metadata, sitemap dates, JSON-LD |
| `src/styles/globals.css` | Design tokens and styles (light and dark) |
| `nginx/default.conf` | Headers, cache rules, redirects, health check |
| `k8s/` | Manifests applied by Flux |
| `scripts/` | CI smoke test and k8s validation |

## Licence

Code adapted from furchert-ch (MIT, © Dominic Furchert); see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
Site content © Melina Fabienne Stutz.
