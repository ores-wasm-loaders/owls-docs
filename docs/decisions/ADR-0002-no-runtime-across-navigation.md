# ADR-0002: A running application is not carried across a navigation

## Status

Accepted — 2026-09-05.

## Context

The appealing version of this project is: the marketing page starts the engine, the app page
inherits it, arrival is instant. Browsers do not work that way. A new document gets a new
JavaScript realm; an evaluated module and its initialized objects do not transfer. What may
carry over is downloaded responses (in an eligible, site-partitioned cache) and, at the
browser's discretion, compiled code.

Designing as though the runtime transfers produces a fleet that "warms" things which are
silently thrown away, and hides the cost in preparation nobody measures.

## Decision

State the limit and design to it.

* The coordinator's state is per-document, and it says so in its own module documentation.
* Reuse claims are limited to bytes and, where a toolchain can accept it, a compiled module.
* Where a live runtime genuinely matters, the supported answer is a persistent shell — one
  document that starts as marketing and reveals the app — and for Flutter, one engine with
  embedded multi-view.
* Prerendering the destination page is offered as the honest alternative for "ready when we
  arrive", as an enhancement the click path never depends on.

## Consequences

* Nothing in this org's documentation promises a shared runtime, and the acceptance suite
  measures bytes-after-click rather than implying inheritance.
* Products that want a live runtime must choose the shell shape deliberately, which is a
  product decision rather than something a loader can grant them.
