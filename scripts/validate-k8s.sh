#!/usr/bin/env bash
# Renders ./k8s with a pinned kustomize and validates the result with a
# pinned kubeconform. Downloads both from their GitHub releases and checks
# the SHA-256 against the values below. Local only: never applies anything.
# Linux amd64 (CI runner); bump version and checksum together.
set -euo pipefail

KUSTOMIZE_VERSION=5.8.3
KUSTOMIZE_SHA256=cb9e31198d3f63b44848bd0afc4c8efc56e6cfef9c93a4a39a211940e6decd61
KUBECONFORM_VERSION=0.8.0
KUBECONFORM_SHA256=9bc2bffbf71f261128533edaf912153948b7ff238f9a531ae6d34466ec287883
# Schema version close to the cluster's k3s (v1.32.x).
KUBERNETES_VERSION=1.32.0
# kubeconform's default schema source tracks the master branch; pin a commit
# of yannh/kubernetes-json-schema so validation is reproducible. Bump by hand.
SCHEMA_LOCATION='https://raw.githubusercontent.com/yannh/kubernetes-json-schema/c416d7b0da0751bd8ebe5be4fa4c8e8274e3bbe2/{{ .NormalizedKubernetesVersion }}-standalone{{ .StrictSuffix }}/{{ .ResourceKind }}{{ .KindSuffix }}.json'

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
# Repo root, so the relative k8s/ paths work from any working directory.
cd "$(dirname "$0")/.."

curl -fsSLo "$tmp/kustomize.tar.gz" \
  "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2Fv${KUSTOMIZE_VERSION}/kustomize_v${KUSTOMIZE_VERSION}_linux_amd64.tar.gz"
(cd "$tmp" && echo "${KUSTOMIZE_SHA256}  kustomize.tar.gz" | sha256sum -c -)
tar -xzf "$tmp/kustomize.tar.gz" -C "$tmp" kustomize

curl -fsSLo "$tmp/kubeconform.tar.gz" \
  "https://github.com/yannh/kubeconform/releases/download/v${KUBECONFORM_VERSION}/kubeconform-linux-amd64.tar.gz"
(cd "$tmp" && echo "${KUBECONFORM_SHA256}  kubeconform.tar.gz" | sha256sum -c -)
tar -xzf "$tmp/kubeconform.tar.gz" -C "$tmp" kubeconform

"$tmp/kustomize" build k8s > "$tmp/rendered.yaml"
"$tmp/kubeconform" -strict -summary \
  -kubernetes-version "$KUBERNETES_VERSION" \
  -schema-location "$SCHEMA_LOCATION" \
  "$tmp/rendered.yaml"

# The Flux setter comment must stay on the image line.
grep -Eq 'image: ghcr\.io/melinastutz8-glitch/melinastutz-com:main-[0-9]{8}T[0-9]{6} # \{"\$imagepolicy": "flux-system:melinastutz-com"\}' k8s/deployment.yaml \
  || { echo "::error::k8s/deployment.yaml: image line lost its Flux setter comment"; exit 1; }
echo "k8s manifests valid."
