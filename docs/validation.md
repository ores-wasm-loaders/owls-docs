# Validation and release status

Preview v0.1.1 is source-reviewed, locally tested, and distributed through immutable Git tags plus the registry snapshot. PRs remain the review boundary; publishing a preview tag does not imply it is on main.

## Automated coverage

- TypeScript: 16 unit/contract tests, including preparation/activation separation, integrity, streaming limits, cancellation, deadline, deduplication, generated-glue ownership, cache bounds, immutable extensions and unparseable-URL rejection.
- Rust: 8 package tests for actual build inspection, verified native execution, fuel/memory limits, cancellation, bad manifests and persistent file cache.
- Flutter/Dart: 9 package tests plus static analysis, including embedded schema equality, integer-valued JSON numbers, immutable extensions, activation deadline and file-cache restart.
- External test org ([owls-e2e](https://github.com/ores-wasm-loaders-test/owls-e2e)): one 54-case JSON corpus (8 valid, 28 schema rejections, 18 host-invariant rejections) consumed independently by the installed TypeScript, Rust and Dart packages, plus organization-supplied transports and byte stores. `tools/validate_corpus.py` re-derives every case's schema verdict, so the corpus proves itself against the published schema rather than against one host's opinion of it.
- The corpus is what keeps three implementations of the host layer honest. It has already caught one real divergence: a schema-passing but unparseable asset URL escaped as the URL parser's native exception in the TypeScript and Dart hosts instead of the declared `origin` error. All three hosts now agree, and the case pins that agreement from outside the packages.
- External Chromium harness (`owls-e2e/browser/`): a deterministic fixture server with correct `application/wasm` and JavaScript MIME types and a CSP that permits WASM compilation without enabling JavaScript `unsafe-eval`, driving real wasm-bindgen-generated glue and a real `flutter build web --wasm` output, including two embedded views sharing one engine and CacheStorage surviving a full document navigation. It runs only against build outputs the operator supplies through `OWLS_BINDGEN_DIR` and `OWLS_FLUTTER_DIR`, and skips loudly when they are absent — no run of it is claimed here.

The shared corpus covers unknown and missing fields at both the release and asset level, duplicate IDs and URLs, forbidden and non-canonical origins, unparseable URLs, byte constraints at both boundaries, digest syntax, entrypoint/runtime matching, unknown runtimes and asset kinds, and valid extensible configuration across all three runtimes. JSON Schema is evaluated independently in each language.

URL canonicalization is deliberately excluded from the shared cases: WHATWG parsers resolve dot segments and Dart's RFC 3986 `Uri` does not, so a shared case there would encode a divergence rather than a contract. Publishers must emit already-canonical URLs, which `inspect_build` does.

The organization Astro sites (`ores-wasm-loaders.github.io`, `ores-wasm-loaders-test.github.io`) are not yet in their repositories; no site build or navigation check is claimed.

## Limits of these results

No physical Android/iOS device, Windows desktop WebView, WKWebView or embedded platform bridge was exercised during this delivery. The Flutter bridge is analyzed and its browser completion protocol is tested, but real-device lifecycle/navigation tests remain a product integration requirement. Linux CI exercises native Rust/Dart and Chromium. Local validation used macOS.

Leptos and Dioxus expose generated-glue/launch extension points; there is no claim here that a complete application from either framework was built or benchmarked. Native Dart execution requires an application-supplied engine adapter. SIMD, threads, WASI and WasmGC require explicit engine/capability choices; no universal support is claimed.

Browser routing fixtures provide deterministic HTTPS responses for real compiled application files; they do not prove CDN cache reuse or real TLS/network performance. Run cold/warm production measurements before adopting a speed claim.

## Project mapping and unresolved configuration

- [GitHub main project](https://github.com/orgs/ores-wasm-loaders/projects/1)
- [GitHub external-test project](https://github.com/orgs/ores-wasm-loaders-test/projects/1)
- [Linear main project](https://linear.app/denman/project/ores-wasm-loaders-017f721fe577)
- [Linear test project](https://linear.app/denman/project/ores-wasm-loaders-test-39deaaade95e)

The Linear workspace rejected new issues because its free issue quota was exhausted. Each repository has a GitHub planning issue; GH-1 branches/PRs record this limitation instead of inventing DEN identifiers. Slack messages were not requested.

Owned apex domains and concrete login application URLs were not provided. The Astro sites use the organizations' github.io addresses and include user-app/org-app integration guidance. Cloudflare DNS, cloud projects, database organizations and authentication applications were not invented or provisioned as part of this library delivery.

