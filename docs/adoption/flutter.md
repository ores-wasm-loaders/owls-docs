# Adopting the loader: Flutter web

## Build

```sh
flutter build web --wasm

owls-manifest generate \
  --dir build/web \
  --app-id <org>-app \
  --release-id "$RELEASE_ID" \
  --framework flutter \
  --base-url "/assets/releases/$RELEASE_ID/" \
  --toolchain "flutter $(flutter --version | head -1 | cut -d' ' -f2) (wasm)" \
  --activation attach-view --host-selector '#app-view' \
  --cross-origin-isolated \
  --write

owls-manifest verify --dir build/web    # CI gate
```

The tool recognizes Flutter's own output names (`flutter_bootstrap.js`, `main.dart.wasm`,
`main.dart.mjs`, `main.dart.js`) and refuses a JS-only build, which needs no Wasm loader.

## What preparation does, and does not

Preparation fetches the bootstrap, the startup variant this runtime will actually use, and
the small critical assets. It **never executes `flutter_bootstrap.js`** — running it starts
the application.

Only one variant is prepared: the WasmGC module *or* the JS fallback, decided by
`supportsWasmGc`. Fetching both doubles the bytes on every marketing page for no benefit.
The real choice at startup remains Flutter's.

## Activation and multi-view

```js
import { FlutterAdapter } from '/vendor/owls-web-loader/index.mjs';

const adapter = FlutterAdapter({
  interfaces,
  global: window,
  supportsWasmGc: () => typeof WebAssembly?.Function === 'function',
  loadScript: (src) => new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.onload = resolve;
    el.onerror = reject;
    document.head.appendChild(el);
  }),
});

const view = await coordinator.activate('<org>-app', { host: document.querySelector('#app-view') });
// later, in a persistent shell:
await coordinator.deactivate('<org>-app');   // removes the view; the engine stays
```

With `attach-view`, the first activation starts one engine and attaches a view; later views
join the same engine and heap. Multi-view means several views of **one running application** —
it is not a way to host independently compiled Flutter apps in a shared engine, and separately
embedded iframes each initialize their own engine anyway.

## Hosting

Flutter's multi-threaded rendering needs cross-origin isolation. That is a property of *that
renderer*, not of Wasm in general, so apply COOP/COEP to the app path only — see
`owls-infra/hosting/_headers`. Applying it to a marketing site breaks unrelated embeds for no
gain. `owls-e2e`'s `checkHosting` flags a release that declares isolation but is not served
with it.

Wasm deferred loading is documented as experimental; do not build a fleet-wide architecture
on it without verifying the pinned SDK.
