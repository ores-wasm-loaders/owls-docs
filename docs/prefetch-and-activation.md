# Prefetch and activation strategies

## The rule

Preparation is speculative work done on behalf of someone who has not asked yet. So it is
bounded, cancellable, invisible, and never load-bearing. Activation is the thing they asked
for. Every strategy below is a way of deciding *when* to spend a little of the first so the
second costs less — and none of them is allowed to make the second depend on the first.

## The mechanisms, and what each is actually for

| Mechanism | Use it for | Do not expect |
| --- | --- | --- |
| `<link rel="prefetch">` | Resources a later same-site navigation will likely need. | A guarantee. It is a hint; the browser decides. |
| `<link rel="preload">` | Resources the *current* document needs soon. | A cache for a future page. |
| `<link rel="modulepreload">` | Fetching and preparing a JS module for *this* document's module map. | A cross-page module registry. |
| Speculation Rules `prerender` | Preparing the destination *page* on supporting browsers. | Universal support, or that document-prefetch pulls the app's subresources. |
| `fetch()` + `WebAssembly.compileStreaming` | Getting bytes into an eligible cache, and sometimes a compiled module. | That a compiled module survives navigation, or that every toolchain's init can accept one. |
| Service worker `CacheStorage` | Explicit, managed asset caching where offline or stronger control is worth the lifecycle. | A runtime shared across origins or orgs. |

`owls-web-loader` emits prefetch hints alongside real fetching, never instead of it, and
nothing downstream assumes a hint succeeded.

## The graduated policy

**On marketing load.** Serve content. Load the coordinator and the page's own interaction
code. Prepare nothing. A marketing page that eagerly prepares both a Flutter app and a Rust
app has made every visitor pay for a click most of them will not make.

**On intent.** `observeIntent()` arms on `pointerenter` and `focus` after a short dwell
(120 ms by default, so a passing cursor costs nothing), prepares immediately on
`pointerdown`, and disarms on leave. Touch has no hover, so a trigger that stays on screen
for a couple of seconds counts as intent too. Hiding the tab cancels what is in flight.
The default ceiling is one app per page.

**On activation.** Reuse whatever preparation left. Work correctly when there is nothing:
cancelled, over budget, evicted, or never started.

## Budgets

Every release declares its own ceiling in its manifest (`prepare.maxBytes`,
`prepare.maxConcurrency`), and the coordinator takes the *minimum* of that and the page's
own limits. Preparation walks assets in priority order — entrypoints, then `critical`, then
`optional`, never `lazy` — and stops when the budget is exhausted, recording what it skipped
and why. Truncation is a normal outcome, not an error.

`owls-runtime.rs` computes `maxBytes` from the build tree, so a budget that could never
cover a release's own critical bytes fails in CI rather than producing preparation that is
always truncated.

## How far preparation may go

Two stages, and the second is optional:

* `fetch` — pull bytes into an eligible cache. Always available.
* `compile` — additionally produce a `WebAssembly.Module`. Offered only when the release's
  policy allows it *and* the runtime provides `compileStreaming` *and* the adapter can
  actually hand a compiled module to its init path.

Flutter releases are `fetch`-only, by contract: the supported bootstrap owns compilation, so
a separately compiled module has nowhere to go. The manifest validator refuses a Flutter
release that declares `compile`.

Note also that browsers apply their own thresholds to what enters a persistent code cache.
"Compile everything on the marketing page, then navigate away" is not a strategy to build a
fleet on.

## What preparation must never do

The single rule that makes this safe to run on public pages:

* no script insertion, no dynamic `import()` of an entrypoint, no `eval`;
* no authentication, no session establishment, no redirect;
* no database writes, no subscriptions, no analytics for a session that has not started;
* no credentialed requests — preparation fetches with `credentials: 'omit'`.

For Flutter specifically: **do not execute `flutter_bootstrap.js` to "warm the loader"**.
Running it starts the application.

This is enforced two ways in `owls-web-loader`: preparation receives a frozen capability
object with no document in it, and a test fails the build if any prepare path in this org
mentions a construct that could execute code.

## Activation shapes

| Mode | Meaning |
| --- | --- |
| `attach-view` | Attach a view to an already-running Flutter engine (persistent shell, multi-view). |
| `hydrate-islands` | Hydrate server-rendered Leptos islands in place. Once per document. |
| `mount-route` | Mount the Dioxus route chunk the build graph declares for this route. |
| `run-app` | Start the whole application into a host element. |

Activation is idempotent per `(app, release)` within a document: several islands appearing at
once, or a click racing a hover, share one initialization.

## Choosing a strategy per surface

* **Marketing page → separate app page, same origin.** Prepare on intent; optionally
  prerender the destination. This is the common case and the one the fleet defaults to.
* **Marketing page → app on another subdomain.** Cross-origin: expect less reuse. Prepare the
  destination's critical assets on intent and rely on the app page's own loading; do not
  claim engine reuse.
* **Persistent shell.** One document that starts as marketing and reveals the app. This is
  the only shape where a live runtime is genuinely retained. For Flutter, use one engine with
  embedded multi-view rather than an engine per panel.
* **Islands inside a MASH page.** No navigation involved: prepare the island bundle when the
  island is about to enter the viewport, hydrate on entry.

## Measuring it

Wall-clock milliseconds on a CI runner mostly measure the CI runner. `owls-e2e` measures
**bytes and requests still outstanding after the click**, across five entry paths — cold,
prepared, cancelled, repeat, stale — and requires all five to end with a running application.
`owls-web-loader`'s telemetry (`prepare:*`, `activate:*`) is what tells a fleet whether it
prepares nothing, or prepares everything twice.
