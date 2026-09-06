# Preparation across marketing sites and applications

Start with a static marketing shell or SSR HTML. Add intent preparation on hover/focus and cancellable idle preparation only when the user has not enabled data saving and the connection is suitable. The library defaults to an 8 MiB speculative budget, 64 MiB maximum individual demand asset and a 30-second deadline; tune policy per product and device class.

Use the explicit lifecycle rule: preparation is optional and activation is reliable demand startup. The browser helper waits 150 ms of pointer/focus dwell, keeps a lease for 150 ms after pointer exit, starts immediately for touch/pointer-down, and releases unclaimed work when the document is hidden or enters `pagehide`. Activation joins a speculative job for at most 50 ms by default, then proceeds with its own demand signal. A `warmed`, `failed`, `cancelled` or policy-`skipped` preparation outcome is telemetry—not a reason to block or fail a click.

## Select the appropriate mechanism

| Tool | Good use | Limit |
|---|---|---|
| preconnect | One likely asset origin shortly before use | Consumes connection resources; does not fetch a build |
| preload as=fetch | Same-document critical WASM/data | Match CORS/credentials; does not compile or initialize |
| modulepreload | Build-owned ES module graph | Browser-managed traffic, not the coordinator's streaming budget |
| prefetch | Likely later navigation or optional assets | A hint; browser may ignore it and caches may be partitioned |
| Explicit prefetch API | Enforced sizes, hashes, policy and reusable owned bytes | Only resources in the release manifest |
| CacheStorage | Reuse verified public bytes after navigation | Origin-bound, quota-bound and evictable |
| Retained Flutter engine/views | Multiple surfaces from one Flutter build | One document owns the engine; independent builds need isolation |
| Native app file store | Persist verified bytes across process launches | Separate cache from browser/WebView; application must evict disk data |

For cross-origin assets return the correct Access-Control-Allow-Origin policy and match request modes. Serve WASM as application/wasm and JavaScript as a JavaScript MIME type. Use content-hashed/versioned immutable URLs with Cache-Control for release assets; serve the manifest with a policy appropriate to release selection and rollback. Do not relabel mutable paths immutable.

CSP must permit the necessary trusted script/connect/worker origins and WASM compilation. The browser fixture passes with wasm-unsafe-eval without JavaScript unsafe-eval. SharedArrayBuffer/threaded builds need their own cross-origin isolation and compatible embedded resources; do not enable COOP/COEP blindly across login/pop-up flows. Test the exact browser/framework output.

Flutter's custom bootstrap template contains only:
```js
{{flutter_js}}
{{flutter_build_config}}
```
Build it using `flutter build web --wasm`. Do not call the default bootstrap's auto-start path while preparing. Pass the supported Flutter loader configuration when selecting local CanvasKit assets. Our fixture sets canvasKitBaseUrl to /canvaskit/ so the tested build does not silently contact an external renderer CDN.

## Native and WebView preparation

A Flutter app can prefetch through its Dart host into its private file cache while idle and on unmetered power/network policy, then ask its injected WASM engine to execute on demand. OS background execution is limited; integrate lifecycle callbacks and cancel when suspended. This package does not claim unrestricted background downloading on iOS/Android.

A WebView has its own document/cache lifecycle. Register a fixed release and adapter in the trusted document; send only the bridge's allowlisted operation and release key. A reply means the asynchronous operation finished, not merely that JavaScript was queued. Attach the bridge only to a trusted document, enforce navigation decisions, and dispose it during teardown. Do not expose arbitrary URLs, evaluation, native filesystem paths or engine imports through it.

When preparation fails, keep the HTML/static shell and let activation retry through the normal verified demand path. If activation itself fails or times out, show a retry/help affordance and retain the fallback; do not silently replay the same adapter owner because framework startup may have partially changed the document. Deactivate the retained owner or replace the document before a deliberate restart.

## Measure before promising a speedup

Record cold navigation, warm navigation, retained-document activation and process restart separately. Measure bytes requested, bytes reused, activation duration, time to first useful view, memory high-water mark and cancellation. Include data-saving and slow-network runs. The supplied tests prove lifecycle and request reuse, not an 80–90% performance improvement.

## Primary references

- [Flutter initialization](https://docs.flutter.dev/platform-integration/web/initialization)
- [Flutter embedding](https://docs.flutter.dev/platform-integration/web/embedding-flutter-web)
- [Flutter Wasm support](https://docs.flutter.dev/platform-integration/web/wasm)
- [wasm-bindgen web deployment](https://wasm-bindgen.github.io/wasm-bindgen/examples/without-a-bundler.html)
- [MDN preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)
- [MDN prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/prefetch)
- [Wasmi](https://docs.rs/wasmi/0.46.0/wasmi/)
