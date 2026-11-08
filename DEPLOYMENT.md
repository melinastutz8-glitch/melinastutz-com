# Deployment

The site is a static export served by nginx in Dominic's k3s homelab. This repository builds and publishes the
image and carries the Kubernetes manifests; **Dominic does the deployment** (Flux, Cloudflare, DNS). Nobody
runs `kubectl apply` from this repository.

```
Browser → Cloudflare (TLS, www → apex) → Cloudflare Tunnel (cloudflared, ns platform)
        → Service melinastutz-com.apps.svc.cluster.local:8080 → nginx pod (static files)
```

## Contract

| Item | Value |
| --- | --- |
| Image | `ghcr.io/melinastutz8-glitch/melinastutz-com` |
| Platforms | `linux/amd64`, `linux/arm64` (one manifest list; CI fails if either is missing) |
| Tags | `main-<UTC %Y%m%dT%H%M%S>` (Flux ImagePolicy `^main-[0-9]{8}T[0-9]{6}$`) and the short commit SHA |
| Port | 8080, plain HTTP (TLS ends at Cloudflare) |
| User | UID/GID 101 (`nginx` in nginx-unprivileged), non-root |
| Filesystem | read-only root; only `/tmp` is written (pid file and nginx temp paths, set by the image's `nginx.conf`) |
| Probes | `GET /healthz` → `200 ok` (startup, readiness, liveness) |
| Env, secrets, ConfigMaps | none |
| Namespace / labels | `apps`, `app: melinastutz-com` |
| Replicas | 2, spread over nodes, PodDisruptionBudget `minAvailable: 1` |
| Network | NetworkPolicy: ingress on 8080 only from `platform/cloudflared` (`pod: cloudflared`); egress open |

### Image tag updates

`k8s/deployment.yaml` carries the Flux setter comment on the image line:

```yaml
image: ghcr.io/melinastutz8-glitch/melinastutz-com:main-<ts> # {"$imagepolicy": "flux-system:melinastutz-com"}
```

Flux commits new tags **directly to `main`**. `build.yml` ignores `k8s/**`, so those commits do not trigger a
new build. Always `git pull` before starting new work.

## nginx behaviour (`nginx/default.conf`)

| Request | Response |
| --- | --- |
| `/` | `302`, `Location: /de/` (relative) |
| `/de/cv` (directory without slash) | `301`, `Location: /de/cv/` (relative, no host, no `:8080`) |
| `/de/cv/` | `200`, `index.html` |
| unknown path | `404` with the site's own `404.html` |
| `/.git/…`, `/.env`, any hidden path except `/.well-known/` | `404` |
| `/healthz` | `200 ok`, not logged |

`absolute_redirect off` and `port_in_redirect off` keep redirects relative behind the tunnel. `server_tokens off`
hides the nginx version. gzip is on for text types.

### Cache-Control

| Path class | Cache-Control |
| --- | --- |
| `/_next/static/*` (hashed, fonts included) | `public, max-age=31536000, immutable` |
| Images, fonts, `.svg`, `.ico` outside `/_next/static/` | `public, max-age=86400` |
| Everything else: HTML, RSC `*.txt`, `robots.txt`, `sitemap.xml`, `llms.txt`, all redirects, 404 | `no-cache` |

Redirects are `no-cache` on purpose, so a browser never keeps a redirect for a day.

### Security headers

Set once in the `server` block with `always`, so they appear on 200, redirect and 404 responses. **No
`add_header` inside a `location`**: nginx would drop the whole server-level list for that location. The CI smoke
test checks every header (exactly once) on HTML, a static asset, a redirect, the 404 page and `/healthz`.

| Header | Value | Why |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | No MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Same as furchert-ch |
| `X-Frame-Options` | `DENY` | No framing (legacy browsers) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | The site needs none |
| `Strict-Transport-Security` | `max-age=86400` | Starts at one day without `includeSubDomains`/`preload`; raise later (furchert-ch: one year). Edge HSTS at Cloudflare stays off so there is exactly one header |
| `Content-Security-Policy` | `frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'` | Enforced part: things the site never needs |
| `Content-Security-Policy-Report-Only` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'` | Full allow-list, observed before enforcing; `'unsafe-inline'` for Next's inline bootstrap |

## Search engines and AI crawlers

- `robots.txt` (from `src/app/robots.ts`): allow all, `Content-Signal: search=yes, ai-input=yes, ai-train=no`,
  sitemap URL. If Cloudflare's managed robots.txt is enabled, it is prepended; it never sets `ai-input`, so that
  signal comes from this file.
- `sitemap.xml`: every page with `lastmod` from `src/lib/seo/pages.ts` and hreflang alternates.
- `llms.txt`: plain-language summary for AI assistants.
- Canonical, hreflang (`de`, `en`, `x-default` → German) and sitemap URLs all end with `/`.

## Contact address

The address is assembled in the browser only (`src/data/contact-email.ts`, `<ContactEmail>`). CI greps `out/`
and fails if it appears. Cloudflare's *Email Address Obfuscation* is therefore not needed for it; Dominic decides
whether to leave it on.

## Hand-over checklist for Dominic

This repository lives on **Melina's** account (`melinastutz8-glitch/melinastutz-com`), not on `doemefu`, as
agreed with Dominic. That changes who clicks some settings; the steps are otherwise as in the brief.

1. **Repo access for Flux.** Flux needs a deploy key **with write access** (it reads `./k8s` and pushes tag
   updates to `main`). On a personal repository only the owner can add deploy keys, so: Dominic generates the key
   pair and sends Melina the **public** key; Melina adds it under *Settings → Deploy keys* with *Allow write
   access*. If `main` gets a ruleset later, deploy keys need a bypass.
2. **GHCR package visibility.** After the first `main` build, the package `melinastutz-com` exists under
   Melina's account. Melina switches it to **Public** (*Package settings → Change visibility*). Check with an
   anonymous `docker pull ghcr.io/melinastutz8-glitch/melinastutz-com:<tag>`.
3. **Cloudflare.** Zone `melinastutz.com` (nameservers at the registrar), proxied CNAMEs for the apex and `www`
   to the tunnel, Redirect Rule `www.melinastutz.com` → 301 to
   `concat("https://melinastutz.com", http.request.uri.path)`, *Always Use HTTPS* on, **edge HSTS off** (the
   header comes from nginx), decide on Email Address Obfuscation and managed robots.txt.
4. **Flux objects** after the pattern of `cluster/apps/furchert-ch/` in `doemefu/homelab`:
   GitRepository `ssh://git@github.com/melinastutz8-glitch/melinastutz-com` (branch `main`) with the deploy-key
   secret; Kustomization on `./k8s`; ImageRepository `ghcr.io/melinastutz8-glitch/melinastutz-com`; ImagePolicy
   `^main-[0-9]{8}T[0-9]{6}$` (alphabetical, asc); ImageUpdateAutomation on `./k8s` (setters, push to `main`).
5. **Tunnel route** `melinastutz.com` → `http://melinastutz-com.apps.svc.cluster.local:8080` in
   `cf_ingress_body`, before the `http_status:404` rule, playbook 40.
6. **Verify:** `curl -sI https://melinastutz.com/` (302 to `/de/`, headers present, exactly one HSTS line),
   `curl -sI https://www.melinastutz.com` (301), `curl -s https://melinastutz.com/robots.txt`, and
   `kubectl -n apps get pods -l app=melinastutz-com -o wide` shows the two pods on different nodes.

### Open points for Dominic

- The privacy notice says the site runs on a privately operated server in Switzerland behind Cloudflare and
  that access logs are kept only as long as needed. Please confirm the server location and tell us the actual
  log retention (nginx logs go to stdout; whatever collects them decides), so the text can be exact.
- Resource limits (`cpu: 200m`, `memory: 64Mi`) are the brief's values; they were not load-tested locally
  (no Docker on Melina's machine). nginx serving static files typically stays far below them.
