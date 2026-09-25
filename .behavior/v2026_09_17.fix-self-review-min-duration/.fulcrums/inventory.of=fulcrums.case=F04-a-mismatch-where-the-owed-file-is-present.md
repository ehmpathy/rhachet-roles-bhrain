# fulcrum F04 — a mismatch where the owed file is present

**rework** clean · **status** OPEN · **confidence** 70% · **where** cell `c6`, the verdict order

## .the fork, stated fairly

the driver wrote a real, fresh articulation **at the owed path**, and then named a different path in
`--into` — a flag typo over correct work.

| | **refuse** | **allow, and warn** |
|---|---|---|
| the gate's substance | met — the file is there, fresh | met |
| the driver's claim | false | false, and unremarked |
| cost | one command, and the owed path is taught | naught |
| the rule | one rule, no exception | *"a mismatch refuses, unless the owed file happens to exist"* |

## .taken, and why at the time

**refuse**, at 70%.

a mismatch refuses **always**, with no exception for a lucky filesystem. the exception costs one
sentence to state and a branch to hold, and a driver cannot predict a gate whose rule has a clause
about coincidence.

⚠️ **the counter is strong and is why this is a fulcrum:** the driver did the work correctly, and a
refusal over a typo is precisely the flavor of friction `S04` says to eliminate. *"you did it right,
now run it again"* is a bad sentence for a gate to say.

⇒ the mitigation, and the reason the drive still leans refuse: the message can carry the whole
answer — *"your file is at the owed path; re-run with `--into <that path>`"* — which makes the
refusal a one-keystroke correction that **teaches the path**, rather than a dead end.

## .the rework

**clean.** it is a verdict-order call in one operation. to swap it moves `c6` alone; no other cell
and no artifact shape changes.

## 🌙 .it WAS dominated by `F03` — and `F03` ruled the other way

the note here read *"if `F03` settles on **optional**, this cell shrinks to the driver who volunteers
a wrong flag over correct work — rare enough that the choice barely matters. rule `F03` first."*

🔴 **`S15` ruled `--into` REQUIRED, so the domination inverted into a PROMOTION.** under *optional*
the cell arose only from the careful driver who volunteered a flag and mistyped it; under *required*
it arises from **anyone who mistypes**, on every promise. ⇒ this fulcrum now carries more load than
when it was raised, not less.

## 🔴 .the shipped code already answers it — and now a test SHOWS the answer

found by a peer lane at i013: `getSelfReviewChallengeDecision.ts:128` compares the declared path
against the owed path **above** the existence stat, so the shipped behavior is **refuse, always** —
the drive's 70% guess, enacted in code while the fulcrum reads `OPEN`.

⚠️ **that is not the defect.** a drive must ship some behavior while a fulcrum is open, and the guess
is what it ships. **the defect was that no test constructed the scenario**: every extant mismatch
case left BOTH paths empty, so the suite could not tell *"refuse, always"* apart from *"refuse,
because no file was found either way"*.

⇒ closed by `getSelfReviewChallengeDecision.test.ts [case3][t2]` — a real, fresh articulation at the
owed path plus a mistyped `--into`. it **pins the verdict without a settlement of the fulcrum**: a
council that rules the other way reddens exactly three assertions in one case, and the diff that
follows is visible rather than silent.

🔴 **and the bite check corrected the clamp's own claim.** the case was named *"the path gate refuses
first"*, which asserts gate ORDER; with the mismatch check moved below the existence stat it stayed
**green**, because a present owed file passes the stat and the mismatch verdict is reached anyway.
⇒ what it pins is the **verdict**, never the order. renamed accordingly, and the episode is recorded
in the case's own docblock: *a clamp can name the right subject and pin a different property than its
prose claims.*

## ⚠️ .the message hazard, named and NOT repaired

`formatWrongPath.ts:30-35` renders `rhx mvsafe --from <declared> --into <owed>` whenever `declared`
is non-empty — it never checks that a file sits at `declared`. in **this** cell the file is at
`owed`, so the move command would fail if run.

🟡 the hedge saves it from a flat lie: it reads *"**if** the file is where you named it, move it"*.

🔴 **the repair is the council's, not the drive's.** to change the message to *"your file is already
at the owed path — re-run with the corrected `--into`"* would **settle this fulcrum by side effect**:
the message would then describe a behavior, and that behavior is the very question under decision
(`rule.always.raise-a-blocker-a-taken-cannot-close`, the fulcrum-council case). ⇒ so the hazard is
named here and handed up, and the coverage is added around the extant behavior rather than over it.

## .the verdict

_unruled — and now **pinned**, so a verdict is cast on what the driver actually sees._
