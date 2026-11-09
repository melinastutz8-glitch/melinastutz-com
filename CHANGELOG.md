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
- Hardened Deployment (`enableServiceLinks: false`, 5 s `preStop` sleep, probe timings) and PDB
  (`unhealthyPodEvictionPolicy: AlwaysAllow`); the image tag is a placeholder until the first `main` build.
- DEPLOYMENT.md with the runtime contract and the hand-over for Dominic (order of first deployment, Cloudflare
  zone in the tunnel's account, Flux names, rulesets, go-live gate, CI coverage per event).
- Glowing DNA as an eye-catcher, large in the home hero and as a band in the research page head: the first base
  pairs of the human mitochondrial genome (rCRS, NC_012920.1) as ideal B-DNA from the all-atom fiber model of
  Chandrasekaran & Arnott (via 3DNA, BSD), drawn on a canvas in luminous mint on deep green with bloom, soft
  background helices and drifting specks, no legend. The backbones run through the real phosphorus atoms, one
  rung per base pair; right-handedness (also with the diagonal roll), strand polarity and hydrogen-bond geometry
  are unit-tested. Turns slowly, pauses off screen, stands still with reduced motion. The timeline moved to its
  own section below the home hero.
- Privacy notice for the Swiss FADP (Cloudflare with the Swiss-U.S. Data Privacy Framework, iCloud Mail,
  retention periods, reporting to the FDPIC) and an imprint with notes on copyright and licences.

[Unreleased]: https://github.com/melinastutz8-glitch/melinastutz-com/commits/main
