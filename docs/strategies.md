# Preparation, activation and fallback strategy

The operating rule is:

> Prefetching is optional preparation. Activation is normal reliable startup.

A successful hover or idle fetch is an optimization. It must never be the only way an application starts, and a failed or cancelled speculative request must not produce a user-visible activation failure by itself.

## Page layers

Use the lightest layer that helps the next interaction:

| Layer | Where | Behavior | Failure meaning |
|---|---|---|---|
| HTML shell | Marketing and application pages | Server-rendered navigation, copy, forms and loading state | No loader failure; HTML is the baseline experience |
| Browser hints | Same-origin or explicitly compatible asset delivery | `preconnect`, `prefetch`, `preload` or `modulepreload` may ask the browser to fetch | The browser may ignore, evict or partition the hint |
| Explicit preparation | A first-party coordinator | Enforces allowlists, exact sizes, streaming limits, SHA-256 and cache ownership | Report an outcome and continue with demand loading |
| Activation | Click, route transition or another product-approved action | Adapter loads glue/bootstrap, initializes the runtime and mounts the view/island | Show the product fallback and record a real startup error |
| Retained owner | A persistent document or shell | Reuses a live engine/module and can add or remove views | Requires explicit cleanup before restart |

### Marketing pages

The marketing page should be useful before any application JavaScript runs. Register a release only after the trusted page has obtained its manifest, and use explicit preparation only when the application’s asset origin is in the coordinator’s allowlist. A marketing page on `www.example` cannot assume that a visit to `app.example` will share a usable compiled module or browser cache entry. Same-site is not the same as same-origin, and cross-origin storage/cache partitioning varies by browser and context.

If the next application is on the same origin and the release is small enough, use a visible call to action as the intent target. If it is cross-origin, prefer a connection hint and let the destination application prepare its own assets. Measure the result rather than treating a `Link: rel=prefetch` response as a guarantee.

### Application pages

An application page owns the coordinator for its document. It may combine server-provided `Link` hints, `prepareWhenIdle` and `prepareOnIntent`, but all of those are optional. The application’s click/route handler calls `activate` regardless of whether preparation finished, was declined or never ran.

Keep one coordinator and one stable adapter per release key. Do not create a new adapter on every render, and do not call both a framework’s default auto-bootstrap and the OWLS adapter. The coordinator deduplicates activation for the same adapter and rejects a competing owner.

## Intent preparation

The browser helper uses conservative defaults:

- pointer or keyboard focus must persist for 150 ms before preparation begins;
- pointer exit gets a 150 ms grace period so a small pointer correction does not throw away work;
- focus keeps the lease alive even if the pointer leaves;
- touch or pointer-down is an explicit stronger signal and starts immediately;
- document visibility changes and `pagehide` release unclaimed preparation;
- a lease is reference-counted, so two components can express the same intent without one disposer cancelling the other.

```ts
const coordinator = new Coordinator(browserPolicy(["https://assets.example"]));
const release = coordinator.register(releaseManifest);
const key = `${release.appId}@${release.release}`;

const stopIntent = prepareOnIntent(openApplicationButton, coordinator, key, {
  dwellMs: 150,
  exitGraceMs: 150,
  onOutcome: outcome => metrics.record("preparation", outcome),
  onError: error => metrics.record("preparation-error", error),
});

const stopIdle = prepareWhenIdle(coordinator, key, error =>
  metrics.record("idle-preparation-error", error));

openApplicationButton.addEventListener("click", async () => {
  try {
    await coordinator.activate(key, applicationAdapter);
    showApplicationSurface();
  } catch (error) {
    // Keep the HTML shell or route fallback usable.
    showApplicationFallback(error);
  }
});

window.addEventListener("pagehide", () => {
  coordinator.cancelAllPreparation();
  stopIntent();
  stopIdle();
});
```

`prepareOnIntent` reports a failed preparation through `onOutcome`/`onError`; it does not activate the application. The helper’s disposer releases its lease. If a click arrives during the 150 ms exit grace period, activation claims the shared job and prevents the disposer from cancelling it.

For a component that needs explicit ownership rather than the DOM helper, use the lower-level API:

```ts
const lease = coordinator.prepare(key, componentAbort.signal);
try {
  const outcome = await lease.promise;
  metrics.record("component-preparation", outcome);
} finally {
  lease.release();
}
```

The same `prepare`/`prefetch` distinction exists in Dart. A native mobile/desktop product should connect cancellation to app lifecycle callbacks and use its private file store. Background execution is platform-controlled; do not promise that an OS-suspended Flutter app will finish a warmup.

## Activation handoff

On activation, the coordinator:

1. claims the current speculative job;
2. waits only up to `activationJoinMs` (50 ms by default, clamped to the overall timeout);
3. cancels unclaimed speculative work if it is still running;
4. invokes the adapter with a fresh activation signal;
5. reuses only bytes that passed the same size and SHA-256 checks; and
6. records one terminal activation owner.

The activation signal and preparation signal are different. A slow speculative request must not consume the activation deadline. Conversely, an adapter that ignores cancellation can continue executing after the caller’s deadline; applications must keep side effects behind the adapter owner and dispose the document/engine when necessary.

## Fallback policy

Treat the four preparation outcomes differently from activation errors:

| Outcome/event | User-visible action | Next operation |
|---|---|---|
| `warmed` | None; keep the normal loading UI | `activate` can reuse verified bytes |
| `skipped` because of data saver, slow network or policy | None | `activate` demand-loads on the approved path |
| `cancelled` because of pointer exit, hidden page or click handoff | None | `activate` demand-loads if the user continues |
| `failed` because of HTTP, MIME, size or integrity | Do not punish the user for speculation | `activate` retries through the normal demand path; alert only if demand also fails |
| activation timeout or adapter error | Keep HTML/static shell, show a retry/help affordance and record the failure | Do not replay the same adapter owner blindly; clean up/deactivate or create a fresh document/host |

For a Rust HTML-first page, the fallback is the server-rendered route and ordinary links/forms. A failed island enhancement should leave the HTML content intact. For Flutter web, keep a static loading/error shell outside the Flutter engine, and only reveal the Flutter surface after activation has returned a usable instance/view. If renderer or bootstrap assets are unavailable, the shell should offer retry/navigation rather than a blank document.

## Cache and delivery rules

Publish release assets under immutable, content-addressed or release-versioned URLs with `Cache-Control: public, max-age=31536000, immutable` when the deployment can guarantee immutability. The manifest and release selector need a separate rollback/update policy. Configure `Access-Control-Allow-Origin` for the exact consuming origin and make the response MIME match the manifest kind. Disable redirects and public credentials in the built-in transport.

Use `rel=modulepreload` only for build-owned JavaScript module graphs. Use `rel=prefetch` or `preload as=fetch` only when the request mode, CORS and cache behavior are understood. Link hints do not enforce a body byte budget or integrity check; explicit preparation does.

Keep generated glue and its imports in the application’s build integrity boundary. A coordinator hash check covers bytes it fetches; it does not automatically add integrity to a later dynamic `import()`. Flutter’s custom bootstrap must contain the trusted generated configuration and must not auto-start during preparation.

## Instrumentation

Every preparation and activation record should include `appId`, release, page kind (`marketing` or `application`), origin, network/device policy, trigger (`idle`, `hover`, `focus`, `touch`, `click` or `route`), outcome/reason, selected and prepared asset IDs, declared bytes, requested bytes, reused bytes, cancellation timestamp and activation owner ID. Avoid treating `performanceResourceTiming.transferSize === 0` as proof of a cache hit: it can also mean a missing entry, a reused connection or a reporting limitation. Combine coordinator events with server/CDN logs and a cache-aware test harness.
