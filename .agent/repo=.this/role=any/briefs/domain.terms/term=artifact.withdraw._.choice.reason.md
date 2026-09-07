# domain.term.choice.reason: withdraw

## .etymology

from the ordinary sense — to **draw back** a statement one has made. the word carries the property
the domain needs and its rivals do not: **a withdrawn statement was still made.** a paper is
withdrawn and stays in the record with its retraction attached; a bid is withdrawn and the auction
log keeps it.

⇒ that residue is the whole point. every rival below erases it.

## .the rejected synonyms

| word | why not |
|---|---|
| `undo` | 🔴 the wisher's own word — *"so we undo this?"*. it names a return to the prior state, which is exactly what must NOT happen: the record of the claim stays. rejected on the sense, not the register |
| `revert` | git's word for a commit that reverses another. borrowed here it would collide with a dependency's vocabulary (`rule.require.domain-term-itemization`'s import clause) |
| `retract` | the closest rival, and it is used in this cluster's own prose as a gloss. rejected as the term because `withdraw` reads plainer and because `retract` invites the noun `retraction`, a second word for one act |
| `rescind` | legal register; it implies an authority that annuls, where most withdrawals here are the author's own |
| `cancel` | names a stop before completion. a withdrawn artifact was completed and published |

## .the enumeration that settled it

per `rule.require.enumerate-before-you-name`, the instances were listed **before** the word:

| # | the artifact | why it was withdrawn |
|---|---|---|
| 1 | `.dream/*.entool.scope-review-lanes-against-the-fork-point.md` | the fix it asked for is already in the code |
| 2 | `.dream/*.enbrief.undeclared-briefs-are-demoted-to-ref.md` | the behavior is deliberate |
| 3 | `.dream/*.amend.route-complete-wears-an-imported-seaturtle-vibe.md` | the glyph is not a defect |
| 4 | `src/domain.roles/driver/briefs/hazard.since-main-diffs-attribute-main-to-your-branch.md` | it taught a workaround for a defect that cannot occur |
| 5 | F25's repairs 1 and 3 | both rested on the same unread claim as #4 |
| 6 | F1, F2, F9 | settled by wisher defaults, earlier in the round |

**the list is what refuted the narrow candidates.** a word scoped to dreams would cover rows 1–3
and break on 4–6; a word scoped to briefs would cover 4 alone. `withdraw` covers every row and
excludes `delete`, which is the neighbour it must exclude.

## ✅ .the boundary — SETTLED 2026-08-31, by the word this section had already named

`rule.require.boundary-qualified-terms` asks *"withdraw, of WHAT?"* — and the enumeration above
answers three ways: a dream, a brief, a fulcrum.

two candidates were weighed:

| candidate | the case for | the case against | verdict |
|---|---|---|---|
| `dream.` | the lifecycle it extends (`caught` → `dispatched` → `withdrawn`) is declared on `term=artifact.dream` | rows 4–6 are no dreams, so the boundary would exclude half its own instances | 🔴 too narrow |
| `artifact.` | it covers every row | it was not a declared term, so the chain reached no root | ✅ **taken — the term was paved** |

⇒ **the gap was recorded first, and closed second.** an earlier pass left this cluster flat per the
boundary rule's own carve-out — *"an unnameable boundary cannot be carried, and a guessed one is
worse"* — and named `artifact` as the settlement owed. `term=artifact` was then paved on the same
day, so the chain now reads `artifact.withdraw` → `repo`.

🟡 **and it settled `dream` in the same move.** `term=artifact.dream` carried the identical gap,
which is what made `artifact` worth a term rather than a guess: **two clusters blocked on one
absent ancestor** (`term=artifact._.choice.reason.md`, `.why it was paved`).

## 🔴 .a withdrawal sweeps the POINTERS too — measured, 2026-08-31

- the three dream rows above were withdrawn correctly — each body removed, each refutation recorded
  here and in `S19`
- and each left a broken symlink at `$route/dreams/` — a pointer to a file that no longer
  exists, discovered a day later by a `file` walk
- ⇒ the asymmetry is in the extant rules and it is easy to miss
  - `rule.always.catch-dreams-for-followups` mandates the route symlink at catch time and says
    naught about the withdraw
  - so the catch has a stated obligation and its inverse has none, which is exactly the shape a
    residue accretes in

**what a broken pointer costs, over a clean absence:**

| the state | what a reader concludes |
|---|---|
| no symlink | the round deferred no such item |
| a symlink to a live dream | the round deferred it, and here is the record |
| 🔴 a symlink to naught | the round deferred it, and the record was lost — which is a false report of a defect in the archive |

🟡 it is legible only to a tool:

- a directory read renders a broken link identically to a live one
- only `file`, or an open that fails, tells them apart
- ⇒ so it survives every review that reads the tree over walks it

⇒ **the rule: a withdrawal removes the artifact AND every pointer that named it.** the durable
record is the refutation, never the husk of the link.

## .evidence

- **discovery**: the enumeration above — six instances across three artifact kinds, all within one
  round (2026-08-31), all with the same shape: a published claim whose premise did not hold
- **the distinction that earns the word**: `withdraw` ≠ `delete`. every one of the six left a
  durable record (`S19`, `F27`, the `status` flips on F18/F25), and that record is the deliverable
- **the wisher's word was tested and rejected**: *"so we undo this?"* — `undo` names a return to
  the prior state; the domain needs the opposite

## .invariants

- a withdrawal with **no durable record** of the claim and its refutation = a deletion, not a
  withdrawal
- a `status` field that reads `withdrawn` with no authority cited = unfalsifiable; the reader
  cannot tell a refutation from a change of mind
- a withdrawn artifact that leaves a **live pointer** behind — a route symlink, a `.see also` line,
  a citation — = a half-withdrawal; the pointer reports an artifact the record says was refuted
