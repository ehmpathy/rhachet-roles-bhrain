# domain.term: sweep

term.chosen   = sweep
term.kind     = noun
term.synonyms.forbidden:
- scan
- pass
- audit

## .what
a **sweep** is the learner's periodic reflect-and-distill pass over the domain terms a round
touched: recall the round's declared dobjs/dops, split them into terms, itemize each into the
glossary. its freshness is what the onStop sweephook watches.

## .refs
where the term composes declared operations:
- src/domain.operations/learn/getSweepProgress.ts   # get the sweep's progress sentinel
- src/domain.operations/learn/isSweepStale.ts        # is the sweep stale (> 1hr + articulated)
- src/domain.roles/learner/skills/learn.domain.terms.sh  # the skill that runs the sweep

## .reason
see the ref-level cluster beside this choice:
- `term=sweep._.choice.reason.md` — etymology + why `sweep`, not `scan`/`audit`
