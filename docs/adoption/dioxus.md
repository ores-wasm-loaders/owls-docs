# Adopting the loader: Dioxus route chunks

## Build

```sh
dx build --release --platform web

owls-manifest generate \
  --dir dist \
  --app-id <org>-app \
  --release-id "$RELEASE_ID" \
  --framework dioxus \
  --base-url "/assets/releases/$RELEASE_ID/" \
  --activation mount-route --host-selector '#dioxus-root' \
  --route /app=chunks/app.wasm \
  --route /app/reports=chunks/reports.wasm \
  --write
```

Chunks emitted under `chunks/*.wasm` are recorded as `chunk` entrypoints. Declare the
route→chunk map from what the framework's splitter actually emitted; the loader cooperates
with that splitting rather than re-implementing it.

## Activation

```js
await coordinator.activate('<org>-app', { route: location.pathname });
```

Route resolution prefers the longest declared prefix, so `/app/reports/42` resolves to the
`/app/reports` chunk. A route that maps to no chunk is an error naming the declared routes —
better than mounting the wrong bundle and looking like a routing bug.

## Preparing a route the visitor is heading to

Treat an in-app link the same way a marketing page treats "Open app": prepare on intent,
activate on click. The chunk is already in the manifest, so it is inside the same budget and
the same telemetry as everything else.
