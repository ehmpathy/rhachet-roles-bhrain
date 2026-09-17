# F20 · what IS a concern's identity — an ordinal within one given, or a key durable across rounds?

- **rework** = 🔴 **dirty** · **confidence** = ✅ **settled** (was 66%) · **status** = ✅ **ruled — fork A**
- **raised 2026-09-10**, on the round `S07` landed — and it is the row that verdict makes unavoidable
- ✅ **ruled 2026-09-10** by the wisher, the same day: *"stances do not survive rounds; only live in
  latest round"* (`S08`). ⇒ **the taken fork was right, and the 34% doubt was about a question the
  wisher answered in one clause.** the row is kept whole below — a confirmed guess and an unexamined
  one read identically once the verdict is on the page, and only the argument tells them apart

## .the fork

`S07` settles that a stance targets one **concern**, and the wisher fixed the driver's surface
verbatim: `--about 'blocker.3' of 'reviewer.X'`. that is an **ordinal**. what it is an ordinal
*into* is not settled, and three answers are open.

🔴 **the engine offers no help.** `getReviewCountsViaRegex` returns two integers and no per-item
structure at all, so **every fork below invents identity from scratch.**

| fork | a concern's identity | a fresh round then |
|---|---|---|
| **A** | `(reviewer, severity, ordinal)` **within ONE given** | renumbers. `nitpick.4` in `r3` and in `r4` are different concerns |
| **B** | `(reviewer, severity, ordinal)` **stable across rounds** while the reviewer re-raises it | preserves. a stance survives the round it was made in |
| **C** | a **content hash** of the concern's text | preserves, and survives a reorder |

## .taken, and why — A, at 66%

**A is the only fork the extant artifacts can support today.** a given is a file of prose; the two
integers are its whole parsed structure. B needs a match across rounds and C needs the text itself
parsed into items — **both demand a reviewer-output contract change**, and
`contract.reviewer-output` is a published brief every reviewer in every repo already satisfies.

⇒ A costs a parse of the driver's flag and no change to any reviewer.

## 🔴 .rework, and why — DIRTY

**this is the one dirty row on the board since `F004`, and the reason is that a stance PERSISTS.**

a stance is written to `passage.jsonl` and read at the next passage check. so the identity scheme is
not a render choice — it is the key in a durable record. reverse A to B or C later and every stance
already on disk must be re-keyed, or discarded.

⚠️ **and `S03` sharpens it.** a disputed lane returns next **generation**, so the design already
expects a driver to re-declare. under A that is correct by construction; under B it would be a
regression, since B's whole claim is that a stance survives. ⇒ **the fork is not merely about
storage — it changes what a re-declaration MEANS.**

## 🔴 .confidence, and why it is low — 66%

1. 🔴 **A is fragile against a reviewer that reorders.** a reviewer that lists its nitpicks in a
   different order next round makes `nitpick.4` a different concern with no signal to anyone. under A
   that is *correct* — a fresh given renumbers — and it will still surprise a driver who watches a
   stance land on a concern they did not read
2. 🔴 **A silently discards a stance the driver may have meant to keep.** the driver disputes
   `nitpick.4`, the lane re-runs, the reviewer re-raises the same concern, and the driver must
   dispute it again. defensible (`S03`: one generation), and **unmeasured** — nobody has walked how
   often a lane re-raises an identical concern
3. **I did not weigh a fourth fork:** the reviewer emits ids **optionally**, and the driver's ordinal
   is the fallback where it does not. that is likely the right long-run answer, and it is a
   `contract.reviewer-output` change this vision has no mandate to make
4. ⚠️ **the wisher's own words lean toward A and do not settle it** — *"we dont require the reviewers
   to give an id to each concern today"*. **today** is the load-bearing word, and it names a
   trajectory rather than a scheme

## .where

`term=route.guard.review.given.concern._.choice._.md` § *how a driver names one* ·
`1.vision.experience.case=11` `[t2]` — the step where the lane re-runs and the ordinals renumber.

## .what would settle it

**one question to the wisher:** *should a stance survive the round it was made in?*

- **no** → A. a stance is scoped to one given, exactly as a `.given` is
- **yes** → B or C, and `contract.reviewer-output` grows an id

🟡 **and one measurement would inform it:** across this repo's route history, how often does a lane
re-raise a textually identical concern in consecutive rounds? if the answer is *"routinely"*, hazard
2 is real and A costs a driver a re-declaration every round.

## .the verdict once ruled

✅ **fork A — ruled 2026-09-10.** verbatim:

> **stances do not survive rounds; only live in latest round**

⇒ a concern's identity is `(reviewer, severity, ordinal)` **within ONE given**, and a stance is
scoped to the given it answered. a fresh round renumbers, and the driver re-declares.

### 🔴 what the verdict CHANGES — the dirt is discharged, and the dream is unblocked

| what it was | what it is now |
|---|---|
| `rework = dirty`, because a reversal to B or C would re-key every stance on disk | 🔴 **the dirt does not disappear — it is SPENT.** A is now the settled scheme, so no re-key is owed. a *future* move to B or C is a fresh call, and it inherits this row's cost rather than this row's doubt |
| hazard 2 — *"A silently discards a stance the driver may have meant to keep"* | ✅ **not a hazard. it is the RULED BEHAVIOUR.** the wisher's *"only live in latest round"* names this outcome and elects it |
| hazard 1 — a reviewer that reorders makes `nitpick.4` a different concern | ⚠️ **survives, and is now a known cost rather than an open fork.** under A a fresh given renumbers by design; the surprise is ergonomic, and its repair is a render (print the concern's text beside the ordinal), never an identity change |
| hazard 3 — the un-weighed fourth fork (optional reviewer ids) | ⚠️ **still un-weighed, and still out of mandate.** it is a `contract.reviewer-output` change. ⇒ it does not re-open A; it is the shape a later route may take |
| `.dream/v2026_09_10.fix.the-taken-gate-counts-reviewers-not-concerns.md` — *"must not land before `F020` is ruled"* | ✅ **unblocked.** the dream inherits A: a `.taken` debt keyed on `(slug, severity, ordinal)` **within one given**, which renumbers with the given rather than under the driver |

🟡 **and the measurement this row asked for is no longer owed.** it read *"how often does a lane
re-raise a textually identical concern?"* — framed as evidence that would **inform the fork**. the
fork is ruled, so that number now informs only a **cost**, and its home is the dream's own
`.the shape of the fix`, never a fulcrum on this board.

⇒ **that is worth one line, because it is a class:** a `.what would settle it` clause outlives its
own usefulness the moment a verdict lands, and a reader who meets it afterward re-runs a measurement
nobody needs.
