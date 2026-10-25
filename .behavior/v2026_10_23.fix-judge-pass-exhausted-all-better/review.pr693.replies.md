# replies: commander review on ehmpathy/rhachet-roles-bhrain#693

one reply per review comment, to post via `github.comment set` once ehmpathy/rhachet-roles-ehmpathy#1143 lands. every fix is in `8b459250c6d756a9b59f9b5f502b0dca7b4b9cdb`; ci at that head: 45 passed, 0 failed, 1 skipped (`github / apply`, post-merge only).

| comment | path:line | verdict |
|---|---|---|
| 4371942303 | `src/domain.operations/route/drive/getRouteDriveExhaustedMessage.ts:94` | fixed |
| 4371945313 | `src/domain.operations/route/drive/getOneRouteDriveBlockerMessage.ts:108` | fixed |
| 4371946642 | `blackbox/__snapshots__/driver.route.peer-concurrency.acceptance.test.ts.snap:712` | fixed |
| 4371947954 | `.behavior/v2026_10_23.fix-judge-pass-exhausted-all-better/1.vision.yield.md:2` | fixed |

---

## reply to 4371942303

fixed in 8b459250. the mixed shape is gone at every site in this diff: each signature now takes `slugs: { exhausted, urgent }`, with no variant on the bare namespace and none flattened beside it.

- `genRouteGuardExhaustedReason({ slugs: { exhausted, urgent }, concession })`, which was `{ slugs, concession, slugsUrgent }`
- `getStoneConcessionExhaustion` now takes `slugs: { exhausted }` and returns `{ kind, slugs: { urgent } }`, where it took `slugs` and returned `slugsUrgent`
- `computeConcessionExhaustionKind` and `computeUrgentConcessionLaneSlugs` now take `slugs: { exhausted }`
- the budget remedy group (`asBudgetHaltRemedyGroup`) now takes `slugs: { exhausted, urgent }`, where it took `exhaustedSlugs` and `urgentSlugs`
- the three callers (`getRouteDriveExhaustedMessage`, `getOneRouteDriveBlockerMessage`, `setStoneAsPassed`) pass the nested shape

the rule is radioed upstream to ehmpathy/rhachet-roles-ehmpathy as `rule(mechanic): forbid mixed nest+flat variants; require qualified names when variants exist`. it is held until the radio's robot token is set; the body sits at `appendix/radio.upstream.mechanic-qualified-variant-names.md`.

## reply to 4371945313

fixed in 8b459250. no slug list is left unqualified where a second lane set is in scope.

- `asJudgeUrgentHaltLines({ slugs: { urgent }, stone })` takes the urgent lanes, where it took a bare `slugs`
- the judge in `route.ts` names its local `slugsUrgentLive`, where it named it `urgentSlugs`
- every exhausted-lane list above reads `slugs.exhausted`

scope: `computeConcededLaneSlugs` predates this PR and keeps its `slugs` input, since it filters any lane list for concessions rather than one named set. its one async caller, `getStoneConcededLaneSlugs`, has no caller in src. say the word and both move to the qualified shape too.

this rule rides upstream in the same issue as 4371942303.

## reply to 4371946642

fixed in 8b459250. the shed now nests as a subbranch under the judge reason, one branch per axis:

```
└─ reason: blockers exceed threshold (2 > 0)
   └─ after 3 blockers shed (0 disputed + 3 conceded better)
```

- a new transformer, `asJudgeReasonBranches`, splits the reason on the one joiner `asJudgeReasonWithShed` writes (`JUDGE_REASON_SHED_JOINER`). a round-trip unit test pins it over no axis, one axis, and both axes
- it applies on both tree surfaces: the guard tree's judge leaf, and the `route.stone.set` header's `reason =` line, where the shed sits beside the urgent warn
- the judge's own `reason:` stdout stays one line, since the guard parses it
- resnapped: `driver.route.peer-concurrency` and `driver.route.exhausted-all-better`, 189 passed

## reply to 4371947954

fixed in 8b459250. `1.vision.yield.md` now opens with a `.tl;dr`:

- one line: the cause (a stance keyed to where the route sat)
- the stance key, before and after (an absolute path vs the given filename), as a diff
- the judge verdict, before and after (`passed: false` vs `passed: true … after 3 blockers shed`)
- one line: the shed rule already shipped, and the fix is the key

the requirement is radioed upstream to ehmpathy/rhachet-roles-bhuild as `rule(behaver): require a tl;dr atop every 1.vision.yield that demonstrates the heart of the fix`. it is held on the same token; the body sits at `appendix/radio.upstream.behaver-vision-tldr.md`.
