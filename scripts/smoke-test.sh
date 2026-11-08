#!/usr/bin/env bash
# Smoke test for the container image, run by CI (ci.yml and build.yml).
#
# Starts the image the way the cluster runs it (read-only root filesystem,
# only /tmp writable, UID/GID 101) and checks the nginx contract from
# DEPLOYMENT.md: health endpoint, locale redirect, trailing-slash redirect
# with a relative Location, 404 page, security headers on every path class,
# Cache-Control per path class, no nginx version, SEO files, hidden files,
# blocked stock/duplicate files, no directory redirects under /_next/, and a
# clean log.
#
# Usage: scripts/smoke-test.sh <image>
set -euo pipefail

IMAGE="${1:?usage: smoke-test.sh <image>}"
NAME="smoke-$$"
PORT=18080
BASE="http://127.0.0.1:${PORT}"
failures=0

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

fail() { echo "::error::$*"; failures=$((failures + 1)); }
ok() { echo "ok   $*"; }

docker run -d --name "$NAME" --read-only --tmpfs /tmp --user 101:101 -p "${PORT}:8080" "$IMAGE" >/dev/null

# Wait for /healthz.
for _ in $(seq 1 30); do
  if body=$(curl -fsS --max-time 3 "$BASE/healthz" 2>/dev/null) && [ "$body" = "ok" ]; then break; fi
  sleep 1
done
[ "${body:-}" = "ok" ] && ok "/healthz → 200 ok" || { fail "/healthz did not answer ok"; docker logs "$NAME" >&2; exit 1; }

# headers <path>: prints status line and headers of a GET (no redirects followed).
headers() { curl -sS -o /dev/null -D - --max-time 5 "$BASE$1" | tr -d '\r'; }
# Status code only; no pipe that could break under pipefail.
status() { curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "$BASE$1"; }
# Never fails (set -e): prints nothing when the header is missing.
header() { headers "$1" | { grep -i "^$2:" || true; } | head -1 | cut -d' ' -f2- ; }

expect_status() {
  local got; got=$(status "$1")
  [ "$got" = "$2" ] && ok "$1 → $2" || fail "$1: expected status $2, got $got"
}

expect_header() { # path name value
  local got; got=$(header "$1" "$2")
  [ "$got" = "$3" ] && ok "$1 $2: $3" || fail "$1: expected $2 '$3', got '$got'"
}

expect_status /healthz 200

# Locale redirect: relative Location, no host, no :8080.
expect_status / 302
expect_header / Location /de/

# Pages.
for p in /de/ /en/ /de/research/ /de/cv/ /de/contact/ /de/imprint/ /de/privacy/ /en/cv/; do
  expect_status "$p" 200
done
ctype=$(header /de/ Content-Type)
[[ "$ctype" == text/html* ]] && ok "/de/ is HTML" || fail "/de/ content type is '$ctype'"

# Sub page without trailing slash → 301 to the slash variant, relative.
expect_status /de/cv 301
expect_header /de/cv Location /de/cv/

# Unknown path → 404 with our own page.
expect_status /does-not-exist/ 404
body404=$(curl -sS "$BASE/does-not-exist/")
grep -q 'Seite nicht gefunden' <<<"$body404" && ok "404 page is ours" || fail "404 body is not the site's 404 page"

# Hidden files are never served.
expect_status /.git/config 404
expect_status /.env 404

# Stock files of the base image's docroot ("Welcome to nginx!") and the 200
# copies of the 404 page that Next exports at /404/ and /_not-found/.
for p in /index.html /index /50x.html /404/ /404 /_not-found/ /_not-found; do
  expect_status "$p" 404
done

# Directories under /_next/ are a plain 404: no 301 (it would carry the
# immutable Cache-Control) and no 403 (it would log an error).
expect_status /_next/static/chunks 404
expect_status /_next/static/chunks/ 404

# SEO files.
for p in /robots.txt /sitemap.xml /llms.txt; do expect_status "$p" 200; done

# A hashed static asset referenced by the home page.
home=$(curl -sS "$BASE/de/")
asset=$(grep -oE '/_next/static/[^"]+\.(js|css)' <<<"$home" | head -1 || true)
[ -n "$asset" ] && ok "found static asset $asset" || fail "no /_next/static asset in /de/"
# A self-hosted font (next/font preloads it from /_next/static/media/).
font=$(grep -oE '/_next/static/media/[^"\\]+\.woff2' <<<"$home" | head -1 || true)
[ -n "$font" ] && ok "found self-hosted font $font" || fail "no /_next/static/media/*.woff2 font in /de/"

# Security headers on every path class: HTML, static asset, both redirects,
# 404 page, health endpoint. Each header exactly once, with exactly this
# value (whole-line match, so extra directives fail).
SECURITY_HEADERS=(
  "X-Content-Type-Options: nosniff"
  "Referrer-Policy: strict-origin-when-cross-origin"
  "X-Frame-Options: DENY"
  "Permissions-Policy: camera=(), microphone=(), geolocation=()"
  "Strict-Transport-Security: max-age=86400"
  "Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
  "Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
)
for p in /de/ "$asset" / /de/cv /does-not-exist/ /healthz; do
  h=$(headers "$p")
  before=$failures
  for expected in "${SECURITY_HEADERS[@]}"; do
    name=${expected%%:*}
    count=$(grep -ci "^${name}:" <<<"$h" || true)
    if [ "$count" != "1" ]; then fail "$p: header $name appears $count times"; continue; fi
    grep -qixF "$expected" <<<"$h" || fail "$p: wrong $name: $(grep -i "^${name}:" <<<"$h")"
  done
  server=$(grep -i '^Server:' <<<"$h" || true)
  if grep -qiE 'nginx/[0-9]' <<<"$server"; then fail "$p: Server header shows the version ($server)"; fi
  if [ "$failures" -eq "$before" ]; then ok "$p: security headers"; fi
done

# Cache-Control per path class.
expect_header /de/ Cache-Control no-cache
expect_header /de/index.txt Cache-Control no-cache
expect_header / Cache-Control no-cache
expect_header /de/cv Cache-Control no-cache
expect_header /robots.txt Cache-Control no-cache
expect_header /sitemap.xml Cache-Control no-cache
expect_header /llms.txt Cache-Control no-cache
expect_header /does-not-exist/ Cache-Control no-cache
expect_header "$asset" Cache-Control "public, max-age=31536000, immutable"
if [ -n "$font" ]; then expect_header "$font" Cache-Control "public, max-age=31536000, immutable"; fi
# A missing hashed file is a 404 page, never cached as immutable.
expect_status /_next/static/missing.js 404
expect_header /_next/static/missing.js Cache-Control no-cache
expect_header /icon.svg Cache-Control "public, max-age=86400"

# The log must be clean: no errors, nothing about the read-only filesystem,
# and no "directory index … is forbidden" from the /_next/ directory checks.
logs=$(docker logs "$NAME" 2>&1)
if grep -qiE '\[(emerg|alert|crit|error)\]|read-only file system|permission denied' <<<"$logs"; then
  fail "nginx log has errors:"; echo "$logs" >&2
else
  ok "nginx log is clean"
fi

if [ "$failures" -gt 0 ]; then
  echo "$failures check(s) failed" >&2
  exit 1
fi
echo "All smoke checks passed."
