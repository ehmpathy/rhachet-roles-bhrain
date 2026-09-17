# howdoes: a concern travels from reviewer to absorption

**for future travelers.** five words carry the whole review conversation, and a driver who holds
them can read any halt the guard prints. they are easy to confuse, because four of them describe the
same round from different sides.

## .the chain

```
🔍 reviewer  ──raises──▶  📝 given  ──holds N──▶  🔴 concern  ──▶  ┬─ 🗿 absorption  (to the JUDGE)
                                                                  └─ 📜 taken       (to the REVIEWER)
```

| # | the word | who authors it | who reads it | what it is |
|---|---|---|---|---|
| 1 | **reviewer** | the guard runs it | — | one rubric, on one guard, at one level |
| 2 | **given** | the **reviewer** | the driver | one round's verdict, at one artifact hash |
| 3 | 🔴 **concern** | the **reviewer** | the driver | **one blocker, or one nitpick** — the atom |
| 4 | **absorption** | the **driver** | the **judge** | `dispute` or `concede`, on ONE concern |
| 5 | **taken** | the **driver** | the **reviewer** | `[REPAIR]` or `[REFUTE]` — the answer |

## 🔴 .the two the design turns on — an ABSORPTION is not a TAKEN

they are both the driver's, they are both about the same concern, and **they go to different
readers**:

| | the `taken` | the `absorption` |
|---|---|---|
| **audience** | the **reviewer**, next round | the **judge**, this round |
| **what it moves** | whether the reviewer re-raises it | whether the concern counts in the tally |
| **shape** | prose — `[REPAIR]` with a current-file quote, or `[REFUTE]` with cited evidence | a declaration — `--as disputed` or `--as conceded` |
| **gate it clears** | the absorb gate at the entrance (the `.taken`, gated on each concern) | the threshold gate at passage |

⇒ **a driver may owe BOTH on one concern**, and neither stands in for the other. an argument written
only as a `.taken` never reaches the arithmetic; a dispute declared with no `.taken` never reaches
the reviewer, which is why it re-raises next generation.

🟡 **that is not a defect, it is the design** (`S03`): a dispute buys ONE artifact generation, never
the stone. the conversation loop stays the correction mechanism.

## .the cardinalities — memorize these four

```
1 reviewer  :  N givens        (one per round; only the LATEST counts)
1 given     :  N concerns      (the blockers and nitpicks it raised)
1 concern   :  1 absorption    (exactly one — never a lane, never a file)
1 fulcrum   :  N disputes      (one argument may back many)
```

🔴 **`1 concern : 1 absorption` is the one that was got wrong**, for two rounds, in a shipped design.
the prose said *"per point"* and the mechanism dropped a **file** — so a driver who disputed one
nitpick shed all four the lane raised, **their own three concessions among them**.

⇒ the law that fixes it: **a declaration discharges the concerns it NAMES. concerns it did not name
survive it.** (`rule.forbid.suppression-of-undeclared-concerns`)

## .how a driver names a concern

a reviewer is **not** asked to mint an id. you name the **ordinal position within that reviewer's
own report**:

```sh
# the lane raised 4 nitpicks. you agree with three and argue the fourth.
# each absorption carries its REQUIRED flag: --severity on a concede, --why on a dispute
rhx route.stone.set --stone 1.vision --as conceded --with experience-coverage --about nitpick.1 --severity better
rhx route.stone.set --stone 1.vision --as conceded --with experience-coverage --about nitpick.2 --severity better
rhx route.stone.set --stone 1.vision --as conceded --with experience-coverage --about nitpick.3 --severity better
rhx route.stone.set --stone 1.vision --as disputed --with experience-coverage --about nitpick.4 \
     --why .fulcrums/inventory.of=fulcrums.case=F0NN-<slug>.md
```

⚠️ **there is no ungraded concede.** `--severity` is a mandatory invariant, so a concede without
it is refused at the boundary — the harm test is made on every concession
(`rule.always.concede-with-a-severity`).

⚠️ **the ordinal is scoped to ONE given.** a fresh round renumbers, exactly as a fresh given
supersedes the prior one whole. never carry an ordinal across rounds.

## .what each absorption does to the arithmetic

| the absorption | the tally | the stone |
|---|---|---|
| `--as disputed` | that concern **leaves** the sum | may pass, if what remains clears the threshold |
| `--as conceded` | that concern **stays** in the sum | held, until the repair lands and the lane re-runs |

🔴 **a concession is not a way past the gate**, and that surprises people. it is the declaration that
you read the concern and owe the repair — which is what makes an **un-absorbed** concern detectable at
all. drop the concession and the gate can only ask *"did you declare at all?"*, never *"did you
declare on each?"*

## 🟡 .the tally is a sum ACROSS LANES

`computeReviewTotalsFromFiles` does a `+=` over every review file, so the stone has **one**
`totalBlockers` and **one** `totalNitpicks`, compared to one allowance.

⇒ **a dispute lifts the hold only if what remains clears the threshold.** two lanes at 5 nitpicks
each, under `--allow-nitpicks 7`, total 10 and hold the stone — and a dispute of either one leaves 5,
which passes. a third lane at 5 would leave 10, and the dispute would change naught visible.

## .the traps, in the order a driver hits them

| when… | then… |
|---|---|
| you fix the code and re-arrive with no `.taken` | 🔴 the debt is keyed to the **reviewer**, so it outlives your edit. the entrance gate refuses the round |
| you absorb a concern and think the conversation is over | it is not. the lane returns next generation |
| you want `--about all` | 🔴 there is no such flag, by design. **a driver who types `all` has not read all** |
| you dispute one concern and the stone still holds | correct. read the residual — the other concerns still count |
| a lane shows **0 blockers** and the stone is held | its **nitpicks** crossed the threshold. the judge counts both axes (`S06`) |
| you cannot repair a concern and cannot argue it | that is a wall, not an absorption — `rule.always.raise-a-blocker-a-taken-cannot-close` |
| a concern is right but you disagree with its severity | an absorption takes no position on severity. concede it, or dispute it on the merits |

## .the two artifacts a dispute demands

1. **the fulcrum entry** — `--why` takes a **path**, never prose. the reason and the fulcrum are ONE
   artifact (`S05`), and its purpose is a **guaranteed later review**
2. **the `.taken`** — so the reviewer learns your argument. a dispute the reviewer never reads is one
   it will re-raise

🟡 **no gate reads the fulcrum's content** (`S04` — *"a reason is a nudge to reconsider"*). the
beneficiary is the author: a gate cannot improve a mechanism whose action completes before any reader
arrives. ⇒ **write it for the council, not for the guard.**

## .see also

- `term=route.guard.review.given.concern._.choice._.md` — the atom, and its `.reason`
- `term=route.guard.review.absorption._.choice._.md` · `.absorption.dispute` · `.absorption.concede`
- `rule.forbid.suppression-of-undeclared-concerns` (repo=.this) — the law, and the twelve-row walk
- `rule.always.converge-with-reviewers.via-a-taken-per-point` — the `.taken` half, per concern
- `rule.always.raise-a-blocker-a-taken-cannot-close` — when neither absorption is available
- `contract.reviewer-output` (bhrain/role=reviewer) — the two severities a concern may take
