#!/usr/bin/env bash
# Fixed, reviewed release input. This helper accepts no command-line flags.
set -euo pipefail
mkdir -p .registry
curl --fail --location --retry 3 --output .registry/snapshot.tar.gz \
  https://github.com/ores-wasm-loaders/owls-docs/releases/download/v0.1.1/owls-registry-v0.1.1.tar.gz
expected="e06dc7890f24a19f745992485d1ca1c6f13ef7775431f4e048bd45be1d7d5c2f"
if command -v sha256sum >/dev/null; then
  actual="$(sha256sum .registry/snapshot.tar.gz)"; actual="${actual%% *}"
else
  actual="$(shasum -a 256 .registry/snapshot.tar.gz)"; actual="${actual%% *}"
fi
test "$actual" = "$expected" || { echo "Registry snapshot checksum mismatch" >&2; exit 1; }
tar -xzf .registry/snapshot.tar.gz -C .registry
echo "Verified registry snapshot v0.1.1"

