# Two stages: build the static export with Node, serve it with nginx.
#
# Base images are pinned to an exact version plus their multi-arch index
# digest (never `latest`, never a range), as in furchert-ch. Canonical Docker
# Hub references so Dependabot (docker ecosystem) can bump tag and digest.
# CI pulls them through the mirror.gcr.io registry mirror (build.yml, ci.yml);
# the digest makes both sources serve identical bytes.

# Build stage. `--platform=$BUILDPLATFORM`: `out/` is plain HTML/CSS/JS and
# does not depend on the target architecture, so the build runs once,
# natively on the runner, even for the arm64 image. When the node tag moves,
# bump `node-version` in ci.yml and build.yml and `.nvmrc` too.
FROM --platform=$BUILDPLATFORM node:22.23.4-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Runtime stage: unprivileged nginx (UID/GID 101, port 8080), stable branch.
# Upstream publishes releases from 1.30.6 on as `nginx/nginx-unprivileged`
# (formerly `nginxinc/`, which no longer receives the rebuilds).
# No RUN instructions here, only COPY, so the multi-arch build needs no QEMU.
FROM nginx/nginx-unprivileged:1.30.6-alpine@sha256:44e74ca483234093081138b6d7b6f561d55557756a2deefc3a5056148defeb99
# The image's IPv6 entrypoint script cannot edit default.conf on the
# read-only root filesystem and only logs that; this keeps the logs quiet.
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 8080
