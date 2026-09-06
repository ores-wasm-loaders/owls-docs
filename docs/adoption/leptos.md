# Adopting the loader: Leptos islands

## Build

Islands mode keeps ordinary components on the server and hydrates the marked ones. Emit the
manifest from what the build actually produced:

```sh
# Derive the manifest from the files the build actually emitted — sizes and digests included.
# owls-runtime::inspect_build refuses symlinks and guessed entrypoints; a hand-written manifest
# drifts from its build and takes integrity down with it.
cargo run -p owls-runtime --bin inspect-build -- \
  --dir target/site/pkg \
  --app-id <org>-web \
  --release "$RELEASE_ID" \
  --runtime wasm-bindgen \
  --base-url "https://assets.<org>.example/releases/$RELEASE_ID/" \
  > target/site/pkg/release.json

# Then validate it through the public validator, as a CI gate.
node -e "import('@ores-wasm-loaders/owls-interfaces').then(i => i.parseRelease(
  JSON.parse(require('fs').readFileSync('target/site/pkg/release.json')),
  ['https://assets.<org>.example'], i.releaseSchema))"
```

Declare the islands and the preparation budget in the manifest — `activation.islands` and
`prepareBudget` — so a host prepares in the right order and hydrates what the build emitted.

The tool finds `<name>_bg.wasm` and its `<name>.js` glue structurally, so it does not care
what your crate is called. Two candidate modules, or glue missing beside the module, is an
error naming what it found.

## Marketing page

```html
<script type="module">
  import { Coordinator, browserPolicy, prepareOnIntent } from '/vendor/owls-web-loader/index.mjs';
  import { LeptosAdapter } from '/vendor/owls-web-loader/index.mjs';
  

  const env = browserEnv(window);
  const coordinator = createCoordinator({
    env,
    validate: (m) => interfaces.checkManifest(m, interfaces.manifestSchema),
    adapters: [LeptosAdapter({ interfaces })],
  });

  await coordinator.loadManifest('/assets/releases/current/the release manifest (`release-v2`)');

  observeIntent(coordinator, [{ element: document.querySelector('#open-app'), appId: '<org>-web' }], { env });
</script>
```

That is the whole marketing-side integration: no preparation on load, one destination, and
nothing that runs application code.

## App page

```js
await coordinator.activate('<org>-web');
```

Islands hydrate once per document. Several islands entering the viewport together share one
initialization — the coordinator de-duplicates, and the adapter refuses a second hydration of
the same release.

## Two things not to assume

* **An island boundary is not automatically a separate download.** Whether islands ship as one
  bundle or several is decided by the emitted build graph, which is why the manifest is
  generated rather than written.
* **Sharing Rust crates between apps does not share browser downloads.** Two independently
  built apps do not reuse their common internal code as a separately cached library. That
  would need deliberately shared output artifacts, not merely matching dependencies.
