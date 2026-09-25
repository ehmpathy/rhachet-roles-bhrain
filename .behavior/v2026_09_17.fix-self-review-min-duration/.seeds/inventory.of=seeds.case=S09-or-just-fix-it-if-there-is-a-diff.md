# seed S09 — or just fix it if there is a diff

## .said

> or just fix it if there's a diff

## .settled

**the narrower repair, offered as the alternative to `S08`: where the two emits merely disagree on
the level, make them agree.**

⇒ measured, and there IS a diff:

| call site | what it passes as `index` |
|---|---|
| `findNextUnpromisedReview.ts:25` | `selfReviews.indexOf(nextUnpromised)` — **zero-based** |
| `setStoneAsPassed.ts:256` | `nextIndex + 1` — **one-based** |

one field, two conventions. so `--as passed` prints `rN` and `--as promised` prints `r(N−1)` for
the same owed review, and a driver who copies either can land wrong.

🟡 **this is a bound on `S08`, not merely a second option.** it says: do not redesign the path if
the defect is an off-by-one. the fork is *"is the ordinal the problem, or is this ordinal wrong?"*
and that is the question `F09` must answer.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F09-…` — the fork, with both branches costed
