# Pilot plan

One HTML-first Rust product and one Flutter web product, measured before anything is
propagated to the rest of the fleet. `gha-indie-worker` is the pilot product; its sibling
`gha-indie-worker-test` runs the browser matrix so the production org's Actions minutes stay
free.

The point of a pilot here is not to prove the code runs — the suites already do that offline.
It is to find out whether preparation actually moves work off the click *on a real
deployment*, where CDN headers, cache partitioning and real network conditions apply.

## Stage 0 — land the org (this session)

- [x] `owls-interfaces`: manifest contract as TypeSpec + JSON Schema peers, validator,
      registry projection, fixtures for three frameworks.
- [x] `owls-web-loader`: prepare/activate split, budgets, de-duplication, cancellation,
      release pinning, intent policy, hints, telemetry.
- [x] `owls-web-loader`, `owls-web-loader`: the two adapters.
- [x] `owls-runtime.rs`: generate from a build tree, verify against it.
- [x] `owls-e2e`, `owls-e2e`, `owls-e2e`: five entry paths, hosting checks,
      adapter conformance.
- [ ] PRs merged in both orgs; `zed-pkg` descriptors published.

Exit: `node --test` and `cargo test` green in CI for every repo in both orgs.

## Stage 1 — one Rust product, one Flutter product

**`gha-indie-worker-web-server.rs` (MASH + Leptos islands).**

1. Add the manifest step to the island build: `owls-manifest generate --framework leptos
   --release-id <build id> --write`, then `owls-manifest verify` as a CI gate.
2. Serve releases from `/assets/releases/<releaseId>/` with the headers in `owls-infra`.
3. On the marketing page: load `owls-web-loader`, register the manifest, and call
   `observeIntent` on the "Open app" control. Prepare nothing else.
4. On the app page: activate. The page must work with preparation disabled — verified by
   running the same page with the coordinator's intent observer removed.

**`gha-indie-worker-flutter` (Flutter web).**

1. `owls-manifest generate --framework flutter --cross-origin-isolated` over the web build.
2. Apply the isolation headers to the app path only, never the marketing site.
3. Activate with `attach-view` inside a persistent shell if the product has one; otherwise
   `run-app`.

Exit: both products pass `owls-e2e`'s five entry paths against a real deployment, and
`checkHosting` reports no problems.

## Stage 2 — measure, before anything is propagated

Report, per product, from real sessions:

| Measure | Why |
| --- | --- |
| Bytes and requests after click, cold vs prepared | Whether preparation moved anything. |
| Time from click to *useful interaction* | Not "the loader resolved". |
| Preparation started / completed / cancelled / truncated | Whether the intent policy fires at the right time. |
| Bytes prepared for visitors who never clicked | The cost side of the ledger. |
| Stale-preparation events | How often releases land mid-visit. |

Decision gates, agreed in advance:

* If prepared entry does not measurably beat cold entry on the app page, the fleet keeps the
  coordinator (for release pinning, idempotency and telemetry) and turns preparation **off**
  by policy. That is a real, acceptable outcome.
* If preparation costs more bytes for non-clicking visitors than it saves for clicking ones,
  raise the intent threshold (pointer-down only) before touching anything else.
* If cross-origin marketing → app shows no reuse, stop preparing across that boundary and say
  so in the adoption guide instead of quietly leaving it on.

## Stage 3 — propagate

Only after Stage 2 reports. Roll out in this order, in waves of about five orgs:

1. Orgs whose marketing and app share an origin (the layout where preparation pays).
2. Orgs with Flutter web apps and a persistent shell.
3. Everything else — coordinator, manifests, hosting rules and telemetry, with preparation
   left off unless that org's own measurement justifies it.

Each wave: a `chore/owl-manifest` PR (build step + CI gate) and a `feat/owls-web-loader` PR
(marketing page wiring), both gated on that org's tests, opened as drafts if a gate fails.

## Risks, and what is done about them

| Risk | Mitigation |
| --- | --- |
| Preparation quietly starts an app on a marketing page | Capability-scoped preparation plus the source gate in `owls-web-loader`. |
| A release lands mid-visit and halves are mixed | Release pinning; stale preparation is discarded, not reused. |
| A shared adapter drifts from a framework's supported lifecycle | Adapters wrap the framework's own machinery; conformance suite in the test org. |
| Cache partitioning makes fleet-wide sharing look worse than expected | Stated up front in the architecture; Stage 2 measures per product rather than assuming. |
| The loading layer drags in a dependency tree | No third-party runtime dependencies anywhere in the org; the composition check enforces it. |

## Rollback

Every stage is a PR that can be reverted independently. Removing the coordinator from a
marketing page leaves the app page working, because activation never depends on preparation —
which is the same property the acceptance suite tests on every commit.
