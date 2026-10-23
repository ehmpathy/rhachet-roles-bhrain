# F111 — the paid-brain suite's `describe.skip` predates the branch, and stays

- raised 2026-10-06, by `mech-failhides-tests-review-ops` (nitpick.1), at 5.1 i002
- rework: **clean** — one line, in one suite, to swap a `describe.skip` for a gate
- status: 🟡 **BEST-GUESSED — keep the skip; dispute the nitpick**
- confidence: **80%**

## .the fork, stated fairly

`stepReview.caseBrain.claude-sonnet.integration.test.ts` opens with
`describe.skip(...)`, under the note `.skip = anthropic api too pricey for ci`.

| option | the claim |
|---|---|
| **A — keep the skip** | the line is byte-identical on `origin/main`. this branch touched only the suite's timeout bound and an `await`. the skip is a cost gate a human chose for a paid brain, never an absent resource read as a pass |
| **B — fail loud** | `rule.require.failfast` forbids a silent skip on an absent resource, and the file is in the diff |

## .taken, and why

**A.** the rule targets a test that cannot reach a resource it needs and passes anyway. this suite
can reach its resource; it is held back on PRICE, by an explicit, documented choice, and a run
with `THOROUGH=true` exercises it. to turn it into a loud failure would fail every CI run on a
cost decision, and to gate it on a flag would change a policy this stone never opened. the line
predates the branch, so it is out of this stone's scope either way.

## .rework, and why

**clean.** one suite, one line; a council that prefers B can swap it in a single edit.

## .confidence, and why it is not higher

`rule.forbid.failhide` lists `describe.skip` among forbidden forms with no carve-out for cost,
so a strict reader can hold B on the rule's letter.

## .where

`src/domain.operations/review/stepReview.caseBrain.claude-sonnet.integration.test.ts`

## .verdict

— (awaits the council)
