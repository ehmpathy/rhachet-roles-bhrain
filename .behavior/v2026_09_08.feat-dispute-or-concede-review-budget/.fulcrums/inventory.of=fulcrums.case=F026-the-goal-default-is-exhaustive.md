# F26 · the `--goal` default is exhaustive, and an un-flagged caller flips with it

- **rework** = clean · **confidence** = 80% · **status** = disputed (r7 nitpick.1)

## .the fork

`parseReviewArgs` flips the `--goal` default from `representative` to `exhaustive`. the route guard
passes `--goal` nowhere, so every guard review reads the new default.

**option A** — keep exhaustive as the default; an un-flagged caller reads it.
**option B** — require the caller to opt in (fail loud when a caller relies on the old default), or
at minimum name the flipped default in the emitted review banner.

## .taken, and why

**option A.**

exhaustive-by-default is the CENTRE of this behavior, not an incidental default. the code carries the
full rationale (`review.ts:167-181`), and it is two-part:

- **economy** — a review's commonest caller is a route GUARD, where each round costs budget. a
  sample reports 3 of 9 instances, the driver repairs 3, the lane re-runs, and the same class
  returns — three rounds to converge on one class. the same corpus reported once converges in one.
- **generalization** — 3 of 9 reads as three local edits; all 9 reveals the CLASS, so the driver
  fixes the cause rather than the instances.

⇒ option B's opt-in would defeat the feature: a guard that must pass `--goal exhaustive` to get
exhaustive coverage is a guard that gets a sample by default, which is the resolution-by-exhaustion
economics this wish was written to fix.

## 🔴 .why the "silent regression" claim does not hold

the reviewer's harm is *"a caller that expected representative discovers the flip at failure time."*
two facts retire it:

- **the goal is NOT silent.** `compileReviewPrompt.ts:117-133` renders `## goal: exhaustive` into the
  prompt, which `writeInputArtifacts` persists to `input.prompt.md`. a caller reads which goal ran
  from the artifact, so option B's "at minimum name it" is already satisfied at the artifact grain.
- **the overflow fails LOUD, with a named remedy.** for a large diff the exhaustive prompt can exceed
  the 75% context guard in `compileReviewPrompt` and throw a `BadRequestError`. that is a fail-loud
  boundary, not a silent regression, and the driver-owned remedy is documented: narrow the lane's
  `--paths-with` via `rhx route.mutate.guard` (`rule.always.diagnose-reviewer-malfunctions`,
  `rule.forbid.hand-run-reviews`). the overflow is the same operational reality the role readme
  already measures (*"four reviewers overflowed"*), with a lever the driver holds.

## .rework, and why

**clean.** a reversal to option B is a one-line default change plus a guard flag; naught built on
the exhaustive default hardens against it. the call sorts, it does not gate.

## .confidence, and why it is 80%

the economy + generalization argument is the wish's own, and the surface + overflow claims are both
checkable and check out. the 20%: the wisher may still prefer a louder note of the goal on the
human-read review banner (over the prompt artifact), which is a cheap addition that does not touch
the default.

⇒ **what would settle it:** one line from the wisher — *"exhaustive is the default, leave it"* or
*"name the goal on the review banner too."*

## .where

`src/contract/cli/review.ts:167-181` · `src/domain.operations/review/compileReviewPrompt.ts:117-133`

## .the verdict

_not yet ruled._
