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
| Image | `ghcr.io/melinastutz8-glitch/melinastutz-com` (public package, no pull secret) |
| Platforms | `linux/amd64`, `linux/arm64` (one manifest list; CI fails if either is missing) |
| Tags | `main-<UTC %Y%m%dT%H%M%S>` (Flux ImagePolicy `^main-[0-9]{8}T[0-9]{6}$`) and the short commit SHA |
| Port | 8080, plain HTTP (TLS ends at Cloudflare) |
| User | UID/GID 101 (`nginx` in nginx-unprivileged), non-root |
| Filesystem | read-only root; only `/tmp` is written (pid file and nginx temp paths, set by the image's `nginx.conf`) |
| Probes | `GET /healthz` → `200 ok`: startup every 2 s (up to 30 s), readiness every 5 s, liveness every 20 s with a 2 s timeout (CPU throttling on the Raspberry Pis) |
| Env, secrets, ConfigMaps | none; `enableServiceLinks: false` (no env var per Service in `apps`), `automountServiceAccountToken: false` |
| Shutdown | `preStop` native `sleep` of 5 s, then nginx stops: covers the gap between endpoint removal and shutdown, so cloudflared gets no 502s during rollouts |
| Namespace / labels | `apps`, `app: melinastutz-com` |
| Replicas | 2, spread over nodes (`topologySpreadConstraints`, `ScheduleAnyway`), preferring non-control-plane nodes; survive a single node reboot |
| PodDisruptionBudget | `minAvailable: 1`, `unhealthyPodEvictionPolicy: AlwaysAllow`. Guards manual drains only: the homelab reboots nodes via systemctl and kubelet graceful shutdown, which does not go through evictions |
| Network | NetworkPolicy: ingress on 8080 only from `platform/cloudflared` (`pod: cloudflared`); egress open |
| Kubernetes | Validated against 1.32 schemas (cluster: k3s v1.32, to be confirmed); the `preStop` sleep action needs ≥ 1.30 |

### CI coverage

| Event | Workflow and jobs | Runs |
| --- | --- | --- |
| Push to a work branch | `ci.yml` → `verify` | lint, typecheck, unit tests, build, contact-address grep, k8s validation |
| Pull request to `main` | `ci.yml` → `verify` and `image` | the above, plus amd64 image build (never pushed) and `scripts/smoke-test.sh` |
| Push to `main` (merge) | `build.yml` → `verify`, then `build` | the above including image build and smoke test, then multi-arch build, push to GHCR, platform check |

The image build and smoke test run on pull requests and on `main`, **not** on plain pushes to work branches. That
is by design: otherwise every commit on a PR branch would build the image twice. Open a PR to get them. A push
to `main` that changes only files under `k8s/**` does not run `build.yml`.

The BuildKit daemon image (`moby/buildkit`, tag and index digest in `driver-opts`) is pinned in both workflows.
Dependabot does not track it; bump it by hand in `ci.yml` and `build.yml` together.

### Image tag updates

`k8s/deployment.yaml` carries the Flux setter comment on the image line:

```yaml
image: ghcr.io/melinastutz8-glitch/melinastutz-com:main-<ts> # {"$imagepolicy": "flux-system:melinastutz-com"}
```

Until the first deployment, the tag there is the **placeholder** `main-00000000T000000`, which does not exist in
GHCR. CI (`scripts/validate-k8s.sh`) checks only the format of that line, so the placeholder passes every check;
replacing it is a manual step (see "Order of first deployment" below).

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
| `/index.html`, `/index`, `/50x.html` (stock files of the base image) | `404` |
| `/404`, `/404/`, `/_not-found`, `/_not-found/` (Next's extra copies of the 404 page) | `404` |
| Directories under `/_next/` (e.g. `/_next/static/chunks/`) | `404`, never a 301 or 403 |

`absolute_redirect off` and `port_in_redirect off` keep redirects relative behind the tunnel. `server_tokens off`
hides the nginx version. gzip is on for text types. The runtime image is `nginx/nginx-unprivileged` (upstream moved
there from `nginxinc/` with 1.30.6); `COPY` cannot remove its stock `index.html` and `50x.html`, hence the 404 rules.

### Cache-Control

| Path class | Cache-Control |
| --- | --- |
| `/_next/static/*` (hashed, fonts included) | `public, max-age=31536000, immutable` |
| Images (incl. the share images `/de/og-image.png`, `/en/og-image.png`), fonts, `.svg`, `.ico` outside `/_next/static/` | `public, max-age=86400` |
| Everything else: HTML, RSC `*.txt`, `robots.txt`, `sitemap.xml`, `llms.txt`, `third-party-notices.txt`, all redirects, 404 | `no-cache` |

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
- `sitemap.xml`: one entry per page and language, with `lastmod` from `src/lib/seo/pages.ts` and hreflang
  alternates.
- `llms.txt`: plain-language summary for AI assistants.
- Canonical, hreflang (`de`, `en`, `x-default` → German) and sitemap URLs all end with `/`.

## Contact address

The address is assembled in the browser only (`src/data/contact-email.ts`, `<ContactEmail>`). CI greps `out/`
and fails if it appears. Cloudflare's *Email Address Obfuscation* is therefore not needed for it; Dominic decides
whether to leave it on.

## Hand-over checklist for Dominic

This repository lives on **Melina's** account (`melinastutz8-glitch/melinastutz-com`), not on `doemefu`, as
agreed with Dominic. That changes who clicks some settings; the steps are otherwise as in the brief. Steps 1
and 2 can start at any time; step 3 waits for step 0, step 5 for the go-live gate.

### 0. Order of first deployment

`k8s/deployment.yaml` points at the placeholder tag `main-00000000T000000` until a real image exists. Keep this
order:

- **(a) Melina merges the first PR into `main`.** `build.yml` builds and pushes `main-<ts>` (and the short SHA);
  the tag is shown in the run's summary (*Image pushed: …*).
- **(b) Melina switches the GHCR package `melinastutz-com` to Public** (*Package settings → Danger Zone → Change
  visibility*). Check with an anonymous
  `docker pull ghcr.io/melinastutz8-glitch/melinastutz-com:main-<ts>`.
- **(c) A follow-up PR replaces the placeholder** `main-00000000T000000` in `k8s/deployment.yaml` with that tag.
  CI only checks the format of the image line, so the placeholder passes every check: **do not skip this
  step.** If the PR changes only `k8s/**`, merging it starts no new build.
- **(d) Only then does Dominic create the Flux objects** (step 3).

If the Flux objects come first, the Kustomization applies the placeholder tag, which does not exist: both pods
sit in `ImagePullBackOff` and the homelab's `WorkloadUnavailable` alert fires.

Flux commits only when the ImagePolicy selects a tag newer than the one in the file. Right after (c) the file
already holds the newest tag, so the first reconcile commits nothing and does not prove that the deploy key can
push. Write access is proven by the **first Flux commit** (author `Flux`) on `main` after the next site build.

### 1. Cloudflare zone and DNS

- **The zone `melinastutz.com` goes into Dominic's Cloudflare account**, the account that owns the tunnel
  (`cloudflare_account_id` in playbook 40), not into an account of Melina's. A proxied CNAME to
  `<tunnel-id>.cfargotunnel.com` only routes to the tunnel from a zone in the same account
  ([Cloudflare: DNS records for tunnels](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/)).
- **Melina sets the two Cloudflare nameservers** at her registrar. If DNSSEC is on at the registrar, she turns it
  off there **before** switching, otherwise validating resolvers fail; once the zone is active, DNSSEC can be
  enabled in Cloudflare and its DS record added at the registrar.
- **Records in the zone's DNS tab:** proxied CNAME `@` → `<tunnel-id>.cfargotunnel.com` (Cloudflare flattens the
  apex CNAME automatically) and proxied CNAME `www` → `<tunnel-id>.cfargotunnel.com`. **Never** under *Zero
  Trust → Networks → Tunnels → Public hostnames*: playbook 40 replaces the tunnel's whole configuration
  (`cf_ingress_body`), so a route added there is lost on the next run.
- **Redirect Rule:** hostname `www.melinastutz.com` → 301 to
  `concat("https://melinastutz.com", http.request.uri.path)` (query string preserved). The tunnel has no `www`
  route, so without this rule `www` gets the tunnel's 404.
- *Always Use HTTPS* on, **edge HSTS off** (the header comes from nginx, so there is exactly one).
- Decide on *Email Address Obfuscation* (not needed, see "Contact address") and Cloudflare's managed robots.txt
  (see "Search engines and AI crawlers").

### 2. Flux deploy key (write access)

Flux reads `./k8s` and pushes tag updates to `main`, so it needs a deploy key **with write access**. On a
personal repository only the owner can add deploy keys.

```bash
# Generates the key pair in-cluster; writes identity, identity.pub and known_hosts.
flux create secret git melinastutz-com-flux-auth -n flux-system \
  --url=ssh://git@github.com/melinastutz8-glitch/melinastutz-com \
  --ssh-key-algorithm=ed25519
# Only the public key leaves the cluster:
kubectl -n flux-system get secret melinastutz-com-flux-auth \
  -o jsonpath='{.data.identity\.pub}' | base64 -d
```

Dominic sends the public key to Melina; she adds it under *Settings → Deploy keys → Add deploy key* with
**Allow write access**.

### 3. Flux objects

`cluster/apps/melinastutz-com/` in `doemefu/homelab`, after the pattern of `cluster/apps/furchert-ch/`. All five
objects are named **`melinastutz-com`**, in namespace **`flux-system`**:

| Object | Spec |
| --- | --- |
| GitRepository | `url: ssh://git@github.com/melinastutz8-glitch/melinastutz-com`, `ref.branch: main`, `secretRef: melinastutz-com-flux-auth` |
| Kustomization (`kustomize.toolkit.fluxcd.io`) | `path: ./k8s`, `prune: true`, source the GitRepository; the manifests set `namespace: apps` themselves |
| ImageRepository | `image: ghcr.io/melinastutz8-glitch/melinastutz-com`, no `secretRef` (public package) |
| ImagePolicy | name exactly `melinastutz-com` (the setter marker is `flux-system:melinastutz-com`); `filterTags.pattern: '^main-[0-9]{8}T[0-9]{6}$'`, `policy.alphabetical.order: asc` |
| ImageUpdateAutomation | source the GitRepository, checkout and push branch `main`, `update.path: ./k8s`, `strategy: Setters`, commit author `Flux <flux@users.noreply.github.com>` |

Plus `cluster/apps/melinastutz-com/kustomization.yaml` listing the five files, and `melinastutz-com` added to
`cluster/apps/kustomization.yaml`.

### 4. Rulesets on `main`

If `main` gets a ruleset later, deploy keys need a **bypass** (Flux pushes straight to `main`), and the ruleset
must **not require signed commits**: Flux's commits are unsigned.

### 5. Tunnel route (go live)

**Go-live gate:** do not route the tunnel until the content placeholders are gone, i.e. the `<Pending>` blocks on
the research page and the empty `LINKEDIN_URL` (see CLAUDE.md, "Content still missing"). Until then the
hostnames answer with the tunnel's 404.

Add to `cf_ingress_body` in playbook 40, before the `http_status:404` rule (apex only; `www` is the Redirect
Rule):

```yaml
- hostname: "melinastutz.com"
  service: "http://melinastutz-com.apps.svc.cluster.local:8080"
```

### 6. Verify

```bash
curl -sI https://melinastutz.com/            # 302 to /de/, security headers, exactly one HSTS line
curl -sI https://www.melinastutz.com         # 301 to https://melinastutz.com/
curl -s  https://melinastutz.com/robots.txt  # Content-Signal line and sitemap URL
kubectl -n apps get pods -l app=melinastutz-com -o wide
```

The last command must show **both pods `Running` on different nodes** (NODE column). After the next site build,
check for Flux's first tag commit on `main` (step 0).

### Open points for Dominic

- The privacy notice says the site runs on a privately operated server in Switzerland behind Cloudflare and
  that server logs are deleted after 14 days. Please confirm the server location and that the 14 days hold
  (nginx logs go to stdout; whatever collects them decides). The processing agreement below covers both.
- **Data protection roles.** Melina is the controller; Dominic processes the site's data on her behalf as a
  processor (Art. 9 FADP / revDSG); Cloudflare is his sub-processor under Cloudflare's self-serve Data Processing
  Addendum, which is incorporated in its Self-Serve Subscription Agreement. Melina approves Cloudflare as
  sub-processor. Please confirm a short processing agreement with her by email, before go-live (step 5):
  - Data are used only to host and secure the site.
  - Server logs are deleted after 14 days wherever they end up, because the privacy notice promises 14 days.
    Container logs rotate by size, not by age (at this traffic old lines can stay for months), so this includes
    any log collector and backups.
  - Cloudflare features that set cookies or add scripts or logging stay off unless Melina agrees: Bot Fight Mode
    and challenges (cookies `__cf_bm`, `cf_clearance`), Web Analytics / RUM, Zaraz. The privacy notice says only
    that a security cookie may be set when Cloudflare suspects automated access.
  - Security incidents are reported to Melina promptly.
  - Dominic helps Melina answer access requests from visitors.
  - The server stays in Switzerland unless he tells her first. The notice states Switzerland: please confirm.
- **Access log format.** The base image's `nginx.conf` (unchanged here) uses the `main` log format, which logs
  `$http_x_forwarded_for`, i.e. the visitor's IP address as passed on by Cloudflare. That is fine and consistent
  with the privacy notice, which lists the IP address. Dominic may shorten it (a PR here can set a shorter
  `log_format` in `nginx/default.conf`).
- **Email.** The domain's MX records point to Apple iCloud Mail (confirmed by Melina), and the privacy notice
  names Apple. Keep the MX, SPF and DKIM records as they are when the zone moves to Cloudflare. If the mail
  provider changes, the privacy notice must change too.
- **Swiss-U.S. Data Privacy Framework.** The privacy notice relies on Cloudflare, Inc. being certified. Re-check
  once a year that its entry is still active: <https://www.dataprivacyframework.gov/participant/5666>.
- Resource limits (`cpu: 200m`, `memory: 64Mi`) are the brief's values; they were not load-tested locally
  (no Docker on Melina's machine). nginx serving static files typically stays far below them.
- Please confirm the k3s version. The manifests are validated against Kubernetes 1.32 schemas, and the `preStop`
  `sleep` action needs ≥ 1.30.
