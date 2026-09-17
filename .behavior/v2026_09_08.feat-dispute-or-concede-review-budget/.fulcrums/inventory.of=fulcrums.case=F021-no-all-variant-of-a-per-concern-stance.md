# F21 · is a bulk `--about all` offered, or refused outright?

- **rework** = clean · **confidence** = ✅ **settled** (was 78%) · **status** = ✅ **ruled — fork A**
- **raised 2026-09-10**, the moment the per-concern grain landed — because the ergonomic complaint
  it answers is certain to arrive
- ✅ **ruled 2026-09-10** by the wisher, same day: *"exactly, agreed"* on the premise verbatim —
  **a declaration is evidence of a read, never merely a record** (`S08`)

## .the fork

per-concern means four declarations where one used to do. **a driver will ask for a bulk form**, and
the ask will be reasonable: a lane at 6 nitpicks the driver agrees with entirely now costs six
commands.

| fork | the surface | what it costs |
|---|---|---|
| **A** | 🔴 **no bulk form at all.** one declaration per concern, always | six commands on a six-concern lane |
| **B** | `--about all` — one declaration covers every concern in that given | 🔴 reintroduces the per-file defect under a friendlier name |
| **C** | `--about nitpick.1,2,3` — an explicit **enumeration**, still one per concern semantically | the driver names each, and types once |

## .taken, and why — A, at 78%

> **a driver who types `all` has not read all.**

the whole value of the per-concern grain is that a declaration is **evidence the driver read that
concern**. `all` is a declaration with no such evidence behind it, so B is not a convenience on top
of the mechanism — **it is a hole through it**, and it is the exact hole `S07` was raised to close.

⇒ and the friction is the feature. six commands on a six-concern lane is the design's honest price
for six admissions of fault. a form that makes it one command makes it one **unread** admission.

🟡 **C is not rejected on principle** — an enumeration names each concern, so it keeps the evidence.
it is deferred as a **surface** question with no effect on the mechanism: C parses to N declarations
and is a pure ergonomic addition a later round may make at zero cost.

## .rework, and why — clean

A is the **absence** of a flag. to add B or C later is additive; naught is hardened against either,
and no artifact on disk changes shape.

⇒ that is what keeps this row at 78% rather than lower: **the cost of a wrong call here is one round
of keystrokes, and it is reversible in a day.**

## .confidence, and why it is not higher — 78%

1. **the friction is real and I priced it from a 4-concern example.** a lane at 15 nitpicks — which
   this repo's reviewers do produce — costs 15 commands, and at that scale *"the friction is the
   feature"* starts to read as an excuse
2. ⚠️ **A pushes a driver toward the wrong lever.** a driver who finds six declarations tedious may
   reach for `--as blocked`, or for a budget top-up, rather than declare — and both are worse than
   the tedium
3. 🟡 **I did not weigh whether CONCEDE deserves a bulk form where DISPUTE does not.** a bulk
   concession claims fault and sheds naught from the tally, so it cannot buy passage — the asymmetry
   is real and I noticed it late

## .where

`term=route.guard.review.given.concern._.choice.reason.md` § invariants, row 5 ·
`rule.forbid.suppression-of-undeclared-concerns` § the cue table ·
`1.vision.experience.case=11` § why it fails safe.

## .what would settle it

**one question to the wisher:** *is a declaration meant to be EVIDENCE that the driver read the
concern, or merely a record of their position?*

- evidence → A holds, and the friction is the point
- a record → C at once, and B is arguable

🟡 **and one measurement:** the distribution of concerns-per-given across this repo's route history.
if the median lane raises two, the friction argument is over-built; if it raises nine, hazard 1 is
the real risk on this row.

## .the verdict once ruled

✅ **fork A — ruled 2026-09-10.** the wisher agreed with the premise, quoted back verbatim:

> **there is no `--about all`, by design: a driver who types `all` has not read all. That treats a
> declaration as evidence of a read, not merely a record.**

⇒ **`--about all` is forbidden outright**, and the ground is now settled rather than argued: **a
declaration is EVIDENCE.** that is a claim about what the mechanism is *for*, and it outranks the
ergonomics.

### 🔴 what the verdict CHANGES — and it reaches past this row

| what it was | what it is now |
|---|---|
| B (`--about all`) was a **fork** | 🔴 **closed.** it is not a surface a later round may add — it would void the evidence property the wisher just elected |
| C (`--about nitpick.1,2,3`) was *"deferred, at zero cost"* | ⚠️ **narrower than it read.** C keeps the evidence **only** where the driver types each ordinal. ⇒ it stays open as a surface, and it inherits a bound: **no range form** (`nitpick.1-6`), which is `all` with a hyphen |
| the friction was *"the design's honest price"* — my argument | ✅ **the wisher's argument now.** the row no longer rests on my priced example |
| hazard 3 — *"a bulk CONCEDE may deserve what a bulk DISPUTE does not"* | 🔴 **refused by the verdict's own ground.** a bulk concede sheds naught from the tally, so it cannot buy passage — but it **over-claims**: it commits the driver to concerns they never read. that is `rule.forbid.suppression-of-undeclared-concerns`'s second shape, and the evidence property forbids it symmetrically |

🟡 **hazard 3 is the one worth the row.** I filed it as an un-weighed asymmetry that might favour a
bulk concede. **the verdict's ground kills it** — and by the law this route already wrote down, one
day earlier, in the rule I authored. ⇒ **a hazard can be answered by an artifact you already own**,
and I did not check the rule against my own fulcrum.

🟡 **and the measurement this row asked for is no longer owed**, for the same reason `F020`'s is not:
the distribution of concerns-per-given would have **informed the fork**, and the fork is ruled. what
it now informs is a **cost** — how loud the ergonomic complaint will be — and that belongs in
whichever round takes up C.
