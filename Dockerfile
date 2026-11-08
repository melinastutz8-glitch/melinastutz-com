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
FROM --platform=$BUILDPLATFORM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Runtime stage: unprivileged nginx (UID/GID 101, port 8080), stable branch.
# No RUN instructions here, only COPY, so the multi-arch build needs no QEMU.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
# The image's IPv6 entrypoint script cannot edit default.conf on the
# read-only root filesystem and only logs that; this keeps the logs quiet.
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 8080
