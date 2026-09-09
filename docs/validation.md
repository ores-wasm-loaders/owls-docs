# Validation and release status

Preview v0.1.1 is source-reviewed, locally tested, and distributed through immutable Git tags plus the registry snapshot. PRs remain the review boundary; publishing a preview tag does not imply it is on main.

## Automated coverage

- Contract admission: every production host pins an immutable `ORESoftware/typespec-json-schema-validator` revision, regenerates comparison-only Schema B, verifies the TypeSpec/independently authored JSON Schema A receipt and Contract IR, and checks the five-language projection receipt.
- TypeScript/browser: preparation/activation separation, integrity, streaming limits, cancellation, deadlines, shared leases, intent dwell/grace, MIME checks, malformed URL handling, generated-glue ownership, cache bounds, immutable extensions, and direct delegation to `owls-interfaces`.
- Rust/native: actual build inspection, verified native execution, fuel/memory limits, cancellation, canonical policy origins, content-type checks, bad manifests, persistent file cache, and the direct Contract IR admission gate.
- Flutter/Dart: embedded Schema A compatibility, integer-valued JSON numbers, Draft 2020-12 resource lowering for the supported Draft 7 runtime subset, immutable extensions, shared preparation leases, bounded activation handoff, optional deactivation, MIME checks, canonical origins, malformed URL handling, file-cache restart, and current v1/v2 interface fixtures.
- Go and Gleam: compiled release-contract projections, closed wire enums, source declaration coverage, and v1/v2 fixture or compile checks.
- External test org: an independent source-closure receipt for interfaces, validator, browser, native, and Flutter commits; adversarial stale/tampered evidence checks; the evolved 54-case corpus; and separate TypeScript, Rust, Dart, Go, and Gleam jobs.
- External browsers: real wasm-bindgen-generated glue, a real Flutter `--wasm` build with embedded views, and navigation/cache lifecycle checks using pinned browser tooling.
- Browser CSP permits Wasm compilation without enabling JavaScript `unsafe-eval`.
- Astro organization sites: static production build, mobile/desktop overflow, and link/navigation checks.

The release contract is maintained independently in TypeSpec and JSON Schema Draft 2020-12. Neither source overwrites or outranks the other. The shared validator compares their declarations and supported semantics, executes the common instance corpus, emits a digest-bound receipt and Contract IR only after parity, and then checks TypeScript, Rust, Dart, Go, and Gleam projections. See [cross-runtime contract admission](contract-admission.md).

## Limits of these results

No physical Android/iOS device, Windows desktop WebView, WKWebView, or embedded platform bridge was exercised during this delivery. The Flutter bridge is analyzed and its browser completion protocol is tested, but real-device lifecycle/navigation tests remain a product integration requirement. Linux CI exercises native Rust/Dart and browser lanes.

Leptos and Dioxus expose generated-glue and launch extension points. Real framework pilot builds exercise those boundaries, but no fleet-wide field-performance claim follows from CI alone. Native Dart execution requires an application-supplied engine adapter. SIMD, threads, WASI, and WasmGC require explicit engine/capability choices; no universal support is claimed.

Browser routing fixtures provide deterministic HTTPS responses for real compiled application files; they do not prove cross-site cache reuse or production TLS/network performance. Run cold/warm production measurements before adopting a speed claim.

The [2026-09 audit record](audit-2026-09.md) and [pilot plan](pilot-plan.md) define the remaining real-device, fallback, field-telemetry, and production-cohort gates. Package-local and sibling-test suites do not replace those deployment checks.

## Project mapping and unresolved configuration

- [GitHub main project](https://github.com/orgs/ores-wasm-loaders/projects/1)
- [GitHub external-test project](https://github.com/orgs/ores-wasm-loaders-test/projects/1)
- [Linear main project](https://linear.app/denman/project/ores-wasm-loaders-017f721fe577)
- [Linear test project](https://linear.app/denman/project/ores-wasm-loaders-test-39deaaade95e)
- [Linear contract compiler parent](https://linear.app/denman/issue/DEN-3828/build-cross-language-contract-compiler-and-conformance-runner)

Owned apex domains and concrete login application URLs were not provided. The Astro sites use the organizations' `github.io` addresses and include user-app/org-app integration guidance. Cloudflare DNS, cloud projects, database organizations, and authentication applications were not invented or provisioned as part of this library delivery.
