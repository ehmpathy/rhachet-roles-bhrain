# domain.term: overrule

term.chosen   = overrule
term.kind     = verb                 # noun | verb | adj — reused across objects & operations
term.synonyms.forbidden:
- override
- bypass
- skip
- veto
- wave-through

## .what
the human act that **forgives** exactly ONE rung of a stone's review ladder, early — before
that rung reaches terminal on its own merit. an overrule at rung N clears that rung's blockers
(forgives it) and unlocks the next rung at once. it scopes to exactly one rung: a peer level, or
the judge rung (`JUDGE_LEVEL`) — never the whole ladder in one act. the `--as overruled` command
mints it.

overrule is the **early** half of human forgiveness; its late twin is `--as approved`
(exhaustion + approval), which pays once at the end for every exhausted rung. an overrule pays
per-rung, up front, to unlock the rung above sooner (see `define.review.human-forgiveness.md`).

the outcome of an overrule is a rung whose passage-status is `overruled` — terminal by human
grant, not by convergence.

## .refs
where the term is declared / used, plus notable examples:
- src/domain.operations/route/stones/setStoneAsOverruled.ts                 # the --as overruled command
- src/domain.operations/route/judges/setStoneGuardOverrule.ts               # mints the overrule record, scoped to one level
- src/domain.operations/route/judges/getStoneGuardOverruledLevels.ts        # reads the overruled rungs (a Set of levels)
- src/domain.operations/route/guard/review/computeStoneGuardOverruleTarget.ts  # which rung an overrule targets
- src/domain.operations/route/guard/review/peer/meter/JUDGE_LEVEL.ts        # the judge rung, overruled like any level

## .reason
see the ref-level cluster beside this choice:
- `term=overrule._.choice.reason.md` — etymology, disputes, evidence
