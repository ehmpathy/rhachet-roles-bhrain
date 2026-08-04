# domain.term: forgive

term.chosen   = forgive
term.kind     = verb                 # noun | verb | adj — reused across objects & operations
term.synonyms.forbidden:
- waive
- excuse
- pardon
- wave-through
- dismiss

## .what
what an **overrule** does to a rung of the review ladder (a peer level, or the judge rung
`JUDGE_LEVEL`): it clears that rung's blockers so they no longer gate passage, WITHOUT the
reviewer's approval on its own merit. a forgiven rung is `overruled` — terminal by human grant,
not by convergence. forgiveness is rung-scoped: it clears exactly the named rung, never a rung
above it. there is no stone-wide forgiveness — the old `overruledAll` skeleton key was ripped
(see `term=overrule` and `define.review.human-forgiveness.md`).

the adjective form is **unforgiven** — a reviewer whose level was NOT overruled, whose
blockers still gate passage (e.g. `getStoneGuardReviewPeerUncontemplatedUnforgiven`).

## .refs
where the term is declared / used, plus notable examples:
- src/domain.operations/route/stones/setStoneAsOverruled.ts        # the overrule mints the forgiveness
- src/domain.operations/route/stones/setStoneAsForced.ts           # force = overrule (forgive) + approve
- src/domain.operations/route/guard/review/peer/meter/getOverruledReviewerSlugs.ts  # the forgiven reviewers
- src/domain.operations/route/guard/review/peer/getStoneGuardReviewPeerUncontemplatedUnforgiven.ts  # the un-forgiven, still-owed reviewers

## .reason
see the ref-level cluster beside this choice:
- `term=forgive._.choice.reason.md` — etymology, disputes, evidence
