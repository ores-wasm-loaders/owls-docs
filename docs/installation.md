# Reproducible Zed installation

The v0.1.1 preview uses zed-cli v0.3.0. The public registry returned HTTP 502 during this delivery, so the release includes a checksum-pinned **real Zed file-registry snapshot**. It contains package metadata plus content-addressed artifacts produced by zed publish, not source checkouts disguised as packages. This is also useful for internal/offline registries.

## 1. Obtain the registry

Clone this documentation repository at tag v0.1.1. Run:
```sh
bash scripts/registry.sh
export ZED_PKG_REGISTRY="file://$(pwd)/.registry/registry"
```

The helper downloads the release archive, verifies SHA-256 e06dc7890f24a19f745992485d1ca1c6f13ef7775431f4e048bd45be1d7d5c2f, then extracts it. Keep the resulting absolute registry URL when switching into a consumer repository. Downloading public assets needs no GitHub credentials.

For CI, install the pinned Linux x86_64-musl Zed release and verify its SHA-256 before executing it:
```text
https://github.com/zed-pkg/zed-cli/releases/download/v0.3.0/zed-x86_64-unknown-linux-musl.tar.gz
SHA-256 e380240c96242ab3b29e0e9d14c95ba946d086f20f0732e34d0e5cf47513efc7
```
Use the matching official platform archive/checksum on macOS. Do not use zpkg.tech.

## 2. Declare direct dependencies

Add these entries to your repository's existing .zpkg.toml:
```toml
[dependencies]
"ores-wasm-loaders/owls-interfaces" = "=0.1.1"
"ores-wasm-loaders/owls-web-loader" = "=0.1.1"
"ores-wasm-loaders/owls-runtime" = "=0.1.1"
"ores-wasm-loaders/owls-flutter" = "=0.1.1"
```
Select only the runtimes your product needs, and declare interfaces explicitly with them. Preserve your package identity and required package.repository. A first installation runs `zed install --install-mode copy --adapter node`; review and commit the generated .zpkg.lock. Repeated and CI installations run `zed install --frozen --install-mode copy --adapter node`. Rust/Dart-only projects can use adapter none and the paths below.

Zed checks the locked artifact digest. The lock's file:///tmp/ores-wasm-registry source records publication provenance; the ZED_PKG_REGISTRY override selects the portable extracted registry. Do not manually invent lock hashes or unsupported mirror fields. With v0.3.0, manifest scripts accepts only test; repository tasks belong in schema-2 zed-env.toml.

## 3. Connect each language

**TypeScript/browser:** run npm ci before zed install --adapter node (npm ci removes Node links). Import @ores-wasm-loaders/owls-web-loader, or bundle zed_modules/ores-wasm-loaders/owls-web-loader/dist/index.js. The /server export imports without a DOM. Zed carries the prebuilt ESM and declarations; npm publication is not required.

**Rust:** add the root-level entries:
```toml
[dependencies]
owls-runtime = { path = "zed_modules/ores-wasm-loaders/owls-runtime" }
[patch.crates-io]
owls-interfaces = { path = "zed_modules/ores-wasm-loaders/owls-interfaces/rust" }
```
The dependency's own patch table does not replace the consumer root patch. Keep Cargo.lock and run cargo test --locked.

**Flutter/Dart:** add to the consumer pubspec.yaml:
```yaml
dependencies:
  owls_flutter:
    path: zed_modules/ores-wasm-loaders/owls-flutter
dependency_overrides:
  owls_interfaces:
    path: zed_modules/ores-wasm-loaders/owls-interfaces/dart
```
Adjust paths for a nested Flutter app, run flutter pub get, commit pubspec.lock, and use --enforce-lockfile in CI. Import owls_flutter.dart for shared types/host, owls_native.dart for native HTTP/files, or owls_webview.dart for the WebView adapter. Zed owns internal source package selection; Cargo/npm/pub still resolve their ecosystem dependencies with their lockfiles.

## 4. Keep extension code in the consuming organization

Create a small product-local package depending on these versions. Inject exact asset origins, cache namespace and limits, a transport for your CDN/auth policy, and the framework adapter. Wrap or implement the public TypeScript interfaces, Rust traits or Dart interfaces; there is no need to fork shared coordinator internals.

Pass organization configuration through immutable policy plus validated extensions. Do not use a mutable global shared across tenants. Credentials belong in the application's existing approved runtime configuration and shared-auth integration, never in a release manifest or prefetch URL.

The executable examples in [the external test repository](https://github.com/ores-wasm-loaders-test/owls-e2e) include a custom Rust Transport, custom Dart AssetTransport, and a browser-generated-glue callback. They import installed packages, not ../sibling source directories.

## Upgrades and rollback

Publish each build under a new release ID and new immutable URLs, then produce its manifest from that build. Publish Zed source packages under new semantic versions, refresh locks in the consuming org, run that org's conformance and lifecycle tests, and promote the reviewed change. Keep the previous manifest/packages for rollback. Never overwrite a tagged package or change an active host's release content.

