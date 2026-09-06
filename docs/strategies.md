# Preparation and activation strategies

[Preparation across marketing sites and applications](preloading.md) covers which browser mechanism to reach for. This document covers the decision: which strategy a given surface should run, what each one actually buys, and the rules activation must obey.

The distinction the whole design rests on: **preparation reuses downloaded bytes; activation starts a runtime.** They have different owners, different failure semantics, and different lifetimes. Conflating them is how a marketing page ends up booting an application nobody asked for.

## What survives what

Before choosing a strategy, be exact about what carries across a navigation.

| Prepared thing | Same document | Same-origin navigation | Same-site, cross-origin navigation | Cross-site navigation |
|---|---|---|---|---|
| Downloaded response bytes | Yes | Eligible HTTP cache | Eligible; caches are partitioned by top-level site | Not reusable |
| `CacheStorage` entries | Yes | Yes, origin- and quota-bound | No — bound to the writing origin | No |
| Compiled `WebAssembly.Module` | Yes, if retained | No | No | No |
| Evaluated JS module and its objects | Yes | No | No | No |
| Running engine, views, application state | Yes | No | No | No |

Two consequences worth stating plainly:

- A normal navigation never hands a running loader to the destination page. If a live runtime genuinely must survive, keep the document — a persistent shell, or Flutter's embedded multi-view mode where one engine serves several views — rather than expecting navigation to carry it.
- "Same site" and "same origin" are different. Because `github.io` is on the Public Suffix List, `example.github.io` is itself the registrable site and `app.example.github.io` is a same-site, cross-origin subdomain: partitioned HTTP cache reuse is expected across that hop, while `CacheStorage` and every JavaScript object are not.

Browser code caches have their own thresholds and eviction. Treat compiled-code reuse as an optimization that may happen, never as the mechanism a strategy depends on.

## The four scenarios to design for, and to measure

Every strategy below should be evaluated against all four, separately:

1. **Cold entry** — first visit, nothing cached, no preparation ran.
2. **Prepared entry** — preparation completed on a prior surface, then the user navigated.
3. **Repeat entry** — a later session, whatever survived eviction.
4. **Retained activation** — the same document, already prepared, activating now.

A strategy that improves 2 and 4 while regressing 1 is a bad trade, and only a measurement will show it.

## Strategy ladder

Pick the lowest tier that meets the need. Each tier costs more complexity and more ways to be wrong.

### Tier 0 — Serve the content first

Static marketing HTML or SSR output, no loader, no hints. This is the correct strategy for a page whose visitors mostly never enter the application. Preparing a build for everyone in order to help the few who continue is a bandwidth transfer from your users to your funnel.

### Tier 1 — Declarative hints, zero JavaScript

Emit `preconnect` for the asset origin, and `prefetch` for the release's `prepare` assets, derived from the release manifest so the hint and the build cannot drift. On an SSR surface, emit the same descriptors as a `Link:` header instead.

Buys: warm connection and, subject to the table above, cached bytes on the next navigation. Costs: nothing at runtime. Limits: hints are advisory, browsers may ignore them, their traffic is not inside the coordinator's budget, and static hosts such as GitHub Pages cannot set response headers at all.

This tier is the right default for a marketing site, and it is the only tier that adds no script to a page that had none.

### Tier 2 — Intent preparation

Attach cancellable preparation to a real signal of intent — `pointerenter`, `focusin`, `touchstart` on the call to action — through `prepareOnIntent`. On surfaces with no hover, use focus and touch, and consider the first meaningful scroll rather than manufacturing a hover equivalent.

Buys: enforced budgets, verified bytes, deduplicated requests, and reusable owned bytes rather than a hint the browser may discard. Costs: script on the page, and a policy decision per surface. Rules: honor `saveData` and slow-connection signals through `allowPreparation`; cancel on navigation away; a failed speculative fetch must never poison the later demand fetch.

### Tier 3 — Idle preparation

`prepareWhenIdle` for a surface where entering the application is the expected outcome — a signed-in dashboard shell, a documentation page for the app itself. Cancellable, budget-bound, and still subject to the data-saving veto.

Use it when intent is close to certain. Do not use it on a broad marketing page: it spends every visitor's bandwidth for the fraction who continue.

### Tier 4 — Destination prerendering

Speculation Rules `prerender` prepares the destination's own document, which is a different answer to the same goal: rather than trying to carry the current page's runtime forward, it builds the next page early. Treat it as an optional enhancement with eligibility checks and explicit guards against premature side effects. Document-level prefetch alone does not fetch an application's subresources.

### Tier 5 — Retained runtime

Keep the document. A persistent shell that begins as marketing content and later reveals the application can keep a compiled module or a running engine alive, because nothing was destroyed. Flutter's embedded multi-view mode is the strongest form: one engine, one heap, views attached and removed as surfaces appear.

This is the only tier that reuses a *runtime* rather than bytes. It is also the most invasive: one document owns the engine, independent builds need separate documents, and separately embedded iframes each initialize their own engine.

### Native and WebView surfaces

A Dart or Rust application prefetches through its own host into a private file cache, on an unmetered-network and power policy, then executes on demand through its injected engine. OS background execution is limited; integrate lifecycle callbacks and cancel on suspend. A WebView has its own document and cache lifetime: register a fixed release and adapter in a trusted document, expose only the allowlisted operation and release key, and treat a reply as "the asynchronous operation finished", not "the message was queued".

## Choosing a tier

| Surface | Default tier | Why |
|---|---|---|
| Static marketing page, broad audience | 1 | No script, no bandwidth spent on non-converting visits |
| Marketing page with a clear single CTA | 1 + 2 on that CTA | Intent is observable and cheap to act on |
| SSR application shell (Axum/Maud, HTMX) | 1 via `Link:` header | The server already knows the release |
| Signed-in dashboard that links into the app | 1 + 3 | Entry is near-certain |
| Docs or console embedding live components | 5 | The runtime is used repeatedly in one document |
| Flutter product with several surfaces | 5, multi-view | One engine, many views, one heap |
| Native app with an on-demand module | Native host prefetch | Bytes persist across launches; execution stays on demand |

## Budget arithmetic

Preparation is refused *before any request is issued* if the selected assets exceed `maxPrepareBytes`, or any one asset exceeds `maxAssetBytes`. Work the numbers from the build, not from a guess:

- Mark `prepare: true` only on assets on the critical path to first useful interaction. A 40 MiB optional data pack is a demand asset, not a speculative one.
- The default 8 MiB speculative budget is a deliberate constraint, not a target to fill. If a release cannot be prepared inside it, the honest answer is usually to split the build, not to raise the ceiling.
- `maxAssetBytes` (64 MiB by default) bounds demand loading too. It is the ceiling that protects against a manifest that is wrong.
- Hint emission is budget-checked with the same numbers, so a Tier 1 surface cannot quietly exceed what a Tier 2 surface would refuse.

## Activation rules

1. **One adapter object per release per host.** A second adapter for the same release is `adapter-conflict`. The first adapter's outcome is shared with every later caller.
2. **Activation failure is terminal for that owner.** By the time an adapter fails it may already have mutated the document or initialized a runtime, so retrying with the same owner is not safe. Recreate the host or document after application-specific cleanup.
3. **A deadline rejects the caller and signals cancellation. It does not undo anything.** A non-cooperative adapter's side effects survive it. Design adapters to observe `context.signal` at every await point.
4. **Activation never depends on preparation having succeeded.** It awaits an in-flight preparation, ignores its failure, and fetches what it needs. Clicking the button must work when the prefetch never ran, was cancelled, or was evicted.
5. **Registering a release ID with different content is an error, not an update.** Publish a new release ID and new immutable URLs instead; never mutate an active host's release content.
6. **Integrity covers what the coordinator fetches, and stops there.** A later dynamic `import()` of generated glue is a separate trust path: pin it with immutable deployment URLs, CSP, and supported import-map integrity.

## Anti-patterns

- Executing a framework's default bootstrap "just to warm the cache". Flutter's default bootstrap starts the application; fetch-only preparation and running the bootstrap are different operations.
- Calling `__wbindgen_start` by hand, or hand-writing a bootstrap to avoid a generated one.
- Preparing every runtime on every page because the visitor might go anywhere.
- Treating one organization's central CDN as a shared browser cache across 35 sites. Caches are partitioned by top-level site; a central origin simplifies release management, not caching.
- Merging an admin application and a marketing site with third-party scripts into one origin to save startup time. Origins are a security boundary first.
- Enabling COOP/COEP fleet-wide because "WASM needs cross-origin isolation". Only `SharedArrayBuffer` and threaded builds do, and enabling it breaks login and pop-up flows.
- Publishing a measured speedup from a lab fixture. Fixtures prove lifecycle and request reuse; they do not prove network or CDN behavior.

## Measuring before promising

Record, per scenario, per device class, and including data-saving and slow-network runs:

- bytes requested and bytes reused,
- time from the click on "Open app" to first useful interaction — not time until the loader reports success,
- verification, compilation and instantiation durations separately,
- memory high-water mark,
- cancellation behavior on navigating away mid-preparation.

`transferSize === 0` in the Resource Timing entries is the browser's report that a response was served from cache. It is a strong hint and a good regression signal; it is not proof of a CDN hit, and it is not a substitute for production measurement.
