# ADR-0003: The manifest is generated from the emitted build graph

## Status

Accepted — 2026-09-05.

## Context

A loader needs to know a release's entrypoints, their roles, their digests and what is safe
to prepare. The tempting shortcut is a convention: "the module is always `<crate>_bg.wasm`,
the glue is always `<crate>.js`". Across 35+ orgs and several toolchains, conventions are
wrong often enough — renamed crates, route chunks, a JS-only Flutter build — and the failure
shows up in a browser rather than in CI.

## Decision

`owls-runtime.rs` reads the actual build directory, hashes every file, classifies roles
from what is there (Flutter by its own toolchain names; wasm-bindgen structurally, by
`<name>_bg.wasm` beside `<name>.js`), and derives the preparation budget from the real sizes.
`owls-manifest verify` re-checks a manifest against the tree: a missing file, a changed digest,
an unlisted file or a mutable release path is an error.

Ambiguity is an error, not a guess: two candidate modules, or glue missing beside a module,
fails with what was found.

## Consequences

* The manifest cannot drift from the release it describes without CI noticing.
* A new toolchain shape needs a change in one place, with a test naming the shape.
* The crate is standard-library only, so it runs in every org's CI before any dependency is
  installed.
