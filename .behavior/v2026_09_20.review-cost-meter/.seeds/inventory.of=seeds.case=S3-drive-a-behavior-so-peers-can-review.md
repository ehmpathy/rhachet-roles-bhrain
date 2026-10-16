# S3 — drive a behavior so peers can review

## .said

> and where are the snapshot updates that prove these changes?
> `src/domain.operations/review/getOnePromptComposition.ts`

> please init a nano behavior, instantiate the wish, and drive. that way, you get the full
> review cycle; cover in the wish all the behaviors we added in this pr already

> then i can help review

> and so can our peers

> and we can dogfood these changes

## .settled

**a branch that ships new behavior owes a driven route, not a summary.** the work had been
built, tested, and narrated in conversation — and none of that is reviewable by anyone who
was not in the conversation.

three reasons, and they compound:

- the **wisher** can review a yield; they cannot review a transcript
- the **peers** run only when a guard runs them. no route, no lanes, no verdicts
- 🔴 the branch's own subject is the review cost meter, so to drive it is to **dogfood** it:
  the lanes this route runs are priced by the instrument this route built

⇒ and the snapshot question is the same claim one layer down. `getOnePromptComposition` had
assertions and no snapshot, so its attribution table could not be eyeballed in a PR diff —
a reviewer had to re-derive eight numbers from eight `expect` calls. **an assertion proves a
value; a snapshot shows a shape.** the census is a shape, and it was owed one.

## .landed

- `.behavior/v2026_09_20.review-cost-meter/` — the whole route
- `src/domain.operations/review/__snapshots__/getOnePromptComposition.test.ts.snap`
- `src/domain.operations/review/getOnePromptComposition.test.ts` — `[case6]`, which also
  closed a real gap: no case had covered a NEW target's diff exclusion in the census
