# Pilot plan

A staged plan for adopting OWLS in one product before it reaches a fleet of organizations. Each stage has an entry condition, a deliverable, an exit criterion that is a measurement or an artifact rather than an opinion, and a stop condition.

The pilot's purpose is **not** to prove the loader works — the package tests do that. It is to find out whether this loading model improves a real product's entry experience, at what cost, and whether the shared layer survives contact with two different frameworks.

## Objective and non-objectives

**Objective.** Establish, with measurements, whether shared preparation and activation improve time to first useful interaction on one product's marketing-to-application path, and produce a template the remaining organizations can adopt without re-deciding the same questions.

**Non-objectives.** Not a performance claim before Stage 3. Not a fleet rollout. Not a rewrite of any application. Not a migration of framework code into shared packages.

## Preconditions

A pilot cannot start against a product that lacks these. Confirm each before Stage 0, because discovering one mid-pilot invalidates the measurements.

| Precondition | Why it blocks |
|---|---|
| A real build that emits WASM | Nothing to prepare otherwise |
| An asset origin that serves it | Correct `application/wasm`, CORS, and immutable content-hashed URLs are prerequisites, not details |
| A manifest produced from that build | Hand-written manifests drift from the build and invalidate integrity |
| A destination surface that activates | Preparation with no activation measures nothing |
| A known relationship between the two surfaces' origins | Determines which reuse is even possible |
| Somewhere to record measurements | An unrecorded pilot produces an anecdote |

If the product fails these, Stage 0 is the pilot: build the missing pieces in the isolated test organization first.

## Stage 0 — Prove the mechanism in the test organization

**Entry.** The shared packages install through Zed in a repository outside the loader organization.

**Do.** In the `-test` organization, stand up a minimal harness: a tiny reproducibly generated WASM fixture, a manifest carrying its real SHA-256 and byte length, a "marketing" page that emits declarative hints and cancellable intent preparation, and an "application" page that fetches, verifies, compiles, instantiates and asserts a known result. Add a checked verification tool that re-derives the fixture's digest and fails CI on drift. Record the isolation manifest the test organization's policy requires, with production connectivity off.

**Exit.** The harness deploys; all four scenarios — cold, prepared, repeat, retained — are distinguishable in its own output; the fixture verifier passes in CI; and the numbers, whatever they are, are written down.

**Stop if.** The mechanism cannot be demonstrated on a fixture you fully control. Nothing downstream gets easier with a real application.

**Why the test organization.** It is isolated by policy, carries no production credentials, and a wrong answer there costs nothing. It is also where the external-consumer suite already proves the three language hosts agree on one corpus.

## Stage 1 — One real Rust surface

**Entry.** Stage 0 exits; the product's Rust web surface renders HTML server-side and has a place to set response headers.

**Do.** Publish a real release manifest from the actual build with `inspect_build`, validate it with the public validator, and serve it at a stable path. Emit `Link:` headers from the SSR response using the DOM-free server export. Add the coordinator on the application surface with a `RawWasmAdapter` or the framework's pinned hook — `LeptosAdapter` for an islands build, `DioxusAdapter` where Dioxus owns splitting and routing. Change no application code beyond the mount point.

**Exit.** The application activates through the coordinator with integrity enforced; cold and prepared entry are measured separately; a deliberately corrupted asset is rejected; and activation still succeeds when preparation is disabled entirely.

**Stop if.** Activation requires forking the coordinator, or the adapter needs to reach into framework internals. That is a signal the seam is in the wrong place — fix the seam in the shared package, do not fork it downstream.

## Stage 2 — One real Flutter surface

**Entry.** Stage 1 exits. The Flutter application has a web target and a build produced with `flutter build web --wasm`.

**Do.** Use a generated custom bootstrap containing only the two template tokens, and let the supported loader lifecycle select the renderer and the JavaScript fallback. Start the engine in multi-view mode and attach views through the mount helper. Serve renderer assets from your own origin rather than an external CDN.

**Exit.** One engine serves at least two views; view removal is idempotent; the JavaScript fallback path is exercised on a runtime that does not support the WASM build; and the same release publishes and validates through the same contract as Stage 1.

**Stop if.** The build's bootstrap or loader API does not match the adapter's expectations. Pin the SDK version and fix the adapter against that pinned version; do not hand-write a bootstrap.

## Stage 3 — Measure, and only then claim

**Entry.** Stages 1 and 2 exit.

**Do.** Run the measurement protocol below on real deployments, not fixtures. Include slow networks, data-saver, and at least one low-end device class. Compare against the pre-pilot baseline captured before Stage 1.

**Exit.** A written result with per-scenario numbers, including any regression. A pilot that finds no improvement and says so is a successful pilot.

**Stop if.** Cold entry regressed, or preparation spends meaningful bandwidth for visitors who never enter the application. Both are grounds to drop to a lower strategy tier rather than to tune upward.

### Measurement protocol

Record for each of cold entry, prepared entry, repeat entry and retained activation:

- time from the entry action to first useful interaction,
- bytes requested and bytes reused (`transferSize === 0` as the cache-reuse signal, reported as a hint, not proof),
- verification, compilation and instantiation durations separately,
- memory high-water mark,
- preparation cancelled correctly on navigating away,
- failure behavior: prefetch disabled, prefetch failed, asset corrupted, manifest stale.

Repeat each cell enough times to see variance, and publish the distribution rather than a best case.

## Stage 4 — Template, then widen

**Entry.** Stage 3 produced numbers worth acting on.

**Do.** Extract what was product-specific into a small product-local package that depends on the shared versions and supplies the origins, cache namespace, limits, transport and adapter. Everything else stays in the shared packages. Write down the adoption checklist as the artifact other organizations follow.

**Exit.** A second organization adopts it from the checklist without changes to the shared packages. That is the real test of the abstraction — if the second adoption needs shared-package edits, the boundary was drawn around one product, not around the problem.

**Then widen in waves,** not all at once: a wave of three organizations, then hold for one release cycle to see what breaks in production, then widen. Per organization the work is a manifest producer in the build, hints on the marketing surface, and an adapter at the mount point; the shared coordinator, contract, corpus and policy shape are not re-litigated.

## Ownership per stage

| Stage | Needs | Artifact |
|---|---|---|
| 0 | Test-org repository access, CI | Harness site, fixture, verifier, isolation manifest |
| 1 | Rust build and deploy, asset origin | Manifest producer, `Link:` headers, adapter mount |
| 2 | Flutter web build, SDK pin | Custom bootstrap, multi-view host |
| 3 | Deployed environments, devices | Measurement record |
| 4 | A second organization | Adoption checklist, product-local package |

## Risks

| Risk | Signal | Response |
|---|---|---|
| Manifest drifts from the build | Integrity failures after a deploy | Generate manifests only with `inspect_build`; fail CI on drift |
| Speculative bandwidth cost exceeds benefit | Bytes prepared per visitor who never converts | Drop to Tier 1 hints, or to no preparation |
| Host implementations diverge | A corpus case disagrees across languages | The corpus is the gate; fix the host, not the corpus |
| Retained-runtime complexity leaks into products | Engine ownership disputes, view leaks | Restrict Tier 5 to surfaces that genuinely reuse a runtime |
| Cross-origin assumptions are wrong | Expected cache reuse does not appear | Re-derive from the origin relationship; partitioning is per top-level site |
| Cross-origin isolation enabled too broadly | Broken login or pop-up flows | Only threaded builds need it; scope it to those documents |
| A pilot claim outruns the evidence | A speedup quoted from a fixture | No claim before Stage 3, and publish the distribution |

## What a completed pilot must be able to say

- Which scenarios improved, by how much, with what variance, on which devices.
- What preparation cost in bytes for visitors who never entered the application.
- Which parts of the integration were shared and which were product-specific, as an actual file-level accounting.
- What broke, and what the shared packages had to change to accommodate a real build.
- Whether a second organization could adopt it without touching the shared packages.
