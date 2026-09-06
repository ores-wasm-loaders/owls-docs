# Architecture

## The question this org answers

We run marketing sites for 35+ GitHub orgs. Behind them sit real applications: Flutter web
builds, and Leptos/Dioxus islands and route bundles compiled to WebAssembly. The marketing
page is cheap; the application is not. So: can the marketing page get the application ready,
so that arriving at it costs nothing?

Partly, and the part that works is worth building once for the whole fleet. The part that
does not work is worth stating plainly, because designing around a false version of it is
how a "loading layer" turns into a page that silently boots the app for visitors who never
asked for it.

## What can actually be reused, and what cannot

| What you prepare | What a later page gets |
| --- | --- |
| Downloaded responses (JS, `.wasm`, fonts, renderer assets) | May be reused from an eligible browser cache. Partitioned by top-level site. |
| Compiled WebAssembly code | The browser *may* reuse its own compilation cache. Policy-dependent, not a portable guarantee. |
| An evaluated JS module and its initialized objects | Available within the same document. Not inherited by a new document. |
| A running Flutter engine or hydrated Rust app, with state | Stays alive only while the document does. A normal navigation does not hand it over. |

Two objects that are easy to conflate: a `WebAssembly.Module` is compiled code; a
`WebAssembly.Instance` has execution state. Preparation can sometimes produce the first. Only
activation produces the second, and only in the document that will use it.

So the goal is **"avoid redundant downloads and initialization"**, not "never run a bootstrap
again". Where a live runtime genuinely matters, the answer is a persistent shell — one
document that starts as marketing content and later reveals the app — not a claim that
navigation carries a runtime along.

## Origins matter more than orgs

Browser HTTP caches are partitioned by top-level site. Putting every org's loader on one CDN
therefore does **not** mean a visitor downloads it once for all 35 orgs; separate
`*.github.io` sites are separate sites for this purpose. A shared CDN is still worth having —
one release layout, one set of headers, one place to fix a content type — it just is not a
universal cache.

Within one product:

```
https://product.example/                          marketing (HTML-first)
https://product.example/app/                      the application
https://product.example/assets/releases/<id>/     immutable release assets
```

Same origin, same asset URLs, one manifest: this is the layout where preparation pays off.
Same-site subdomains (`www.` → `app.`) are cross-origin: they share no JS objects and no
running engine, and their asset reuse depends on the actual requests.

Security boundaries come first. Do not merge an admin application and a marketing site
carrying third-party scripts into one origin to save a few hundred milliseconds.

## The two verbs

Everything in this org is organized around keeping these apart:

```
prepare(appId)              fetch-only, bounded, cancellable, no side effects.
                            No script insertion, no dynamic import of an entrypoint,
                            no auth, no subscriptions, no writes.
                            Failing is a non-event.

activate(appId, { host })   start or reuse the application in THIS document,
                            using whatever preparation left behind — and working
                            correctly when none did.
```

`owls-web-loader` enforces this structurally rather than by convention: preparation runs with
a frozen capability object containing `fetch`, an `AbortSignal`, a log function and — only
when the release's policy and the runtime both allow it — a narrow `compileStreaming`. There
is no document in it, so an adapter's prepare path cannot insert a script even by mistake.
A test in that repo also scans this org's source and fails the build if a prepare path so
much as mentions `import(`, `eval`, or `createElement('script')`.

## The pieces

| Component | Responsibility |
| --- | --- |
| `owls-interfaces` | The vocabulary: the release contract as JSON Schema and TypeSpec peers, the invariants a schema cannot state, and the preparation order every host shares. |
| `owls-web-loader` | Scheduling and lifecycle in the browser: registry, budgets, integrity, de-duplication, cancellation, intent policy, hints and telemetry — plus the adapters, because activation is where frameworks differ. |
| `owls-runtime.rs` | The native host (Wasmi, explicit capabilities, fuel and memory limits) and build-output inspection: generating a release manifest from what a build actually emitted, and verifying one against the tree it claims to describe. |
| `owls-flutter` | The Dart host and the WebView bridge. |
| `owls-e2e` (test org) | Real framework consumers, the five entry paths measured in bytes-after-click, hosting checks, and adapter conformance.

The 80–90% sharing target lives in the first two rows plus the tooling: coordination,
validation, release handling, telemetry and policy. It is explicitly **not** a claim that
80–90% of application bytes, memory, or framework internals are shared.

## Why two adapters and not one

Flutter and Rust/Wasm do not share a loading contract:

* A Flutter web release boots through its own generated bootstrap, which owns renderer
  selection, the WasmGC-versus-JS-fallback decision, and engine initialization. Its Wasm is
  WasmGC; its startup is Dart's.
* A Rust release is a `wasm-bindgen` module plus JS glue generated for *that module's*
  imports and exports. The glue belongs to the release.

Nothing useful is shared below the lifecycle level, and pretending otherwise produces import
mismatches at instantiation. What *is* shared is everything above it: when to prepare, how
much, how to cancel, which release is current, what to do when it changes, and how to report
what happened. That is the coordinator.

Within Rust, Leptos and Dioxus differ only in the last step — hydrate the islands, or mount
the route — so they are two small hooks over one shared lifecycle, not two loaders.

## Release identity

A release is immutable and addressed by id:

```
/assets/releases/2026.09.05-a1b2c3d/the release manifest (`release-v2`)
```

The manifest is generated from the emitted build graph by `owls-runtime.rs` — never
hand-written from conventional filenames — and carries entrypoint roles, digests, sizes, the
preparation budget and the activation mode.

Mixing releases is refused. If a new release is published between preparation and the click,
the coordinator discards the stale preparation, emits `activate:stale-preparation`, and
activates the current release from cold. Slower, and correct; the alternative is an old
bootstrap meeting a new module.

## What a marketing page does

1. Serve its own content. Load the coordinator and the page's own interaction code, nothing
   else.
2. On intent — hover or focus of "Open app", a pointer-down, or a trigger that stays on
   screen on touch — prepare *that one* destination, within its declared budget.
3. On click, activate. If preparation happened, the bytes are local. If it did not, was
   cancelled, or was evicted, activation still works.

Prerendering the destination page (Speculation Rules) is a legitimate alternative for
"ready when we arrive" — it prepares the destination's own document rather than pretending a
runtime can be handed over. `owls-web-loader` can emit the rule; it is an enhancement, never
a dependency of the click path.

## MASH is not a Wasm stack

The maud/axum/htmx pages that most of our Rust web servers render are HTML with HTMX
interactions. They need no Wasm loader. Only their Wasm islands do. Server and ORM code is
never shipped to a browser to make the loading model look uniform.

## Related

- [Prefetch and activation strategies](prefetch-and-activation.md)
- [Pilot plan](pilot-plan.md)
- [Adoption guides](adoption/)
- [Decisions](decisions/)
