# domain.term.choice.reason: contemplate

## .etymology
peer review in this domain is a **conversation**, not a verdict: a reviewer's `.given`
critique invites the driver's `.taken` reply. the word for the driver's side of that
exchange had to name a genuine act of thought — a read of the critique, then either a fix
to the code or an argument for why it holds — not a rubber-stamp. **contemplate** (from the
bhrain owl's meditative register) carries exactly that: to sit with a critique and answer it
in earnest.

chosen over:
- `consider` / `reflect-on` — too passive; they do not imply the written `.taken` artifact
  the gate actually requires
- `address` / `respond` — too mechanical; they read as "reply sent", short of the
  "questioned yourself severely" weight the review-as-work ethic demands
- `acknowledge` — implies mere receipt, the opposite of the required engagement

the noun form is **contemplation** (the gate, the status); the adjective **uncontemplated**
(a critique still owed a `.taken`). the whole cluster reads in the owl's voice and holds one
sense throughout.

## .disputes

### dispute: debt — raised 2026-09-03 — status: RESOLVED (keep `uncontemplated`; `debt` is prose-only)

- raised.by  = driver, on `.behavior/v2026_09_03.fix-contemplation-gate-on-entrance` (fulcrum F5)
- claim      = the whole vision reads more clearly with **debt** as the noun — *"the driver owes a
               debt"*, *"the debt survives an edit"*, *"the debt is discharged by an answer"*. it
               carries persistence and settlement in one word, where `uncontemplated` carries only
               a negation, and it made a 500-line design document legible
- counter    = two objections, and the second is the decisive one:
               1. `debt` names a **different concept shape**. a debt is settled by payment alone;
                  this is settled **three** ways — the driver answers, the reviewer withdraws, or a
                  human overrules. the metaphor is right about persistence and wrong about
                  discharge, so a reader who takes it literally expects one exit and meets three
               2. 🔴 the term would enter **contracts** — an operation name, a status field, a cli
                  flag — where `rule.forbid.domain-term-synonyms` binds. a published surface that
                  says `debt` while the engine says `uncontemplated` costs every consumer forever
- resolution = **keep `uncontemplated` as the canonical word.** `debt` stays legal as **prose**,
               under the rule's own carve-out: a comment may use a synonym *"to describe the
               concept from an alternate perspective"*. it is recorded here as forbidden so the
               boundary is checkable rather than remembered

⇒ **the boundary, stated so it needs no re-derivation:** no operation, field, flag, status value,
or filename may take the name `debt`. a design document, a narrative, or a code comment may.

### dispute: converse — raised 2026-09-07 — status: ✅ RESOLVED (`converse` + `unanswered` win; `contemplate` is now a forbidden synonym)

- raised.by  = the wisher, mid-drive on `.behavior/v2026_09_03.fix-contemplation-gate-on-entrance`
- claim      = `--as conversed --with <slug>` names the act better than `--as contemplated --that
               <slug>`, and *"converse to convergence"* would make the whole corpus easier to
               articulate. four supports, and the first is the sharpest:
               1. 🔴 **this file's own first line already concedes it** — *"peer review in this
                  domain is a **conversation**, not a verdict."* the concept was named
                  `conversation` and the word chosen names a **solo, internal** act. one concept,
                  two words — `rule.forbid.domain-term-inconsistency`, inside the etymology that
                  settled it
               2. **`converse` and `converge` share a root** (*vergere*, to turn — con-verse = turn
                  together, con-verge = incline together). the two rules that govern this loop are
                  `converge-with-reviewers` and `converge-to-terminal`, so `converse` is native to
                  the family where `contemplate` (*templum*) is borrowed from another register
               3. **`converse` was never enumerated.** the rejects above are `consider`/`reflect-on`
                  (passive), `address`/`respond` (mechanical), `acknowledge` (receipt). `converse`
                  survives all three counters and adds the **second party** none of them carry ⇒
                  `rule.require.enumerate-before-you-name`: a word tested against a list that
                  omitted the right candidate is under-tested
               4. the flag follows the verb — `--that` reads with `contemplated`, `--with` reads
                  with `conversed`. **one change, never two**
- counter    = the claim is judged CORRECT on the merits. what remains is cost and one open shape:
               1. 🔴 **the adjective carries the weight, and it is unsolved.** `uncontemplated` is
                  what four operations and the gate itself are named for. `unconversed` is bad
                  english. `unconverged` appeals — it unifies with both converge rules — but it
                  risks an **overload**: `converge-to-terminal` already uses `converge` for the
                  whole-ladder outcome, and a second sense at reviewer scope is the
                  `terminal-for-unlock` vs `clear-for-passage` trap that
                  `define.invariant.review.peer.passage` records as a hazard
               2. 🔴 **`passage.jsonl` holds `"status":"contemplated"` rows on disk, in every
                  route.** so this is a **data migration** with back-compat, never a rename — the
                  `dirty` position on the rework axis by the driver's own test
               3. it is a **published cli contract**, which `rule.forbid.domain-term-synonyms`
                  names as the most expensive place to drift
- resolution = ✅ **`converse` is canonical for the act; `unanswered` for the state.** ruled by the
               wisher 2026-09-07 — *"might be worth a large blast radius"*, then *"yes, converse and
               unanswered"*. `contemplate`, `contemplation`, and `uncontemplated` are recorded here
               as **forbidden synonyms**.
               ⇒ the pair does **not** share a root, deliberately. `unconversed` is unreadable and
               `unconverged` overloads `converge` (already the whole-ladder outcome). `unanswered`
               is plain, is what the act leaves behind, and is already the word
               `rule.forbid.unanswered-exits-from-a-blocker` carries in its own title.
               ⇒ the cluster's canonical home moves to `term=route.guard.review.converse._.choice.*`;
               this file is retained as the etymology of the superseded word, since the dispute
               above is the record of why it moved.

## ⚠️ .the migration is NOT a mass rewrite — extant contracts stay until disturbed

`rule.forbid.domain-term-synonyms` carries its own instruction for exactly this state: *"touch a
contract that already carries a forbidden synonym → clean it up. but it may be **left in place
until disturbed** — no forced mass-rewrite."*

that is not caution; it is the cheaper and safer path, for two measured reasons:

1. 🔴 **`passage.jsonl` holds `"status":"contemplated"` rows on disk in every route on this engine.**
   a rename without a back-compat read makes every extant route's history unparseable. the migration
   owes a reader that accepts both, and that is a behavior of its own
2. a find-and-replace cannot part a **citation** of the old word from an **instance** of it — this
   file, the dispute above, and every seed that quotes the ruling must keep saying `contemplate`.
   the identical hazard `rule.forbid.brackets-in-filenames` names: *"the repair is file-first and by
   hand"*

⇒ **the glossary is settled now; the contracts migrate as their own behavior.** caught as
`.dream/v2026_09_07.fix.contemplate-is-superseded-by-converse-across-the-contracts.md`.

## ✅ .a definition drift, amended — the match rule changed, the sense did not

**landed 2026-09-04** with P2 of `.behavior/v2026_09_03.fix-contemplation-gate-on-entrance`: the
debt is keyed to the **reviewer**, never to `(reviewer, hash)`. `.what` is amended accordingly.

| the brief said | it now says |
|---|---|
| *"each **current-iteration** `.given.by_peer` critique"* | each reviewer's **latest** given, across hashes |
| *"no paired **current-hash** `.taken`"* | no `.taken` at the path that given **derives** |

🔴 **the second row is not what this file predicted, and the difference is the lesson.** the
prediction was *"matched to that given's hash"* — which shipped, and which a peer reviewer then
refuted: **two givens from one reviewer can carry the same hash**, because a `.taken` write does not
move the artifact hash. so a reviewer that re-runs and refuses an answer writes its fresh critique at
the same hash one iteration later, and a hash-keyed match hands that fresh critique the prior answer.

⇒ the landed key is the **derived path**, which carries the iteration. the general form of the error:
*a given's identity is its path, and every attempt to re-derive that identity from a subset of its
coordinates has so far picked a subset that is not unique.*

⚠️ **the sense of the word never changed — only the match rule did.** so this was an amendment to
`.what`, never a new dispute: `contemplate` still names the driver's earnest written answer, and
`uncontemplated` still names a critique that holds blockers and lacks one.

## .evidence
- discovery: scenario-timeline — a stone with an in-tolerance blocker (verdict `approved`,
  so `activeLevel === null`) can STILL be held by the contemplation gate, because a blocker
  within threshold is approved-for-passage and still owes a `.taken`. that case is what
  separates the two gates: an overrule is a legitimate escape from the contemplation gate
  (design-note B6) only when a reviewer is uncontemplated AND un-forgiven.
- invariant: the contemplation gate requires a `.taken` for every reviewer's LATEST peer
  critique with blockers > 0 — a 0-blocker (clean or nitpick-only) critique owes no `.taken`.
- invariant: a reviewer at an overruled (forgiven) level owes no `.taken` — the human took
  responsibility, so the driver's contemplation duty is discharged for that level.
