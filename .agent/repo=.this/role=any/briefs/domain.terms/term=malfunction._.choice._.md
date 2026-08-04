# domain.term: malfunction

term.chosen   = malfunction
term.kind     = noun
term.synonyms.forbidden:
- crash
- error
- failure
- broke
- fault

## .what
a reviewer or judge **malfunction** is the verdict that it could not run, or its output could not be
read — an outcome OUTSIDE the verdict set. concretely: an exit code that is neither `0` (pass) nor `2`
(constraint), or an unreadable / absent output where a numeric verdict was owed. it is a broken
PROCESS, not a rendered judgement.

`malfunction` sits beside `constraint` in the exit-code taxonomy and the two must not be conflated: a
`constraint` (exit 2) is a legitimate hold the process chose to report (blockers exceed threshold, no
review files, an `approved?` that awaits sign-off); a `malfunction` is the process itself unable to
deliver any verdict at all. `getExitCodeClass` reads `0 → passed`, `2 → constraint`, else →
`malfunction`.

a malfunction is **terminal-for-unlock** (a broken lower rung does not hold a higher rung from a run)
but it **blocks passage**: a stone cannot pass while a reviewer or judge is malfunctioned. only a
human `--as overruled` forgives it (never the driver). in the tree it reads `💥 malfunction` — the
FACTUAL verdict — in both the live and persisted views; a human overrule is rendered separately as
`overruled ✓ — forgiven by human`, never by a rewrite of the malfunction word.

## .refs
where the term composes declared operations:
- src/domain.operations/route/guard/review/runStoneGuardReviews.ts   # the `{ malfunction: string }` review variant + reason strings
- src/domain.operations/route/judges/runStoneGuardJudges.ts          # the `{ malfunction: string }` judge emit
- src/domain.operations/route/guard/genContextCliEmit.ts             # asJudgeLiveMarkStatus / asReviewerTreeState render `💥 malfunction`
- src/domain.operations/route/stones/setStoneAsPassed.ts             # isJudgeForgivenByRung keys on exitClass === 'malfunction'; `passage = malfunction`
- src/domain.objects/Driver/GuardProgressEvent.ts                    # the `{ malfunction: string }` outcome variants

## .reason
see the ref-level cluster beside this choice:
- `term=malfunction._.choice.reason.md` — etymology + why `malfunction`, not `crash`/`error`/`failure`
