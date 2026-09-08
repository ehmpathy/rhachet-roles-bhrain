# fulcrum F8 — a removed reviewer's unanswered debt still gates

- **rework** = clean
- **status** = best-guessed, open for the wisher
- **confidence** = 🔴 **85%** — was 78%; its stated doubt (*"no measure of the frequency"*) was
  measured 2026-09-07 and came back **in the call's favour**: zero removals in 29 iterations
- **where** = `getAllRouteGuardReviewPeerGivens.ts` · `getOverruledReviewerSlugs.ts`
- **found** = review.self r1 `has-pruned-backcompat`, 2026-09-04

## .the fork

a reviewer slug is deleted from a stone's guard config while one of its givens still holds an
unanswered blocker. its `.given` files remain on disk.

| | before this change | after |
|---|---|---|
| the given is read | only at the current hash, so the next edit dropped it | at **every** hash, latest per slug |
| so the debt | self-cleared on the next hash move | **persists** |

**and only ONE way out is left open for it:**

| path | works for a removed reviewer? |
|---|---|
| 1. the driver answers with a `.taken` | ✅ **yes** |
| 2. a human overrules the level | ❌ **no** — `getOverruledReviewerSlugs` derives from `peerReviews`, the guard config. a slug absent from that config can never enter the overruled set |

⚠️ **this table listed a third row — *"the reviewer speaks again, clean"* — and it is struck.** not
because it fails for a removed reviewer, but because it is **not a discharge path for any reviewer**:
the entrance gate is stone-level and returns before any reviewer runs, so a reviewer speaks again
only after path 1 or 2 already unlocked the round (caught by the wisher, 2026-09-07; see F3).

⇒ **the correction sharpens this fulcrum rather than softens it.** a removed reviewer was down to one
of three; it is now the only case on this route where **one of the two** general paths is shut.

## .what I took, and why at the time

**left as-is, flagged.** the stone is **not** deadlocked: path 1 works, and the entrance-gate prompt
prints the exact `.taken` path to write, derived from the given. so the driver is told precisely what
to do and can always do it.

## .the fork I rejected, and why it is worse

filter the givens to slugs still present in the guard config.

🔴 **that would open a new cheap exit** — delete a reviewer from the guard, and its blocker
evaporates. that is the same class of exit this whole behavior exists to close, and it would be
strictly easier than the edit-and-re-roll the wish set out to shut. **a fix that reintroduces the
defect in a new coat is not a fix.**

## .confidence — 🔴 **85%** — was 78%

⚠️ 🔴 **this title read `## .why the confidence is 78%` until 2026-09-08, twenty-two lines above its
own `78% → 85%`.** the header field at the top of this file already said 85%, and so did the fulcrum
summary — **so the re-score reached two homes and left a third inside the very section that records
it.** ⇒ this is the F7 defect (a section title stale after a body re-score) a second time, and the
ninth sweep missed it because that sweep checked **header fields and summary rows**, never `##`
titles. **a title is where a reader's eye lands and where a grep for `confidence` stops.**

- ✅ **certain** the mechanism is real — read from source, both files, this round
- ✅ **certain** it is not a deadlock — path 1 is open and the prompt names the file
- ⚠️ **uncertain** how often a reviewer is removed mid-stone with a live blocker. I have no measure
  of that, and the whole weight of the call rests on its rarity

  🔴 **measured 2026-09-07, and it supports the call.** the `rNNN` segment of a peer artifact **is**
  the guard-list position (`runStoneGuardReviews.ts:346-348`), so the index→slug mapping across a
  stone's artifacts is a direct record of roster churn. read across the full i001→i029 span of this
  stone, for every slot whose files could be enumerated:

  | index | slug, i001 → i029 | changed? |
  |---|---|---|
  | r001 | `repo-rules` | ❌ stable |
  | r003 | `mech-external-contracts` | ❌ stable |
  | r005 | `behavior-experience-coverage` | ❌ stable |
  | r007 | `mech-given-when-then` | ❌ stable |
  | r008 | `mech-test-intent` | ❌ stable |
  | r009 | `mech-test-scope-purity` | ❌ stable |

  ⇒ **zero removals in 29 iterations.** the rarity this call rests on is no longer asserted; it is
  measured on the one stone where it could be. **78% → 85%.**

  ⚠️ **the measure is n=1 stone and it cannot see a removal-plus-reinsert** that restored the same
  mapping. it also speaks to no other repo. so it narrows the doubt rather than closing it.

  🔴 **and the same measurement cuts the OTHER way for F9 — which is worth the wisher's attention when
  the two are read together.** the roster did change exactly once: an **insert** at index 9, after
  i029. so on this stone, over 29 rounds:

  | churn kind | count | which fulcrum it feeds |
  |---|---|---|
  | **removal** (F8's premise) | **0** | ⇒ F8's rarity holds |
  | **insert** (what arms F9) | **1** | ⇒ F9's harm is not hypothetical |

  ⇒ **one fact, opposite directions.** F8 asks the wisher to accept a rare case; F9 asks about a case
  that already happened here. **a low churn rate is an argument for F8 and no comfort at all for F9**,
  because F9 needs the churn to happen *once*, and it has.
- ⚠️ **uncertain** whether a driver who reads *"reviewer `foo` awaits your reply"* for a reviewer
  that no longer exists will find that intelligible or infuriating. it is an ergonomics question I
  am not the right role to settle

## .what the wisher may want instead

1. **accept it** — rare, self-serviceable, and the safe direction to err
2. **let the overrule reach it** — key `getOverruledReviewerSlugs` off the given's own recorded level
   rather than the live config, so path 2 opens. keeps the exit human-gated, so no cheap exit appears
3. **make the prompt say so** — detect that a slug is absent from the guard and add one line: *"this
   reviewer is no longer configured; answer it once and it clears for good"*

⇒ **(2) is the one I would pick if this is judged worth a change.** it opens the human valve without
a driver-cheap exit, which is the property that matters.

## .the verdict

_awaiting the wisher._
