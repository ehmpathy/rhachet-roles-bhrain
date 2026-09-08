# domain.term: contemplate

term.chosen   = contemplate
term.kind     = verb                 # noun | verb | adj — reused across objects & operations
term.boundary = review
term.synonyms.forbidden:
- consider
- address
- respond
- reflect-on
- acknowledge
- debt          # for the noun `uncontemplated` — prose-only, never a contract term

## .what
what a **driver** owes a peer critique that holds blockers, before a stone may pass: it
writes a `.taken` response to that reviewer's **latest** `.given.by_peer` critique. the
contemplation **gate** holds passage until every such critique is answered — unless the
reviewer's level was **forgiven** by an overrule (then its critique needs no `.taken`).

the adjective **uncontemplated** names a critique that holds blockers and has no `.taken`
at the path that critique **derives** (e.g. `getStoneGuardReviewPeerUncontemplatedUnforgiven`
= the reviewers still owed a contemplation AND not forgiven by an overrule).

🔴 **the debt is keyed to the REVIEWER, never to the artifact.** an edit to the code under
review does not discharge it, and an answer stays an answer however many times the artifact
changes after it. a critique is discharged by exactly three things: the driver answers it, a
human overrules its level, or the reviewer speaks again with no blockers.

⚠️ **and a `.taken` answers ONE critique, never a reviewer in general.** two critiques from
one reviewer can carry the same artifact hash — a `.taken` write does not move that hash — so
the pair is matched on the **derived path**, which carries the iteration. a reviewer that
re-runs and refuses your answer is owed a fresh `.taken` at its new iteration.

## .refs
where the term is declared / used, plus notable examples:
- src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerContemplationStatus.ts   # reads the gate
- src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeersUncontemplated.ts     # the pure diff
- src/domain.operations/route/guard/review/peer/getStoneGuardReviewPeerUncontemplatedUnforgiven.ts  # owed AND un-forgiven
- src/domain.operations/route/stones/setStoneAsPassed.ts          # the contemplation gate that holds passage

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.review.contemplate._.choice.reason.md` — etymology, disputes, evidence
