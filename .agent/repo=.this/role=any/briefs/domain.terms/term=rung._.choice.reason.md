# domain.term.choice.reason: rung

## .etymology

`rung` is the crossbar of a ladder — the one place your foot rests before the next. the guard
domain already spoke in ladder terms: peer-review *levels* sort low-to-high, a lower level unlocks
the next, and the driver ascends until the top. what the vocabulary lacked was a word for **one
gate-position in that ladder, of any kind** — peer *or* judge. `rung` fills exactly that hole.

the word was coined this round to carry the JUDGE_LEVEL redesign. the judge had been a gate
*beside* the peer levels, with its own bespoke overrule/unlock/passage branches. the redesign
folds it into the same ladder as its highest crossbar, so one predicate set governs every gate.
`rung` is the noun that makes that unification legible: "the judge is the top rung", not "the judge
is a separate thing that also gets forgiven."

## .why rung, not the rejected synonyms

- `step` — reads as an *action in a process* (a step you perform), not a *fixed position you must
  clear*. a guard rung is a gate that holds until terminal, not a move the driver makes.
- `stage` — implies a broad phase of work (the vision/execution/verification stones are closer to
  "stages"). a rung is finer: one gate inside one stone's guard.
- `checkpoint` — already claimed by `stone`'s neighborhood (a milestone on the route) and it
  implies validation-and-proceed; a rung can be *overruled* or *exhausted*, not only passed.

`rung` carries the one sense that matters: a discrete, ordered position on a ladder you must clear
to climb, neutral about how you clear it (approve, overrule, exhaust).

## .why rung and level are kept apart

this is the sharp edge, because the two are easy to conflate:

- **level** is a *coordinate* — an integer that fixes where a rung sits (peer `1`, peer `3`,
  `JUDGE_LEVEL`). it answers "how high?".
- **rung** is the *position itself* — the gate you stand on at that coordinate. it answers "which
  gate?".

a rung *has* a level the way a stair-step has a height: the height names the step, but the step is
the plank you stand on. `JUDGE_LEVEL` is a level (a number); the judge rung is a rung (a gate whose
level happens to be that number). `isJudgeRungHeld` reasons over the judge *rung*'s verdicts;
`JUDGE_LEVEL` is merely the coordinate that lets the ladder sort the judge last.

to hold the two apart prevents the drift that caused the very regression this behavior fixes —
where a *level* fact (a prior level terminal-for-unlock) was wrongly read as a *rung* fact (a later
rung clear-for-passage). one word for the coordinate, one for the gate; neither does the other's
job.

## .disputes

### dispute: level  —  raised 2026-07-26  —  status: RESOLVED (keep both, distinct concepts)
- raised.by  = learner (self, at this capture)
- claim      = `rung` is a synonym of the well-established `level`; a new word risks the synonym
               drift the glossary exists to prevent, and `isJudgeRungHeld` could read
               `isJudgeLevelHeld`.
- counter    = they name different concepts. `level` is the numeric coordinate (`JUDGE_LEVEL` is a
               number); `rung` is the gate-position at that coordinate. the code already carries
               both senses: a rung *has* a level. to merge them forces one word to mean both "the
               number" and "the gate", the exact overload `rule.forbid.ambiguous-labels` forbids.
- resolution = keep both, distinct. `level` = coordinate; `rung` = position. `rung`'s forbidden
               synonyms are `step`/`stage`/`checkpoint`; `level` is NOT a forbidden synonym but a
               kin concept. dispute closed.

## .evidence

- **code**: `rung` composes the declared operation `isJudgeRungHeld` and appears across 12 guard
  files (`JUDGE_LEVEL.ts`, `getStoneGuardLevelState.ts`, `getStoneGuardJudgeVerdicts.ts`,
  `computeStoneGuardOverruleTarget.ts`, `getReviewPeerLadderStatus.ts`, and others). the
  `JUDGE_LEVEL.ts` doc states it plainly: "the top rung of every guard's level ladder … the judge
  is not a gate outside the ladder; it is the highest rung."
- **design driver**: the JUDGE_LEVEL redesign (behavior `fix-route-overruled`, i011) needed a noun
  for "one gate in the unified peer+judge ladder" so overrule/unlock/passage could drop their
  judge-vs-peer special cases. `rung` is that noun; absent it, the unification has no name.
- **the regression it guards against**: the level/rung distinction is load-critical — the bug was a
  conflation of a level's unlock property with a rung's passage property. to name the two apart is
  what keeps the fix from a repeat drift.
