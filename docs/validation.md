# Validation and release status

Preview v0.1.1 is source-reviewed, locally tested, and distributed through immutable Git tags plus the registry snapshot. PRs remain the review boundary; publishing a preview tag does not imply it is on main.

## Automated coverage

- TypeScript: 15 unit/contract tests, including preparation/activation separation, integrity, streaming limits, cancellation, deadline, deduplication, generated-glue ownership, cache bounds and immutable extensions.
- Rust: 8 package tests for actual build inspection, verified native execution, fuel/memory limits, cancellation, bad manifests and persistent file cache.
- Flutter/Dart: 9 package tests plus static analysis, including embedded schema equality, integer-valued JSON numbers, immutable extensions, activation deadline and file-cache restart.
- External test org: one 17-case JSON corpus consumed independently by the installed TypeScript, Rust and Dart packages, plus organization-specific transport implementations.
- External Chromium: real wasm-bindgen 0.2.114-generated glue, a real Flutter 3.44.2 --wasm build with two embedded views sharing one engine, and CacheStorage surviving full document navigation. These are framework builds, not handwritten mock bootstraps.
- Browser CSP permits WASM compilation without enabling JavaScript unsafe-eval.
- Astro organization sites: static production build, mobile/desktop overflow and link/navigation checks.

The shared corpus covers invalid fields, duplicate IDs, URL canonicalization, origins, byte constraints, digest syntax, entrypoint/runtime matching and valid extensible configuration. JSON Schema is evaluated independently in all three runtimes.

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

