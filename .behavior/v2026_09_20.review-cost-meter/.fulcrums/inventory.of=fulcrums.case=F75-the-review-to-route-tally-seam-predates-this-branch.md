# F75 — the review → route tally seam predates this branch

- rework = **dirty** — five modules lift, and every route guard caller re-points
- confidence = 🟡 **75%**
- raised.by = self, at i033 (r019 arch-smell-scopeleaks-review-ops blocker.1 and blocker.2)

## .the fork

`runOneReview.ts` imports five symbols from `route/` and `route/guard/review/`. the lane asks
the branch to lift or inject them, as it did for two other review → route edges.

| option | cost |
|---|---|
| lift the tally cascade into `review.peer/` now | five files move, the route guard re-points, the guard suites re-run |
| hold, and catch a dream | the edge stays, as it was on `main` |

## .taken — hold

- all five imports are byte-identical on `main`. this branch added no review → route import;
  the two edges it did add (asReviewRunIdentity, getAllReviewerLevels) are lifted
- the lift is real work in the route guard, a context this behavior does not change
- the earlier taken's claim — that `main` had no review → route import — was wrong, and its grep
  missed the relative form. the correct claim: this branch adds no such edge. verified with
  `rhx grepsafe --pattern "from '(\.\./)+route/|domain\.operations/route/" --path src/domain.operations/review`
- caught as `.dream/v2026_10_01.fix.runonereview-reaches-into-route-guard-for-its-tally-seam.md`

## .re-raised

i004 r019 (round `d92a187c`): the tally imports now sit in `getOneReviewTallyOutcome.ts`, a file
this branch added when it extracted the tally step out of `runOneReview.ts`. the file is new; the
edge is the same one, moved — `runOneReview.ts` no longer holds it, so the count of review →
route tally edges matches `main`. disputed again under this row.

## .why confidence is not higher

a reviewer may hold that a branch which lifted two peers of this edge owes the third.

## .verdict

🟡 BEST-GUESSED 2026-10-01 — hold; dispute blocker.1, concede blocker.2 (the grep gap) as better.
