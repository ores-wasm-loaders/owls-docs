# owls-docs

Documentation for [`ores-wasm-loaders`](https://github.com/ores-wasm-loaders) — the fleet's
shared web-loading layer for 35+ marketing sites and the Flutter and Rust/Wasm applications
behind them.

Start here:

- [Architecture](docs/architecture.md) — what can be reused across pages and what cannot, why
  there are two adapters, and how the pieces fit.
- [Prefetch and activation strategies](docs/prefetch-and-activation.md) — which browser
  mechanism is for what, the intent policy, budgets, and what preparation may never do.
- [Pilot plan](docs/pilot-plan.md) — the two pilot products, what gets measured, and the
  decision gates before anything is propagated.
- [Adoption guides](docs/adoption/) — Flutter, Leptos, Dioxus, and why MASH pages need none
  of this.
- [Decisions](docs/decisions/) — the ADRs behind the design.
- [Repositories](docs/repos.md) — both orgs at a glance.
