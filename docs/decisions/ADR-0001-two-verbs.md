# ADR-0001: Preparation and activation are different operations

## Status

Accepted — 2026-09-05.

## Context

The request that started this org was "could our marketing sites pre-load the loader so the
app pages do not load it again?". The intuition is right, but "pre-load the loader" has two
readings that behave completely differently: fetch the bytes it will need, or run the
bootstrap that starts the application. The second one, on a marketing page, means auth
redirects for visitors who never clicked, live subscriptions, writes, and analytics for
sessions that never happened.

Flutter makes the ambiguity concrete: executing `flutter_bootstrap.js` — the obvious way to
"warm the loader" — starts the app.

## Decision

Two verbs, and preparation is capability-scoped so it *cannot* execute application code:

* `prepare(appId)` runs with a frozen object containing `fetch`, an `AbortSignal`, a log
  function, and optionally a narrow `compileStreaming`. No document. No module loader.
* `activate(appId, { host })` receives the document, and owns everything that runs.

A test additionally scans this org's source and fails the build if any prepare path mentions
`import(`, `eval`, `new Function`, `createElement('script')` or `WebAssembly.instantiate`.

## Consequences

* Preparation failing — cancelled, over budget, offline, evicted — is a non-event by
  construction: activation is tested from cold on every commit.
* An adapter author cannot "just quickly" start something during preparation; there is
  nothing in scope to start it with.
* Some optimizations are off the table (running an entrypoint early to warm module state).
  That is the intended trade.
