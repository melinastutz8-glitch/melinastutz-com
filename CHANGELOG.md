# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Static Next.js 16 site in German and English: home with a timeline of hospital work and education, research,
  CV, contact, imprint, privacy and a bilingual 404 page.
- Design system: paper-tinted neutral ramp, one sage accent, Newsreader headlines with DM Sans, light and dark
  following the system setting, lab-notebook dates in tabular figures.
- SEO basics adapted from furchert-ch: canonical and hreflang metadata, sitemap with per-page `lastmod`,
  `robots.txt` with Content Signals, `llms.txt`, JSON-LD (WebSite, Person, ProfilePage).
- Contact address assembled only in the browser; CI checks it never appears in `out/`.
- nginx-unprivileged image (read-only root, UID 101, port 8080) with security headers, cache rules, locale and
  trailing-slash redirects and `/healthz`.
- CI with lint, typecheck, unit tests, build, pinned kustomize/kubeconform validation and a container smoke
  test; multi-arch build and push to GHCR with Flux tags; CodeQL; Dependabot for npm, actions and both base
  images.
- Kubernetes manifests for Flux: Deployment (2 replicas, hardened), Service, NetworkPolicy, PodDisruptionBudget.
- Full licence texts (furchert-ch: MIT; Lucide: ISC and MIT; DM Sans, DM Mono, Newsreader: SIL OFL 1.1)
  published with the site at `/third-party-notices.txt` and linked from the imprint; `THIRD_PARTY_NOTICES.md`
  carries the same notices.
- Share image for link previews: a static 1200×630 PNG per locale (`/de/og-image.png`, `/en/og-image.png`),
  rendered at build time by `next/og`, referenced by every page as `og:image` and `twitter:image`.

### Changed

- Deployment: `enableServiceLinks: false`, a 5 s `preStop` sleep so cloudflared gets no 502s during rollouts,
  readiness probe every 5 s, liveness timeout 2 s; the image tag is marked as a placeholder until the first
  `main` build.
- PodDisruptionBudget: `unhealthyPodEvictionPolicy: AlwaysAllow`; comments state that it guards manual drains
  only, while the spread over nodes covers reboots.
- DEPLOYMENT.md: hand-over rewritten with the order of first deployment, the Cloudflare zone in the tunnel's
  account, exact Flux object and secret names, ruleset notes, a go-live gate and the CI coverage per event.
- Privacy notice rewritten for the Swiss FADP: Cloudflare with the Swiss-U.S. Data Privacy Framework, iCloud
  Mail, retention periods and the right to report to the FDPIC.
- Imprint: notes on the private, non-commercial site and on external links; copyright and licences.
- Sitemap with one entry per language.
- Mobile menu and landmark fixes; smaller client bundle.
- `llms.txt` describes the research page as it is now (motivation and interests) and the hospital years
  accurately.
- DEPLOYMENT.md: open points for Dominic on data protection roles and a processing agreement (14-day log
  retention, Cloudflare features), the access log format, iCloud Mail and a yearly check of Cloudflare's DPF
  certification.

[Unreleased]: https://github.com/melinastutz8-glitch/melinastutz-com/commits/main
