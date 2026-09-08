# F14 — `converse` replaces `contemplate`: the verb is settled, the adjective is not

| | |
|---|---|
| **rework** | 🔴 **dirty** |
| **status** | ✅ **RULED 2026-09-07** — `converse` + `unanswered`, by the wisher |
| **confidence** | **95%** that the critique is correct · the adjective was open at 50% and is now **decided** |
| **where** | `--as contemplated --that <slug>` · `setStoneAsContemplated` · `getRouteGuardReviewPeerContemplationStatus` · `computePeerUncontemplatedUnforgiven` · `getStoneGuardReviewPeerUncontemplatedUnforgiven` · `formatRouteGuardReviewPeerContemplatePrompt` · `"status":"contemplated"` in every route's `passage.jsonl` |

## .the fork, stated fairly

**keep `contemplate`** — settled, cited, with a `.reason` file and one resolved dispute (F5) behind
it. contracts across a published cli, five operations, and persisted route records already speak it.

**take `converse`** — `--as conversed --with <slug>`, and *"converse to convergence"* as the phrase
the whole corpus turns on.

## .taken, and why

🔴 **neither.** the call is the wisher's, and it was raised by them; the driver's job here is to
record it, price it, and name the part that is still unsolved. the dispute entry is at
`term=route.guard.review.contemplate._.choice.reason.md`.

## .why the critique is right, at 95%

1. 🔴 **the etymology file's own first line concedes it** — *"peer review in this domain is a
   **conversation**, not a verdict."* the concept was named `conversation`; the word chosen names a
   **solo, internal** act. that is `rule.forbid.domain-term-inconsistency`, inside the document that
   settled the term.
2. **the root is shared.** `converse` and `converge` are both *vergere* — turn together, incline
   together. the two rules that govern this loop are `converge-with-reviewers` and
   `converge-to-terminal`. `contemplate` (*templum*) is borrowed from a different register, and
   every doc a human reads glosses it back: `howto.drive-routes` says *"reply to the review"*, and
   `1.vision.yield.md` carries a whole their-words/our-words row for it. **a term that needs a gloss
   wherever it is used is a term under strain.**
3. **it was never enumerated.** the rejects on record are `consider`/`reflect-on` (passive),
   `address`/`respond` (mechanical), `acknowledge` (receipt). `converse` survives all three and adds
   the **second party** none of them carry ⇒ `rule.require.enumerate-before-you-name`.

## 🔴 .the part that is NOT settled — the adjective carries the weight

the verb is the easy half. `uncontemplated` is what the gate and four operations are named for, and
it has no clean successor:

| candidate | verdict |
|---|---|
| `unconversed` | bad english. a reader stumbles on it |
| `unconverged` | appeals — it unifies with both converge rules — but risks an **overload**: `converge-to-terminal` already uses `converge` for the whole-ladder outcome, so a second sense at reviewer scope re-creates the `terminal-for-unlock` vs `clear-for-passage` trap `define.invariant.review.peer.passage` records as a hazard |
| `unanswered` | plain and readable, and the word `rule.forbid.unanswered-exits-from-a-blocker` already uses in its own title. ⚠️ but it drops the `converse` root, so the cluster no longer reads as one family |

⇒ **a settlement that renames the verb and leaves `uncontemplated` has traded one inconsistency for
a worse one** — the act and its state would then come from two different words.

## .why the rework is dirty

`clean`/`dirty` is about what a reversal cannot restore, never about diff size (this page's own note
under `.the gaps`). two reasons, and the first is decisive:

1. 🔴 **`passage.jsonl` holds `"status":"contemplated"` rows on disk, in every route in every repo
   that uses this engine.** so it is a **data migration** with back-compat, never a rename.
2. it is a **published cli contract** — `rule.forbid.domain-term-synonyms` names that as the most
   expensive place to drift, since every consumer inherits it.

⚠️ **the wisher has already accepted the price in principle** — *"might be worth a large blast
radius"* (2026-09-07). so cost is not the open question. **the adjective is.**

## ✅ .the verdict — ruled 2026-09-07

> *"yes, converse and unanswered"* — the wisher

**`converse` for the act, `unanswered` for the state.** the pair does not share a root, and that was
the deliberate call: `unconversed` is unreadable and `unconverged` overloads `converge`. you converse
**with** someone; until you do, they are **unanswered**.

⚠️ **the glossary moved; the contracts did not, and that is sanctioned rather than deferred.**
`rule.forbid.domain-term-synonyms` carries the instruction — *"left in place until disturbed — no
forced mass-rewrite"* — and two facts make it the right read here:

1. 🔴 **`passage.jsonl` holds `"status":"contemplated"` on disk in every route on this engine.** a
   rename without a back-compat reader makes every extant route's history unparseable
2. a find-and-replace cannot part a **citation** of the old word from an **instance** of it — this
   entry, the dispute, and S08 must all keep the old word intact

⇒ landed: `term=route.guard.review.converse._.choice._.md` + `.reason.md` (the new canonical
cluster) · the dispute, resolved, in the superseded word's own `.reason` · the seed at
`.seeds/…case=S08-converse-to-convergence.md` · the migration at
`.dream/v2026_09_07.fix.contemplate-is-superseded-by-converse-across-the-contracts.md`.

🔴 **what this fulcrum teaches, beyond the two words:** it is the only entry on this page whose
*cost* was pre-accepted while its *shape* stayed open. the council question inverted — from
*"is it worth it?"* to *"what is the adjective?"* — and the adjective turned out to be the half that
carried the weight, since `uncontemplated` is what the gate and four operations are named for. **a
rename priced on its verb alone is priced on its easy half.**
