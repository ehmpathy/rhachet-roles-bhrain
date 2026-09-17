# F19 · what does the stance halt print about the tally — the residual total, or the per-lane contribution?

- **rework** = clean · **confidence** = 🔴 **68%** · **status** = 🔴 **STRUCK by `S07`**, same day
- **raised 2026-09-10**, on the round that landed `S06` — and **first filed as "not a fulcrum"**,
  which is the part of this row worth the council's attention

## 🔴 .struck — the fork closed under a grain change, over a verdict

`S07` re-grained the exclusion from **file** to **concern**: a dispute now sheds exactly **one**
blocker or **one** nitpick.

⇒ **the search this row was built around cannot be performed.** its whole argument was that a driver
would hunt for the *minimum set of lanes* to dispute, since a lane-grain exclusion made each dispute
worth an unknown and possibly large number of concerns. under per-concern arithmetic every dispute is
worth exactly 1, so **there is no set to minimize** — the residual total is a subtraction the driver
can do in their head, and fork B's per-lane table answers a question nobody now has.

⚠️ **the halt still owes an arithmetic line, and it is no longer a fork.** it prints the residual
total against the threshold, because that is now the only quantity a driver cannot derive at a
glance. ⇒ what was fork A is the answer, and it arrived by a mechanism change rather than by a
verdict.

🟡 **the board has no status for this, and it should.** *settled*, *retired*, and *moot* each name a
different end; this row ended because **the ground under it moved**. filed as `struck`, and the
distinction is worth a column if a second one ever occurs.

⇒ **and the tell in `.the tell` below survives the strike intact.** the row was wrongly filed as
*"not a fulcrum"*, and that failure is about how the call was **classified**, never about which fork
was right — so it is untouched by a grain change and stays on the record.

---

_(what follows is the row as it stood before the strike, kept whole so the argument is checkable)_

## .the fork

`S06` settles that a dispute is a **tally exclusion**. `computeReviewTotalsFromFiles.ts:6-7` sums
**across** review files, so the exclusion subtracts from one stone-wide total.

⇒ **a dispute lifts the hold only if what is left clears the threshold**, and the driver cannot see
the arithmetic. so the halt owes a line. **which one?**

| fork | the halt prints | the driver can then |
|---|---|---|
| **A** | the **residual total** vs the threshold — *"8 nitpicks left, 7 allowed"* | tell **whether** another dispute is needed |
| **B** | the **per-lane contribution** — *"experience-coverage 5 · counter 3 · allowed 7"* | tell **which** lane to dispute, and whether any single one suffices |
| **C** | naught beyond today's verdict reason | re-run and infer |

## .taken, and why — B, at 68%

**A is not enough, and that is the whole reason this row exists.** a residual total answers *"am I
done?"* and leaves *"what do I do next?"* to trial and error — the driver disputes a lane, re-arrives,
reads a new total, repeats. ⇒ **that is a search, and the engine already holds the answer.**

`rule.require.errors-name-the-fix` grades it: *"an error must name the FIX, not just the symptom …
the concrete next move."* a residual total is a symptom. **the per-lane breakdown is the fix**, and
`formatGuardReviewLadderFooter` already renders per-lane counts — so B costs a render, over a
computation.

⚠️ **and B subsumes A** — a reader who wants the total sums the column, or the render prints both.

## .rework, and why — clean

it is a halt formatter's output. no ledger field, no predicate, no contract flag. **a reversal is one
render change**, and no caller is hardened against it.

## 🔴 .confidence, and why it is low — 68%

three reasons, and the third is the one I would want overruled on:

1. **the halt is already three questions deep** (`.what is awkward` 6), and B adds a table to it.
   `rule.prefer.defaults-match-common-case` says the common path should stay short — and the common
   path is **one** rejected lane, where a per-lane table is a one-row table and pure noise
2. **I did not weigh a fourth fork:** print B **only when more than one lane carries counts**. that
   is likely the right answer, and it is a conditional render this vision has not otherwise needed
3. 🔴 **the driver is the party this call favours.** a per-lane breakdown makes it cheap to find the
   *minimum* set of lanes to dispute — a search for the least review one can take seriously.
   ⚠️ **A is the fork that makes that search cost a round**, and I chose against it

## 🔴 .the tell — I filed this as "not a fulcrum" first

the yield's contract section and `.what is awkward` 4b both stated the case and then said:

> *"it is not a new fulcrum — no fork is open; it is a requirement the tally-exclusion mechanism
> implies and the extant halt does not carry."*

**that sentence is false, and it was written by the party who did not want to add a row at the end of
a long round.** a fork was open — three of them — and *"the mechanism implies it"* named only the
**that**, never the **which**.

⇒ `rule.always.itemize-the-fulcrums-you-best-guess`: *"if you would not defend the call at 93%, it
earns a fulcrum, **even where you weighed no alternative**."* ⚠️ **the rule anticipates exactly this
failure — a call that feels like a consequence rather than a choice** — and I cited that rule on this
route, and still filed the call as a consequence.

🟡 **the cue that should have fired: I could write a table of alternatives.** a requirement a
mechanism truly implies has one form; if the alternatives tabulate, it is a fork.

## .where

the stance halt's emit — `case=10` § *the narrative*, and the formatter a stance halt models,
`formatRouteGuardReviewPeerContemplatePrompt.ts`.

## .what would settle it

**one question to the wisher:** *is the halt's job to say whether the driver is done, or to say which
lane to dispute next?* ⇒ A answers the first, B the second.

🟡 **and one measurement would inform it:** how many stones in this repo's route history carried
**two or more** rejected lanes at once? if the answer is *"almost none"*, fork 4 is right and the
argument above is over-built.

## .the verdict once ruled

_(open)_
