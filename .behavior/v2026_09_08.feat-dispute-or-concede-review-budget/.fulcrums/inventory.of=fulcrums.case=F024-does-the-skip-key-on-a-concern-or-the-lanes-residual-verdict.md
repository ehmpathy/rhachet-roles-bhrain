# F24 · does the design key on a lane's RESIDUAL VERDICT, or on its CONCERN LEDGER?

*two joints, one choice: the per-generation skip, and the stance gate's exit condition.*

- **rework** = 🟡 **clean** · **confidence** = ✅ **settled** (was 70%) · **status** =
  ✅ **WITHDRAWN — derivable, never a fork**
- **raised 2026-09-13**, by the sweep that put `--about` through the demos
- ✅ **withdrawn the same day**, on the wisher's challenge: *"arent you able to answer this
  yourself?"* — **yes.** both joints follow from extant verdicts, and the row should never have
  been filed. the argument is kept whole below, because a withdrawn row and an unexamined one
  read alike once the verdict is on the page

## ✅ .the answer, derived — B at BOTH joints

**joint 1, the skip.** `F012`/`S06` ruled the predicate keys on the **verdict**, and the vision's
own contract table already states the consequence: *"the hold lifts **iff what remains clears the
threshold**."* ⇒ the skip is not a second mechanism — **a lane whose residual verdict is `approved`
does not gate, so it has no reason to run.** the concern ledger never enters it.

⇒ and *"skipped for ONE artifact generation, then live again"* falls out rather than being
declared: the artifact moves → a new given lands → the ordinals renumber (`F020` fork A) → the
stance lapses (`S08`) → the lane speaks again.

**joint 2, the gate's exit — and here the ROW was simply wrong.** it claimed a hole: at 8 nitpicks
and an allowance of 7, one dispute clears the tally and seven concerns go undeclared.

| what the row called it | ✅ what it is |
|---|---|
| 🔴 *"the gate suppresses seven concerns by no longer asking"* | **the threshold TOLERATED them, and that is what a threshold MEANS.** `--allow-nitpicks 7` is the guard's own statement that seven nitpicks may ship |
| *"the same defect as `case=11`, at a different joint"* | 🔴 **not the same defect.** `case=11` sheds concerns from the **tally** — including three the driver CONCEDED. here the seven stay **counted**, and are found within tolerance |
| *"the incentive runs backwards"* | ⚠️ **a residual, not a hazard.** the driver picks WHICH concern to dispute — and must author a fulcrum entry for it, which the council reads. a recorded, argued act is not a free one |

⇒ **`R2` already rules this**: a lane whose verdict holds the road owes no stance. an `approved`
lane is that lane. **the gate stops asking because there is nothing left to ask about.**

## 🔴 .the lesson — why this row was filed at all

**I read a threshold doing its job as a gate that gave up.** the tell was on the page: my own
contract table said *"lifts iff what remains clears the threshold"*, which IS fork B, stated as
settled, two hundred lines above the row that called it open.

⇒ **a fulcrum is owed for a FORK, never for a consequence I have not yet worked out.** the test
that would have caught it: *before the row is filed, does an extant verdict already decide it?*
`F012`, `S06`, `S08`, `F020`, and `R2` each decided a piece, and together they decide all of it.

⚠️ **and the cost was not zero.** the row halted execution and put a question to the wisher that
their own prior rulings had answered — which is exactly what the `S11` archive warns of: *"a
question derived from a misread is worse than no question — it reads as diligence, spends the
wisher's attention, and cannot be answered as put."*

---

*the original argument, kept for the record:*

## .the fork

`F04` rules that a disputed lane goes quiet for one artifact generation. **it was argued under the
per-LANE grain**, where *"the lane is disputed"* was a complete state. `S07` made a stance target one
**concern**, so at two concerns the phrase no longer picks out a state.

| fork | the skip fires when | at 1 disputed of 2 concerns |
|---|---|---|
| **A** | **ANY** concern on the lane is disputed | 🔴 the undisputed concern goes unheard for a generation |
| **B** | the lane's **residual** tally clears its threshold | ✅ the lane goes quiet exactly when it no longer holds the road |

## .taken, and why — B, at 70%

**`S06` already made the mechanism a tally exclusion**, and a skip is downstream of the question that
tally answers: *does this lane still reject?* under B the skip is not a new predicate at all — it is
`computeReviewPeerVerdict` read after the exclusions, the same call the stance gate makes.

⇒ **A would let a driver mute a live point by a quarrel with its neighbour**, the exact defect
`case=11` exists to refuse — one declaration that suppresses concerns it never named
(`rule.forbid.suppression-of-undeclared-concerns`).

## .rework, and why — CLEAN

the skip predicate is one boolean at one call site, and no state is stored under it. **B reads a
verdict the engine already computes**, so a reversal is an edit to a condition rather than a re-key
of durable records. ⇒ unlike `F020`, no data persists under this choice.

## .confidence, and why it is 70%

1. ✅ **B is the only fork coherent with `S06`.** that is the strongest argument and it is why this
   row is not lower
2. 🔴 **`F04`'s 55% was priced against fork A's semantics**, and nobody has re-argued it under B.
   under B a partially-disputed lane **still runs**, so the per-stone blindness `F04` worries about
   is materially **smaller** than its row claims — ⇒ **`F04`'s own confidence is stale**, and this
   row's resolution should move it
3. ⚠️ **the acceptance criterion is measured on this.** #2 reads *"the disagreement consumes no
   budget"* — under B a lane with one disputed and one live concern **does** consume a round, so the
   criterion holds per-concern and not per-lane. **that reading is unstated anywhere**
4. 🟡 **I did not weigh a third fork:** the lane runs, and the reviewer is *told* which concerns are
   disputed so it may decline to re-raise them. that needs a `contract.reviewer-output` change and is
   out of this vision's mandate — noted so a later route finds it named

## 🔴 .the same fork at a second joint — the STANCE GATE's exit condition

the sweep found this fork twice, and the second instance is sharper because it costs a record rather
than a round.

**`case=10` `[t1]`:** a lane at 8 nitpicks under an allowance of 7. **one** dispute takes the total
to 7, the verdict flips to `approved`, and **the stance gate stops asking** — so seven concerns are
never declared, never repaired, and never reach the council.

| the gate asks for a stance while… | at 8 nitpicks / allow 7 |
|---|---|
| **A′** the lane's residual verdict still rejects | 🔴 **one** dispute silences the other seven |
| **B′** any concern on the lane is undeclared | ✅ all eight are answered, and the tally decides the stone separately |

⚠️ **the incentive under A′ runs backwards**: a lane 1 over its allowance needs exactly one dispute
to mute the rest; a lane 5 over needs five. **the closer a lane sits to passable, the less of it a
driver must answer.**

🟡 **`rule.forbid.suppression-of-undeclared-concerns` does not reach this.** its test is *"does this
declaration discharge a concern it did not name?"* and no declaration here does — **the gate does, by
no longer asking.** the rule grades declarations; this grades an exit condition.

⇒ **A/A′ and B/B′ are the same choice at two joints**, and they should be ruled together: does the
design key on a lane's **residual verdict**, or on its **concern ledger**?

## .where

`1.vision.experience.case=4` § *the question this case's `given` had to DODGE* — the demo pins the
lane to one concern precisely so this fork need not be answered to read it ·
`1.vision.experience.case=10` § *the hole `[t1]` opens under the per-concern grain* — the second
joint · `1.vision.yield.md` § *the contract* — the acceptance row that inherits the answer

## .what would settle it

**two questions to the wisher, and they are one choice:**

1. *if a driver disputes one of a reviewer's two blockers, should that reviewer run next round?*
   - **yes** → B. the skip follows the verdict, and acceptance #2 is a per-concern claim
   - **no** → A. the skip follows the lane, and a driver must dispute every concern or none
2. *at 8 nitpicks and an allowance of 7, may one dispute pass the stone with seven concerns
   undeclared?*
   - **yes** → A′. the gate follows the tally, and the boundary incentive is accepted as a cost
   - **no** → B′. every concern owes a stance, and the tally decides the stone separately

🟡 **my guess is B/B′ at 70%**, and the two should be ruled together — a split verdict would leave
the skip keyed one way and the gate the other.

🔴 **owed BEFORE 2.1.criteria.** the criteria stone writes the tests that measure acceptance #1 and
#2, and each fork demands a different test.
