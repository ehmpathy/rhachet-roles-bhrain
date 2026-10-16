# F262 — a retired prompt assertion is inverted in place, under its lever

- raised 2026-10-12, by `ergo-acceptance-journey-coverage` (nitpick.7), at 5.3 i004
- rework: **clean** — a pair of assertions per retired line, if the council rules B
- status: 🟡 **BEST-GUESSED — disputed; the council rules on the record**
- confidence: **80%**

## .the fork, stated fairly

the prompt layout changed on this branch: a new file is sent as its diff alone, and the stable
bodies lead the volatile diffs. so three assertions in `compileReviewPrompt.integration.test.ts`
and one order assertion in `compileReviewPrompt.test.ts [case5][t1]` were inverted, each beside a
`.retired` note that names the lever (`F17`).

| option | the claim |
|---|---|
| **A — invert in place, with the `.retired` note** | the old expectation is now false. a test that kept it would assert a layout the branch removed on purpose, and the note records what changed and why |
| **B — keep the old as a retired record, add the new beside it** | `rule.forbid.test-intent-violations` asks for supersession or a cited approval, not an overwrite |

## .taken, and why

**A.** an old assertion cannot be kept live — it would go red against the shipped layout — so
"kept" can only mean kept as prose. the `.retired` note already is that prose, at the line it
replaced, and git holds the old assertion verbatim. the approval the rule asks for is the lever
itself: `F17` puts the two layout changes before the council, and this row puts the test edits
there beside it, which is the approval channel the rule's `.note` names.

## .rework, and why

**clean.** each inversion is one line; a reversal restores one line per assertion.

## .confidence, and why it is not higher

the rule prefers supersession by a new case over an edit of an old one, and this branch chose the
edit. the reviewer grades it a nitpick, so the cost of either verdict is small.

## .where

`src/domain.operations/review/compileReviewPrompt.integration.test.ts` ·
`src/domain.operations/review/compileReviewPrompt.test.ts`

## .verdict

— (awaits the council)
