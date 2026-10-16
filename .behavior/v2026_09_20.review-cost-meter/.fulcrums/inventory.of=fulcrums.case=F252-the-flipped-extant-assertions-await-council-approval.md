# F252 — the flipped extant assertions await the council's approval

- raised 2026-10-12, by `ergo-contract-snapshots` (nitpick.6, nitpick.17), at 5.3 i004
- rework: **clean** — an approval is a verdict; a rejection reverts tests whose source change is named beside them
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **85%**

## .the fork, stated fairly

`rule.forbid.test-intent-violations` asks that a change to an extant test's expectation be
documented **and** explicitly approved. this branch flips four sets, each with a `.retired` note
beside it:

| concern | the extant test | the flip | the source change behind it |
|---|---|---|---|
| nitpick.6 | `compileReviewPrompt.test.ts [case5]`, `[case8]`, `compileReviewPrompt.integration.test.ts` | a new file sends no raw diff; content precedes diff; a deleted file renders as `<target.diff kind="-">` | wish bar 6 — each target body carried once (F17) |
| nitpick.17 | `driver.route.conversation-visibility.acceptance` | the seer sees 2 files, not 4 | `$conversation` is lane-scoped |
| nitpick.17 | `driver.route.dispute-passage.journey.acceptance` | the ack tail names `--as absorbed` then `--as arrived` | the halt copy retired in F230 |
| nitpick.17 | `driver.route.failsafe.acceptance` | the reason reads `1 of 1 reviewer malfunctioned` | the per-reviewer reason header |

| option | the claim |
|---|---|
| **A — the fulcrum row is the approval channel** | the driver cannot approve its own flip. the rule's approval belongs to the council, and this row hands each flip up with its source change named, so the council decides once over all four |
| **B — revert until approved** | the rule grades an unapproved flip a blocker; revert first, re-flip after |

## .taken, and why

**A.** each flip is the test that follows a requirement the wish or a prior council verdict already
set (wish bar 6 / F17; F230). a revert would put the tests in conflict with the source they guard,
so the suite would go red on correct behavior. the reviewer itself grades both concerns a nitpick
for exactly this reason. what the rule asks for — explicit approval — is what this row requests.

## .rework, and why

**clean.** an approval closes the row. a rejection of any one flip reverts that test and its named
source change together; no other file rests on either.

## .confidence, and why it is not higher

the lane-scoped `$conversation` and the per-reviewer reason header have no wish bar of their own
to cite; their approval rests on this branch's verification stones, which the council has not yet
decided.

## .where

`src/domain.operations/review/compileReviewPrompt.test.ts` ·
`src/domain.operations/review/compileReviewPrompt.integration.test.ts` ·
`blackbox/driver.route.conversation-visibility.acceptance.test.ts` ·
`blackbox/driver.route.dispute-passage.journey.acceptance.test.ts` ·
`blackbox/driver.route.failsafe.acceptance.test.ts`

## .verdict

— (awaits the council)
