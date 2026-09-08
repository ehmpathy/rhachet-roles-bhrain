# domain.term: converse

term.chosen   = converse
term.kind     = verb                 # noun | verb | adj — reused across objects & operations
term.boundary = review
term.synonyms.forbidden:
- contemplate   # the superseded canonical word — see .reason
- contemplation
- consider
- address
- respond
- reflect-on
- acknowledge
- debt          # for the state `unanswered` — prose-only, never a contract term

## .what
what a **driver** owes a peer critique that holds blockers, before a stone may pass: it writes a
`.taken` reply to that reviewer's **latest** `.given.by_peer` critique. the gate holds passage until
every such critique is answered — unless the reviewer's level was **forgiven** by an overrule (then
its critique needs no `.taken`).

the adjective **unanswered** names a critique that holds blockers and has no `.taken` at the path
that critique **derives** — the reviewers still owed a reply AND not forgiven by an overrule.

⇒ **the act is two-party, and the word says so.** a reviewer speaks (`.given`), the driver answers
(`.taken`), and the exchange runs to convergence. that is the whole reason the word moved:
`con-verse` and `con-verge` are one root (*vergere*, to turn), and the two rules that govern this
loop are `converge-with-reviewers` and `converge-to-terminal`.

🔴 **the debt is keyed to the REVIEWER, never to the artifact.** an edit to the code under review
does not discharge it, and an answer stays an answer however many times the artifact changes after
it. a critique is discharged by exactly three things: the driver answers it, a human overrules its
level, or the reviewer speaks again with no blockers.

⚠️ **and a `.taken` answers ONE critique, never a reviewer in general.** two critiques from one
reviewer can carry the same artifact hash — a `.taken` write does not move that hash — so the pair
is matched on the **derived path**, which carries the iteration. a reviewer that re-runs and refuses
your answer is owed a fresh `.taken` at its new iteration.

## ⚠️ .the contracts still say `contemplate`, and that is sanctioned

the glossary is settled; the code is not yet migrated. `rule.forbid.domain-term-synonyms` permits
exactly this — *"left in place until disturbed — no forced mass-rewrite"* — and the migration is a
data migration, since `passage.jsonl` holds `"status":"contemplated"` rows on disk.

⇒ **read a `contemplate` in a contract as owed-a-rename, never as a second concept.** the migration
is `.dream/v2026_09_07.fix.contemplate-is-superseded-by-converse-across-the-contracts.md`.

## .refs
where the term is declared / used, plus notable examples:
- src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerContemplationStatus.ts   # reads the gate
- src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeersUncontemplated.ts     # the pure diff
- src/domain.operations/route/guard/review/peer/getStoneGuardReviewPeerUncontemplatedUnforgiven.ts  # owed AND un-forgiven
- src/domain.operations/route/stones/setStoneAsPassed.ts          # the gate that holds passage
- src/domain.roles/driver/briefs/rule.always.converge-with-reviewers._.md   # the loop this word names

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.review.converse._.choice.reason.md` — etymology, the dispute that moved it, evidence
- `term=route.guard.review.contemplate._.choice.reason.md` — the superseded word's own record
