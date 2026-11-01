# F17: transformer units stay caselists

## .the fork

thirteen unit suites of pure transformers run as `TEST_CASES.map(test)`. wrap each row in given/when/then, or hold the caselist?

## .taken: hold the caselist

- `rule.prefer.data-driven` prescribes this exact shape for transformer units, with the same `TEST_CASES.map` as its example
- `rule.require.given-when-then` requires the hierarchy for integration suites and recommends it for units; every integration and acceptance suite here conforms
- a caselist is a table a reader scans by row; a nest would repeat one when per row and hide the table

## .rework: clean

a mechanical wrap per file; no assertion changes.

## .confidence: 90%

## .where

`src/domain.operations/memory/*.test.ts`; `src/contract/cli/asMemoryGuardNudge.test.ts`.

## .verdict

open.
