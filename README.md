# OWLS — shared WASM loading across organizations

A reusable preparation and activation layer for TypeScript, Rust and Flutter/Dart. Prepare verified bytes without starting applications, retain runtime owners where the platform allows it, and let each organization supply its own transport, policy, storage and framework hooks.

| Repository | Responsibility |
|---|---|
| [owls-interfaces](https://github.com/ores-wasm-loaders/owls-interfaces) | JSON Schema, peer TypeSpec and TypeScript/Rust/Dart contracts |
| [owls-web-loader](https://github.com/ores-wasm-loaders/owls-web-loader) | Browser/worker coordination, generated-glue/Flutter adapters, SSR hints |
| [owls-runtime.rs](https://github.com/ores-wasm-loaders/owls-runtime.rs) | Native/server verified caching, bounded Wasmi runtime and build inspection |
| [owls-flutter](https://github.com/ores-wasm-loaders/owls-flutter) | Dart host, native stores and trusted WebView bridge |
| [owls-e2e](https://github.com/ores-wasm-loaders-test/owls-e2e) | External Zed consumers and real framework browser fixtures |

Start with [reproducible installation](docs/installation.md), then read [architecture and runtime boundaries](docs/architecture.md), [preloading guidance](docs/preloading.md), and [validation and current limits](docs/validation.md).

The [v0.1.1 release](https://github.com/ores-wasm-loaders/owls-docs/releases/tag/v0.1.1) carries the checksum-pinned registry snapshot. This preview works despite the public Zed registry outage and can be adopted by other organizations through normal Zed manifests and locks.

[Main organization site](https://ores-wasm-loaders.github.io/) · [External testing site](https://ores-wasm-loaders-test.github.io/)

MIT licensed. Generated framework glue and native host imports remain owned by the integrating application.
