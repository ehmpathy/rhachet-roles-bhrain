# F04 · how long does a disputed lane go quiet — the stone, or one generation?

- **rework** = 🔴 **dirty** · **confidence** = 55% · **status** = 🔴 **WISHER-RULED — reversed to fork C, 2026-09-09**
- **filed as** `…case=F004-a-disputed-lane-goes-quiet-for-the-stone.md`, renamed once the call it
  named was reversed — 🟡 **a `case=` slug names the QUESTION, never the verdict.** a slug that
  states a verdict is a second copy of the status field, and the two drift the moment a council rules

🔴 **the taken fork is C: ONE artifact generation, then the lane returns.**

**the sharpest call on this route, and the driver's guess was WRONG.** the body below is the
argument as it stood; the verdict at the foot is what holds. read the verdict first.

## .the fork

acceptance #2 says a dispute *"consumes no budget"*. that phrase carries two senses, and they build
different systems.

| option | *"consumes no budget"* means | what happens on the next round |
|---|---|---|
| **A — the lane goes quiet** | the disputed reviewer is **skipped** for the remainder of the stone | it never runs again, never re-raises, never costs a round |
| **B — the round is free** | the reviewer still runs; its rejection just stops to gate | it re-raises every round, forever, at zero budget cost |
| **C — the dispute lapses on a hash move** | skipped until the artifact changes, then live again | the driver re-declares after each edit |

## .taken, and why

**option A — the lane goes quiet, and the skip survives every later hash move.**

- **B is the flat line the wish exists to end.** a reviewer that re-raises each round produces the
  identical churn issue #458 measured — *"a driver who answers without end"* — and merely stops to
  charge for it. the token cost falls; the driver's attention cost does not.
- **C reads reasonable and re-opens the loop by the back door.** every real drive edits artifacts
  after a dispute, because the other lanes still raise blockers. so a lapse on hash move means the
  dispute must be re-declared on nearly every round, which is option B with extra ceremony.
- **A is the only sense under which the count converges**, and convergence is the outcome the wish
  asks for.

## 🔴 .the cost this buys, stated plainly

**a disputed lane is blind for the rest of the stone.** the driver may afterward edit the very
artifact that lane guards, and break exactly what it was there to catch, and no lane raises it.

⇒ two mitigations ride with the call, and neither is a fix:

1. **the fulcrum records the review hash at declaration.** ⚠️ **and this mitigation is far weaker
   than it reads — corrected at `review.self r4` after the hash was finally read.** see below.
2. **the skip is per-stone, never per-route.** the next stone's guard re-enrolls the reviewer at
   full budget, so blindness has a hard horizon. **this one holds as stated.**

### 🔴 what the review hash actually is, and what it therefore cannot tell a council

`computeStoneReviewInputHash.ts:37-55` hashes **every file the stone's artifact glob matches** —
sorted `relPath:gitBlobHash` entries, shake256, 9 bytes. it is **one hash over a SET**, never a hash
per file.

⇒ and the artifact glob at an execution stone is wide. the prior route's
`5.1.execution.from_vision.guard:8-12` declares:

```yaml
artifacts:
  - "$route/5.1.execution.from_vision.yield.md"
  - "src/**/*"
```

| what two hashes give a council | what mitigation 1 claimed |
|---|---|
| **one bit** — the artifact set changed, or it did not | *"how far the artifact travelled"* |
| at execution, that bit is **~always "changed"** — any `src/**/*` edit flips it | a distance to weigh the dispute against |

🔴 **so the mitigation is close to information-free exactly where the risk is highest.** a driver
who writes one `.taken` for a *different* reviewer moves the hash, and the council cannot part that
from an edit to the disputed seam.

⇒ **the honest reframe: the hash is a NEGATIVE signal, never a positive one.**

- **unchanged** → a real, cheap, provable all-clear. no artifact moved, so the disputed seam did not
- **changed** → *"look"*, with no pointer to **where** — which is what the council would do anyway

⚠️ at a **vision** stone the negative case is common and the signal is worth its keep. at an
**execution** stone it is nearly dead, and execution is where F04's blindness costs most.

### 🟡 the cheap repair, available and not yet taken

`getGitBlobHashes({ files, cwd })` already takes an arbitrary file list — the same primitive the
stone hash is built on. so the fulcrum could record **the blob hash of each file the disputed
`.given` cites**, rather than (or beside) the stone-wide hash.

⇒ then *"which of the cited files moved after the lane went dark"* becomes **derivable** — the read
`case=7`'s council wants, and the one the stone-wide hash sends it to the diff for.

**left as a recorded option rather than folded into the call**, because it widens what the mint
must read — the `.given`'s cited paths — and that is a contract question the council should rule on
rather than one this row should settle. ⇒ it is the concrete answer to triage question **1**, and it
would move F04 up.

⚠️ **this is the same defect class issue #458 §3a names**, reached from the other side: *"the loop,
not the gate, is what currently catches a bad answer."* a dispute removes the loop for that lane.
§3a's own remedy list applies here too — a final-round pass over the takens, or a recorded
acceptance of the trade. **this vision takes the recorded acceptance and flags it.**

## .rework, and why

🔴 **dirty.** the skip is what acceptance #2 buys, so the meter shape, the verdict computation, and
`runStoneGuardReviews`'s skip predicate all bind to it. to reverse to B or C after execution means a
change to **when a reviewer runs** — the highest-blast-radius seam in the guard — plus every `[tn]`
in cases 1, 4, 5 and 8, plus the snapshots behind them.

⇒ **this is the row that earns a wisher verdict before 5.1**, not at the council.

### 🔴 and `review.self r4` named one seam the paragraph above only waved at

*"the meter shape"* was written as a phrase. it is an **operation with a closed type**.
`formatGuardReviewerTree` is the single render source for every reviewer row — the guard tree, both
drive halts, and `review.by` via `hideMeter` — and its `ReviewerTreeState.state` is a union of six
(`:61-87`) with **no member for a lane the driver silenced**. the nearest, `queued`, renders
`awaits arrival`: the precise misread `case=4` exists to prevent.

⇒ so A's bill includes a **seventh union member plus its detail block**, which ripples through
`asReviewerTreeStateFromMeter`, `asReviewByReviewerTreeState`, and a snapshot suite.

**and the same read turned up a second seam.** `case=1` `[t4b]` asks that a top-up aimed at a disputed
lane say so *"rather than a silent no-op"*. the budget emitter `asGuardBudgetUpdateLines`
(`route.ts:1896-1910`) renders from `{ peer, budgetBefore, budgetAfter }` — **no field carries a
stance** — and its producer `processGuardFileBudgets` (`:1916+`) scans the guard **YAML** and never
opens `passage.jsonl`. ⇒ that clause needs a new field **and** a new data source.

⚠️ **neither seam moves the confidence.** both make the `dirty` label concrete rather than larger, and
`dirty` was already the call. what changes is what a wisher is told the reversal costs — and both
bills belong to **A alone**: forks B and C keep the lane live, so neither owes a row nor an emit for a
lane that did not run.

## 🔴 .the cost is no longer an inference — it is MEASURED, on the prior route

the paragraph above cites issue #458's *"the loop, not the gate, is what currently catches a bad
answer."* **that loop has now been observed to catch one, twice**, in
`.behavior/v2026_09_03.fix-contemplation-gate-on-entrance/.fulcrums/`:

| the fulcrum | who reversed it | when |
|---|---|---|
| **F6** — *seven critipaths demoed* | 🔴 a **later self review** (`…r2.has-experience-coverage`) | one round after it was filed |
| **F12** — *the placeholder then-title is left unswept* | 🔴 a **later peer reviewer** (`mech-given-when-then`) | two rounds after it was filed |

that page states the pattern in its own words:

> *"that is now twice — F6 and F12 — that the stated doubt named the exact ground of the later
> reversal. a bare confidence number would have pointed nowhere in either case; the **reason** is what
> let the next round find the call and turn it."*

🔴 **and option A disables exactly that path for any lane a driver disputes.** under A the lane never
runs again on the stone, so **a later round cannot be what reverses the call** — the reviewer that
would have raised it is silent by construction.

⚠️ **the bound, stated so this is not overclaimed:** neither F6 nor F12 arose from a *disputed* lane
— disputes do not exist yet. what is measured is that **a later reviewer reversed a driver's
judgment, twice, on this engine, within two rounds.** whether the driver would have disputed those
particular lanes is unknowable. ⇒ **the mechanism is real and its application here is conditional**,
which is why this lowers the confidence rather than settles the fork.

⇒ **paired with the 28–83% overturn rate** (`1.vision.yield.md` § `.what is awkward` § 7), the
picture is: **judgments get reversed often, and one of the two observed reversal paths is the one
this call closes.**

## .confidence, and why it FELL to 55% — was 65%

low, and honestly so. **the two paragraphs above are the re-score**; the three original reasons
stand beneath them and are unchanged.

⇒ the move is 65% → **55%**, and it is the lowest row on this board. the ground: the call's central
premise — *that a lost lens is an acceptable price* — was priced against an unmeasured reversal rate,
and the rate is now measured at **28% at its most conservative**, with one of the two observed
reversal mechanisms the one A removes.

the three reasons it was already low:

- the wish's phrase *"consumes no budget"* is **four words**, and option A is a whole mechanism. the
  delta between the ask and the output IS the uncertainty (`rule.always.itemize-the-fulcrums…`,
  cue row 3).
- the blindness cost is real, measurable, and paid by a future reader rather than by me.
- 🔴 **i am the party this call favours.** it makes my own drives converge. a driver that grades its
  own escape hatch is exactly the case `rule.always.get-a-second-opinion-before-foreman` exists for.

⇒ **what would settle it:** the wisher answers one question — *"after a dispute, should that
reviewer ever run again on this stone?"*

## 🔴 .and it strains a BOUNDARY clause, which no earlier round said out loud

found at `review.self r5`. the wish's §*the boundary* opens:

> *"**do not remove the peer review.** the reviewer still runs and still renders a verdict; this
> changes what a driver may do in answer to one, never whether one happens."*

**option A skips a disputed lane for the rest of the stone.** ⇒ the reviewer runs and renders the
verdict the stance answers — the clause holds for **that** round — and every **later** round on the
stone does not happen. the clause's last words are *"never whether one happens."*

⚠️ **the tension is inside the wish, before this design touches it.** acceptance #2 says the
disagreement *"consumes no budget"*, which no re-run can satisfy, and the `.why` charges that *"the
fleet pays full review cost for every round."* ⇒ **acceptance #2 and the boundary clause cannot both
be honored literally.**

**the wish settles which governs:** *".what / .why / .acceptance are authoritative; every other line
here is ground, never instruction"* — and §*the boundary* is none of the three. so the acceptance
criterion wins on the wish's own terms, and the clause's **intent** survives: the review mechanism is
not deleted, a lane runs and is read and is answered; what ends is the **re-litigation**.

🔴 **this does not lower the row's stakes — it raises them.** ⇒ **W1 rules on a boundary clause, not
only on a fulcrum**, and the wisher should be told so before they rule. it is stated in the yield's
§*against the wish's four boundary clauses*, and repeated here because a council that reads this
entry alone would otherwise not learn it.

## .where

`1.vision.experience.case=4.the-lane-that-goes-quiet.md` · `1.vision.yield.md` § *what is awkward* ·
§ *against the wish's four boundary clauses*

## 🔴 .the verdict — fork C, ruled 2026-09-09

> gotta be this, cause a reviewer may have many blockers, and only 1 of them could be disputed; then artifact changes, and it might have some other useful blockers detected;
> │ C          │ skipped until the artifact changes, then live again        │ driver re-declares after each edit                 │

and, on the cost it accepts:

> so it'll have to mark --as disputed each time

⇒ **a dispute skips a lane for ONE artifact generation, never for the stone.** the seed is
`.seeds/inventory.of=seeds.case=S03-a-lane-carries-many-blockers-not-one.md`.

### the argument the driver did not have

**a STANCE is declared per lane; a DISAGREEMENT is about one point.** a lane carries many blockers,
so to silence the lane on one disputed point discards every point that lane has not yet raised —
the ones it would find on artifacts that have since changed most of all.

⇒ **fork A collapses lane-grain silence onto point-grain disagreement**, and pays for convergence
with a lens. the entry above priced the lost lens as *"the cost this buys"* and never noticed it
was **avoidable** rather than intrinsic.

### 🔴 why the case against C fails, both halves

> *"every real drive edits artifacts after a dispute … so a lapse on hash move means the dispute
> must be re-declared on nearly every round, which is option B with extra ceremony."*

| the claim | why it fails |
|---|---|
| *"re-declared on nearly every round"* | 🔴 **true, and it is the FEATURE.** a lane that returns often is a lens that returns often. the argument treated a re-run as waste; a re-run over **changed** artifacts is review |
| *"option B with extra ceremony"* | 🔴 **not B.** under B the lane re-raises and cannot be silenced at all. under C it is silenced for the generation it was disputed on, and returns only against artifacts it has **not yet read** |

⇒ the frequency objection also inverts the cost ratio: a re-declare is **one command**; what it
buys back is **one review round of a lens**.

### 🔴 what C makes CHEAPER, which the entry could not have known

**C's skip is the shape the cache skip already has, at the seam it already sits in.**
`runStoneGuardReviews.ts:417-456` looks up `getCacheSafePeerReviewArtifact` **inside the per-lane
loop, keyed by artifact generation**, and `continue`s. C adds a peer condition on that same key.

⇒ **A was the architecturally expensive fork, not C.** A needs a stance lookup that survives every
hash move — unbounded in time, over `passage.jsonl`, filtered by slug. C needs a lookup scoped to
**this** generation, which is how the givens, the cache, and the review artifacts are already keyed.

### what this OVERTURNS elsewhere in the design

| what it said | what now holds |
|---|---|
| invariant 3 — *"a hash-keyed stance would silently implement F04's rejected fork C"* | 🔴 **C is not rejected.** the **debt** still keys to the slug's latest given; the **skip** keys to the generation. two keys, two jobs — the entrance gate stays hash-free, the skip sits where the hash already is |
| the boundary strain — *"the reviewer still runs … never whether one happens"* | ✅ **resolved, literally.** under C the reviewer **does** run again, on the next artifact move. the design's most contested ground is gone |
| the blindness cost — *"blind for the rest of the stone"* | **collapses to one generation.** F04a's blob-hash repair is now a nicety rather than a mitigation for a live hole |
| F13 — *should a `dirty` dispute halt?* | **materially weaker.** it was priced against a stone-long blind window that no longer exists |
| the untested `.taken` (`S02`) | ✅ **closes itself.** the lane returns, reads the answer via `--conversation`, and drops or re-raises. no extra gate clause is owed |

### ✅ the one question C opened, and `F018` answered it the same day

a re-dispute on a later generation is a **new stance against a new given**. does it mint a second
fulcrum row?

this entry best-guessed **findsert on `(stone, reviewer)`** at 75%, and flagged the alternative.
⇒ **the question is MOOT: the command mints no fulcrum at all.** the driver authors the entry and
passes its path, and the wisher ruled that a past argument is reusable —

> *"they can reuse fulcrums from past disputes"*

⇒ so a re-declaration passes **the same path**, and one disagreement holds one entry **because the
driver typed one path**, never because a findsert deduplicated it. the council's read is what this
row wanted and it is obtained without a key.

🟡 **and the signal the alternative would have bought is not lost.** `passage.jsonl` carries one
`disputed` row per declaration, so *"how many generations did this disagreement persist?"* is a count
over the ledger — the durable half — while `.fulcrums/` holds the argument once. ⇒ **the fork was
between two places to record a count, and the ledger already records it.**
