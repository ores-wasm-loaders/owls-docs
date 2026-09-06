# Adopting the loader: Leptos islands

## Build

Islands mode keeps ordinary components on the server and hydrates the marked ones. Emit the
manifest from what the build actually produced:

```sh
owls-manifest generate \
  --dir target/site/pkg \
  --app-id <org>-web \
  --release-id "$RELEASE_ID" \
  --framework leptos \
  --base-url "/assets/releases/$RELEASE_ID/" \
  --toolchain "wasm-bindgen $(wasm-bindgen --version | cut -d' ' -f2) / leptos" \
  --furthest-stage compile \
  --island PricingCalculator --island SignupWizard \
  --write

owls-manifest verify --dir target/site/pkg    # CI gate
```

The tool finds `<name>_bg.wasm` and its `<name>.js` glue structurally, so it does not care
what your crate is called. Two candidate modules, or glue missing beside the module, is an
error naming what it found.

## Marketing page

```html
<script type="module">
  import { createCoordinator, browserEnv, observeIntent } from '/vendor/owls-web-loader/index.mjs';
  import { LeptosAdapter } from '/vendor/owls-web-loader/index.mjs';
  import * as interfaces from '/vendor/owls-interfaces/index.mjs';

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
