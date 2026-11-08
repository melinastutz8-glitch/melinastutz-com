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

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cd "$tmp"

curl -fsSLo kustomize.tar.gz \
  "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2Fv${KUSTOMIZE_VERSION}/kustomize_v${KUSTOMIZE_VERSION}_linux_amd64.tar.gz"
echo "${KUSTOMIZE_SHA256}  kustomize.tar.gz" | sha256sum -c -
tar -xzf kustomize.tar.gz kustomize

curl -fsSLo kubeconform.tar.gz \
  "https://github.com/yannh/kubeconform/releases/download/v${KUBECONFORM_VERSION}/kubeconform-linux-amd64.tar.gz"
echo "${KUBECONFORM_SHA256}  kubeconform.tar.gz" | sha256sum -c -
tar -xzf kubeconform.tar.gz kubeconform

cd - >/dev/null
"$tmp/kustomize" build k8s > "$tmp/rendered.yaml"
"$tmp/kubeconform" -strict -summary -kubernetes-version "$KUBERNETES_VERSION" "$tmp/rendered.yaml"

# The Flux setter comment must stay on the image line.
grep -Eq 'image: ghcr\.io/melinastutz8-glitch/melinastutz-com:main-[0-9]{8}T[0-9]{6} # \{"\$imagepolicy": "flux-system:melinastutz-com"\}' k8s/deployment.yaml \
  || { echo "::error::k8s/deployment.yaml: image line lost its Flux setter comment"; exit 1; }
echo "k8s manifests valid."
