# S07 · one fulcrum backs N disputes, one CONCERN each

- **kind** = 🔴 **a correction** · **said 2026-09-10**
- **what it settled** — the unit a stance targets is a **concern**, never a lane. one fulcrum is
  reusable across N disputes; each dispute sheds exactly one concern

## .said — verbatim

> *"ah, so should we allow each fulcrum to count for up to 1 blocker or 1 nitpick only?"*

> *"that way if they have 1 dispute but 3 concessions, the concessions still flag?"*

> *"yep, if its one fulcrum, they can register the same fulcrum as a dispute against 8 concerns"*

> *"so, we should track a review.feedback.given.concern as its own domain.term and — although we
> don't require the reviewers to give an id to each concern today — the driver doesn't need to know
> that nor care, they can just say `--about 'blocker.3' of 'reviewer.X'` to say 'account for 1
> blocker from reviewer.x'"*

> *"also, can we do some more boundary experience evaluation to see if there are other defect
> classes where a dispute of one valid option causes the ignore of real concessions? we should add a
> rule to forbid disputed fulcrums from suppression of valid concessions"*

## .settled

1. 🔴 **the atom is a `concern`** — one blocker, or one nitpick. the design had no word for it, and
   every grain it did have (lane · level · given · stone) sits **above** it
2. 🔴 **a dispute targets exactly ONE concern.** it sheds 1 from the tally, never a file
3. **a fulcrum is reusable across N disputes** — one entry may back a dispute of 8 concerns. the
   cardinality is `1 fulcrum : N disputes`, and `1 dispute : 1 concern`
4. **the driver names the concern by POSITION** — `--about 'blocker.3' --that reviewer.X`. no
   reviewer is asked to mint an id; the ordinal within that reviewer's own report suffices

## 🔴 .what it FIXES — a dispute was suppressing the driver's OWN concessions

`S06` settled the mechanism as a **tally exclusion**, and the extant seam it reused
(`getNonOverruledReviewFiles`) drops a whole **review file**. so on a lane that raised 4 nitpicks
where the driver disputes 1 and concedes 3:

| the grain | what leaves the tally | what the judge then sees |
|---|---|---|
| per-**file** (as `S06` landed) | **all 4** | 🔴 a clean lane. the 3 conceded nitpicks are **invisible** |
| per-**concern** (this seed) | **1** | ✅ 3 nitpicks, still counted, still holds the stone |

⇒ **the driver's own admission of fault was erased by their disagreement with a neighbour.** and it
broke the wisher's stated purpose for a fulcrum — *"the purpose is a guaranteed later review"*
(`S05`) — since a guarantee that covers 1 concern in 4 guarantees naught about the other 3.

🟡 **`S05` had already settled this and the mechanism did not follow it.** its words: *"each fulcrum
is a single dispute … a disagreement is about one point."* the stance was per-POINT on the page and
per-FILE in the code, for two rounds.

## 🔴 .the general law it implies

> **a declaration discharges the concerns it NAMES. concerns it did not name survive it.**

walked over every value `PassageReport.status` accepts, plus the two a stance adds: **nine of twelve
obey it.** the three that do not:

| the move | its grain | why it breaks |
|---|---|---|
| **a `.taken`** (`--as contemplated`) | one **reviewer** | the gate counts REVIEWERS, so one file discharges a slug that carried 6 concerns |
| **a dispute** (per-file) | one **review file** | 1 dispute sheds 4 concerns — the driver's own concessions among them |
| **a concede** (per-lane) | one **review file** | the mirror: it over-claims, and commits the driver to concerns they never read |

⇒ and the two that discharge broadly and are **permitted**, because the party has the authority: a
**human forgive** (the breadth IS the grant) and a **reviewer's fresh given** (the party that raised
it is the party that dropped it).

⇒ the full twelve-row table: `1.vision.experience.case=11`.

## 🔴 .where `S06`'s own metaphor misled

`S06` named a dispute *"the driver's forgive, at lane grain"*, and the analogy is what carried the
per-file exclusion in with it.

⇒ **a forgive is legitimately coarse BECAUSE A HUMAN DECLARES IT.** the breadth is the authority.
copy the grain onto a driver's move and you copy the authority along with the mechanism.

🟡 the check that would have caught it is `S06`'s own — *"what does the downstream operation already
read?"* — asked of the **grain** rather than of the axis: `getNonOverruledReviewFiles` reads a
**file list**, and a concern is not a file.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F019-…` — **struck at the root.** under per-concern every
  fulcrum sheds exactly 1, so the optimization hazard it feared cannot exist
- `domain.terms/term=route.guard.review.concern._.choice._.md` — the term, its cluster
- `rule.forbid.suppression-of-undeclared-concerns` — the law above, as a rule
- `1.vision.yield.md` § the tally exclusion — regrained from file to concern
