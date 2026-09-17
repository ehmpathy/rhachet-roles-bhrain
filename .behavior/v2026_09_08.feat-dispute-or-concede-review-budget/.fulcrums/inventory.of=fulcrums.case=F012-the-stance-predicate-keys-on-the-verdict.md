# F12 · the stance predicate keys on the VERDICT, never on the raw blocker count

- **rework** = clean · **status** = best-guessed · **confidence** = **74%**
- **raised** at `review.self r1` (`has-grounded-in-reality`), never at the walk

## .the fork

a stance is owed when a lane is in a bad state. **which predicate says so?**

| | the option | what it means |
|---|---|---|
| **A** | `verdict = rejected` | reuse `computeReviewPeerVerdict`, which honors the guard's `allow-blockers` |
| **B** | `blockers > 0` | copy the contemplation gate's predicate exactly, thresholds and all ignored |

the walk assumed the two were **one option**. they are not, and the verify pass proved it:

| operation | predicate | thresholds? |
|---|---|---|
| `getAllRouteGuardReviewPeersUncontemplated.ts:31` | `blockers > 0` | 🔴 **none — takes no threshold input at all** |
| `computeReviewPeerVerdict.ts:65` | `blockers <= allowBlockers` | yes |
| `getReviewedJudgeThresholds.ts:18` | parses `allow-blockers` from the guard | — |

`getReviewedJudgeThresholds.test.ts` pins **2, 3, 5**, so a raised threshold is supported rather than
hypothetical.

## .taken, and why at the time

**A — key on the verdict.**

at `allow-blockers 3`, a lane with 2 blockers is **`approved`** and still trips `blockers > 0`.
under B, that lane owes a stance: **the driver is asked to dispute a reviewer that approved it.**
there is no sensible `--why` for that, and the halt would be unanswerable.

three arguments carried it:

1. **one source of truth.** `computeReviewPeerVerdict` already exists to answer *"is this lane in a
   bad state?"*. B duplicates that judgment with a second, thinner rule that silently disagrees
2. **the new gate is the one with a choice.** the contemplation gate's predicate is extant and load
   sits on it; a new gate that copies a known-divergent rule inherits a defect on purpose
3. ~~**it costs naught today.** at the default `allow-blockers 0` the two agree exactly, so **no cell
   in the 120-cell walk moves** — the change is free at every guard on this route~~

### 🔴 argument 3 is FALSE, and `review.self r4` measured it

it was written from the **blocker** axis alone. `computeReviewPeerVerdict.ts:64-65` has **two**:

```ts
input.blockers <= allowBlockers && nitpicks <= allowNitpicks
```

and this route's own guard sets `--allow-blockers 0 --allow-nitpicks 7` (`1.vision.guard:13`). ⇒ an
**8-nitpick, 0-blocker** lane is `rejected` by the verdict and **clean** by `blockers > 0`.

| the claim | the truth |
|---|---|
| *"the two agree exactly"* | they agree on **one of two axes**. the debt predicate has no nitpick axis at all |
| *"free at every guard on this route"* | 🔴 **this route's own vision guard is where they diverge** |

⚠️ **and the divergence lands where the design cannot absorb it:** a nitpick-only lane owes no
`.taken`, so it is never `unanswered`, so invariant 2 never fires — it would be asked for a stance
**with no prior answer**.

⇒ **A still stands as the call** — argument 1 (one source of truth) and argument 2 (the new gate is
the one with a choice) are untouched, and B fails for its own separate reason. **what falls is the
claim that A is free.** it is not: it inherits a second axis, and that axis is now `F15`, left
**open** for the council rather than guessed.

🟡 **the lesson this row carries forward:** *"it costs naught"* was an arithmetic claim about a
predicate I had cited and never opened. it was checkable at any point in four rounds.

### ✅ argument 3 is RESTORED by `S06` — 2026-09-10, and it is stronger than it was filed

the wisher ruled `F015` to its wide fork: **a stance is owed by whatever the JUDGE COUNTS**, and the
judge counts both axes. ⇒ **the 8-nitpick lane owes a stance, exactly as a blocker-driven one does.**

| the claim, re-graded | |
|---|---|
| *"the two agree exactly"* | 🔴 still **false**, and still worth the strike above — the arithmetic was wrong |
| *"no cell in the walk moves"* | ✅ **true**, and now for a better reason: A's predicate is the ONLY predicate |
| *"the change is free"* | ✅ **true.** it was **B** that would have cost — it needs a second clause A does not |

⇒ **the two axes were never a cost A inherited; they were a cost B would have paid.** A reads
`computeReviewPeerVerdict` and gets both axes for free. B reads `blockers > 0`, gets one, and then
owes a bolt-on for the other — which is the second predicate this row's argument 1 exists to refuse.

⚠️ **and the divergence §*the design cannot absorb it* describes was an artifact of `F015`'s narrow
fork, never of A.** under the wide fork the lane sits at `answered` with no debt owed, invariant 2
passes trivially, and there is naught to absorb. ⇒ **a gate that catches naught is not a defeated
gate** — see `F015`.

🔴 **so the row's own lesson has a second half, and it is the sharper one.** *"it costs naught"* was
struck for an unopened premise, and the strike was right. **but the repair went one step too far** —
it took a wrong arithmetic as evidence that the CALL had a cost, when the arithmetic pointed at the
**other** fork. ⇒ **a falsified argument does not transfer its falsity to the conclusion it
supported**, and a re-scoring that assumes it does will re-price a right call as an expensive one.

## .the case against, stated fairly

**B is not silly, and one clause of it is strong:** the two gates then read *differently* for the
same lane, and a driver who learns `blockers > 0` from the contemplation halt meets a stance gate
that answers otherwise. **one predicate, two spellings, is its own hazard** — and this vision's own
mental model leans on *"the stance gate reuses the contemplation gate's reach"*, a sentence A makes
slightly false.

⇒ put honestly: **A fixes the arithmetic and frays the story; B keeps the story and ships a
known-wrong edge.** A wins because the frayed story is repairable prose and the wrong edge is not.

## .rework — clean, and why

one predicate, at one call site, in an operation this behavior introduces. no caller depends on it
yet, no artifact is keyed to it, and the 120-cell walk is unchanged (the two agree at the default).
⇒ a reversal is an edit to one expression plus three prose notes.

## .confidence — 74%, and why it is low

- 🔴 **the real fix may belong to the extant gate, not to mine.** if `getAllRouteGuardReviewPeersUncontemplated`
  should *also* key on the verdict, then A is a patch at the wrong altitude and the two predicates
  should converge instead — one change, both gates. **that is a live question I do not own**
- the divergence is only observable at `allow-blockers > 0`, which **no guard on this route sets**.
  ⇒ zero measured evidence; the case rests on a supported configuration, never an observed one
- `allow-blockers` semantics at the **peer** grain were not traced end to end — the thresholds are
  parsed from the `reviewed?` judge line, and whether a per-peer override exists was not checked

## .where

`1.vision.yield.md` § *the four invariants* (1) · `1.vision.experience.dimensions.md` § *the stance
gate's predicate* · `1.vision.experience.case=_.md` § *provably complete* ·
`review/self/for.1.vision._.r1.has-grounded-in-reality.md` § *issue 3*

## .the verdict

*not yet ruled — for the end-of-route council.*

⚠️ **the question for the wisher is narrower than the fork:** *should the extant contemplation gate
key on the verdict too?* a **yes** makes this a two-line convergence and raises confidence to ~90%. a
**no** leaves two predicates on purpose, and the prose must say why.

## .see also

`F01` — the stance is per-reviewer, which is what makes a per-lane predicate the right grain ·
`.dream/` at 5.1 — the extant gate's own divergence, caught rather than fixed here
