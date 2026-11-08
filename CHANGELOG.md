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
