# F19 — `getNearMissGuardKey` carries no `One` / `All`

**rework** = clean · **status** = open · **confidence** = 85%

## .the fork

`rule.require.get-set-gen-verbs` (mechanic): *"get without One/All cardinality = BLOCKER"*. this
feature added `getNearMissGuardKey`, which returns `string | null`.

## .the measurement — 2026-09-14, `^export const get[A-Z]` over `src/**/*.ts`

| | count |
|---|---|
| exported `get*` | 122 |
| carry `One` or `All` | 25 |
| carry neither | 97 |

the 25 read a set (`getAllStones`, `getOnePassageReport`). none of the 97 returns a collection —
each computes one value (`getExitCodeClass`, `getDriveBlockerState`). ⇒ a de-facto convention the
rule does not name: cardinality marks a read over a set.

## .taken, and why

**conform to the 97, and raise the question.**

- a prefix pays only where it is uniform; two conformant files among 97 read as odd, not as vanguard
- `getOne*` on a value read makes a third convention
- a 97-file rename is its own change; its first files smuggled into a feature diff is the smuggled
  refactor `rule.always.fix-forward-under-scouts-honor` names

one repair was taken because a convention existed: the private levenshtein is `computeEditDistance`,
beside 31 `compute*` peers.

## .the counter-case

a blocker is a blocker, and *"everyone else does it"* is the rut. the rebuttal: the rut warns against
conformity with no test, and the table above is the test — 97 value reads, no measured defect.

## .rework

clean — one export, one import (`getNearMissGuardKey.ts`, `parseStoneGuard.ts`); not re-exported.

## .the verdict

open — conform this one, or sweep all 97. the adoption gap is caught at
`.dream/v2026_09_14.reseed.get-cardinality-is-20-percent-adopted.md`.
