# domain.term: route.guard.level

term.chosen   = level
term.kind     = noun
term.boundary = route.guard   # the rung ladder this coordinate indexes
term.synonyms.forbidden:
- tier
- rank
- depth
- priority

## .what

a **guard.level** is a **rung's numeric coordinate on the guard ladder** — `1`, `3`, `JUDGE_LEVEL`.
it is a position index, never the position itself.

the ladder climbs low-to-high, cheap-first: level 1 peers → level 3 peers → the judge. a higher
level opens only once every level beneath it is terminal.

## ⚠️ .level is a COORDINATE. the rung is what sits at that coordinate

this is the distinction `term=route.guard.rung` already declares, and this cluster exists so the
other half of it has an address too:

| term | is | the analogy |
|---|---|---|
| **rung** | the gate-position you climb — an entity that holds reviewers | a step |
| **level** | that rung's numeric coordinate | the step's height |

⇒ **a rung HAS a level.** `isJudgeRungHeld` asks about the judge *rung*; `JUDGE_LEVEL` is that
rung's *level*. do not collapse the two.

🔴 **the practical consequence, and the reason this cluster was written:** an attribute that
describes *the reviewers at a gate-position* belongs to the **rung**, never to the level. a level is
an integer, and an integer holds no reviewers, spawns no subprocess, and pours at no rate.

⇒ the tell is grammatical: *"level 3 runs one at a time"* attributes a behavior to a coordinate.
*"the rung at level 3 runs one at a time"* attributes it to what acts.

## ⚠️ .why `level` survives despite the ordinal/cardinal hazard

a guard that carries `level: 3` beside a count of `3` invites a reader to relate two numbers that
are unrelated — one an **ordinal** (a position), one a **cardinal** (a quantity).

that is a real ergonomic edge and it is **not** a reason to rename: `level` is the word the wisher
speaks, the word the yaml key already carries, and the word every extant guard file declares. the
repair is to keep counts off the level and on the rung, never to coin a synonym for a settled word.

## .refs

where the term composes declared operations:
- src/domain.operations/route/guard/review/peer/meter/JUDGE_LEVEL.ts                    # the judge rung's coordinate
- src/domain.operations/route/guard/review/peer/meter/getReviewLevelByIndex.ts          # maps a reviewer index to its level
- src/domain.operations/route/guard/review/peer/meter/isLevelOverruled.ts               # is this coordinate overruled
- src/domain.operations/route/guard/review/peer/meter/computeReviewLevels.ts            # the levels of a guard's peers
- src/domain.operations/route/guard/review/getStoneGuardLevelState.ts                   # the state of each level
- src/domain.operations/route/guard/review/peer/meter/isReviewLevelUnlocked.ts          # is this level open yet
- src/domain.objects/Driver/RouteStoneGuard.ts                                          # `level?` on a peer reviewer

## .reason

see the ref-level cluster beside this choice:
- `term=route.guard.level._.choice.reason.md` — why a coordinate earns its own cluster, why `tier`
  and `rank` are forbidden, and the ordinal/cardinal hazard that prompted it
