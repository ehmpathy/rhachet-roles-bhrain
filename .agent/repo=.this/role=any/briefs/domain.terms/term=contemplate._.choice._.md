# domain.term: contemplate

term.chosen   = contemplate
term.kind     = verb                 # noun | verb | adj — reused across objects & operations
term.synonyms.forbidden:
- consider
- address
- respond
- reflect-on
- acknowledge

## .what
what a **driver** owes a blocker-bearing peer critique before a stone may pass: it writes
a `.taken` response to each current-iteration `.given.by_peer` critique that holds
blockers. the contemplation **gate** holds passage until every such critique is answered —
unless the reviewer's level was **forgiven** by an overrule (then its critique needs no
`.taken`).

the adjective **uncontemplated** names a critique that holds blockers and has no paired
current-hash `.taken` yet (e.g. `getStoneGuardReviewPeerUncontemplatedUnforgiven` = the
reviewers still owed a contemplation AND not forgiven by an overrule).

## .refs
where the term is declared / used, plus notable examples:
- src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerContemplationStatus.ts   # reads the gate
- src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeersUncontemplated.ts     # the pure diff
- src/domain.operations/route/guard/review/peer/getStoneGuardReviewPeerUncontemplatedUnforgiven.ts  # owed AND un-forgiven
- src/domain.operations/route/stones/setStoneAsPassed.ts          # the contemplation gate that holds passage

## .reason
see the ref-level cluster beside this choice:
- `term=contemplate._.choice.reason.md` — etymology, disputes, evidence
