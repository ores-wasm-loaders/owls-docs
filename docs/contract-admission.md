# Cross-runtime contract admission

OWLS uses [`ORESoftware/typespec-json-schema-validator`](https://github.com/ORESoftware/typespec-json-schema-validator) as the shared admission boundary for release contracts consumed by browser, native Rust, and Flutter/Dart hosts.

## Authority model

The contract has two independent, human-maintained authorities:

1. TypeSpec source in `owls-interfaces/contracts/main.tsp`.
2. JSON Schema Draft 2020-12 source in `owls-interfaces/schemas/release.schema.json` (Schema A).

Neither source outranks or overwrites the other. TypeSpec generates Schema B only as comparison evidence. The validator checks declaration inventory, normalized structure, supported semantics, and shared instance verdicts. A passing run emits a digest-bound receipt and Contract IR; those artifacts are downstream admission evidence, not editable authorities.

Any stale source digest, unsupported feature, unexplained mismatch, tampered receipt, missing declaration, or runtime-projection drift stops admission. A successful language compiler alone cannot replace the peer-authority gate.

## Runtime boundary

The admitted declaration set is projected into five checked surfaces:

- TypeScript for the browser coordinator and framework adapters;
- Rust for native/server loading and build inspection;
- Dart for Flutter and embedded WebView hosts;
- Go for service and tooling consumers;
- Gleam for BEAM-side consumers.

Each production loader workflow pins the validator and `owls-interfaces` by immutable Git commit, verifies the checkout identity, regenerates Schema B and Contract IR, runs the appropriate Contract IR verifier, and checks the five-language projection receipt. The sibling `ores-wasm-loaders-test/owls-e2e` suite records the complete component source closure and reproduces admission independently.

## Evidence flow

```text
TypeSpec authority ------------------------.
                                           +--> typespec-json-schema-validator
Independent JSON Schema A authority -------'           |
                                                       +--> Schema B comparison witness
                                                       +--> parity receipt
                                                       +--> Contract IR
                                                       +--> language-projection receipt
                                                                |
                           +----------------------------+---------+------------------+
                           |                            |                            |
                    browser loader               native Rust loader            Flutter loader
                           \____________________________|____________________________/
                                                        |
                                              sibling E2E source-closure gate
```

The retained CI evidence includes exact component commits, toolchain versions, source and artifact digests, the parity receipt, Contract IR, projection receipt, and adversarial stale/tampered-evidence results.

## What this gate does not claim

Contract admission does not imply that a running application survives normal document navigation, that a speculative response remains cached, that all framework bundles share binary code, or that field performance thresholds have passed. Those remain separate lifecycle, browser, deployment, and measurement concerns.
