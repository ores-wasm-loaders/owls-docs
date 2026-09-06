# Repositories

## `ores-wasm-loaders`

| Repo | What it is |
| --- | --- |
| [`owls-interfaces`](https://github.com/ores-wasm-loaders/owls-interfaces) | The release contract: JSON Schema and its TypeSpec peer, the invariants a schema cannot state, and TypeScript / Dart / Rust projections. |
| [`owls-web-loader`](https://github.com/ores-wasm-loaders/owls-web-loader) | The browser, worker and SSR half: bounded verified preparation, the prepare-vs-activate split, and the raw-wasm / wasm-bindgen / Leptos / Dioxus / Flutter adapters. |
| [`owls-runtime.rs`](https://github.com/ores-wasm-loaders/owls-runtime.rs) | The native Rust host over Wasmi, with explicit capabilities and fuel and memory limits, plus build-output inspection that emits and verifies a release manifest. |
| [`owls-flutter`](https://github.com/ores-wasm-loaders/owls-flutter) | The Dart host, for Flutter apps that load WASM themselves and for the WebView bridge. |
| [`owls-docs`](https://github.com/ores-wasm-loaders/owls-docs) | This documentation. |

## `ores-wasm-loaders-test`

| Repo | What it is |
| --- | --- |
| [`owls-e2e`](https://github.com/ores-wasm-loaders-test/owls-e2e) | The external consumer suite: real framework consumers, the five entry paths, hosting checks and adapter conformance — on this org's Actions minutes. |

The `-test` org exists so the browser matrix and external-consumer runs never spend a product
org's Actions minutes.
