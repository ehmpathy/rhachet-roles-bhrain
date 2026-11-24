# F5 — keep the urgent judge halt meter-blind

## .the fork

`judgeReviewed` prints the urgent halt from the concession corpus alone (`route.ts:1551`). where the urgent lane still holds rounds, the printed top-up meets `rounds-remain`. options:

- **a.** keep the halt meter-blind; the refusal teaches the fix. catch a meter-aware halt as a dream (`.dream/v2026_11_21.fix.the-urgent-judge-halt-reads-the-meter.md`)
- **b.** read the meters in `judgeReviewed`. print the top-up only where a lane has run dry, and print "a round is in hand — fix, then re-arrive" elsewhere

## .taken, why

a. b adds a route read to the judge path and moves the acceptance snapshots. that is a behavior change beyond the owner line the wish names. a fails safe: exit 2, the fix named, the guard unchanged. and it is strictly better than today, where the same refusal reaches a human instead.

## .rework

clean: b lands later in the judge alone. the render takes one more input.

## .confidence, why low

70%: `formatBlockRemedyGroups`'s own docblock calls an advertised refusal a pit, and that applies here. a reviewer may ask for b in this pr. the frequency of the cell is unmeasured.

## .where

`route.ts:1546–1562`, `asJudgeUrgentHaltLines.ts`

## .verdict

reversed to b in 5.1 i003. r010 showed the halt's main path is a lane with a round in hand (a
concede, then a re-arrive with no artifact change, so the lane stays cached). on that path a
printed top-up is refused `rounds-remain`, so a meter-blind halt advertises a refusal on most of
its renders. the judge already read the meters (`peerStatuses`), so b adds no route read.

- grant rows render only for a lane `hasReviewerRunDry` calls dry
- a lane in hand gets "a round is in hand — <lane>; a grant opens once it runs dry"
- clamps: `asJudgeUrgentHaltLines.test.ts` `[case4]`–`[case6]` (7 red on sabotage) · `routeStoneJudgeTally` `[case3][t2]`, `[case4]`

the reversal was the driver's, on peer-review evidence. no foreman verdict stands on it. 5.3 r012 (`enroll-verif-test-intent`) holds that the meter-aware halt changes locked behavior beyond the wish, and asks for explicit sign-off or a revert to a. disputed at 5.3 i009; the council decides. the rework to a is clean: drop the `meters` input from `asJudgeUrgentHaltLines`, delete cases 4–6, `[case3][t2]` and `[case4]`, and restore `[case3][t1]` to `budget: 5`.
