# F27 · the live-concede halt is amended into the ack, not implemented as a second halt

- **rework** = clean · **confidence** = 78% · **status** = best-guessed (r8 nitpick.1)

## .the fork

`case=5` `[t1]` and R5 demo a concede-tailored halt at `--as passed`: *"held — you conceded
mechanic; fix it, then re-arrive."* the shipped surface does not emit it. a LIVE-rejected conceded
lane (rounds left, not exhausted) reaches the ordinary judge-held rejection branch
(`setStoneAsPassed.ts:1054-1104`) and prints the generic *"blockers found"* rejection. the reviewer
offered two remedies: implement the concede-tailored halt, or amend `case=5`/R5 to the shipped
surface.

**option A** — implement a live-concede-tailored halt: detect a live lane whose latest rejection was
conceded and emit *"held — you conceded `<slug>`"* in place of the generic rejection.
**option B** — amend `case=5` `[t1]` + R5 to the shipped surface: the concede guidance lands in the
ACK at declaration time; `--as passed` on unchanged code produces the ordinary judge-held rejection.

## .taken, and why

**option B.**

the concede-tailored guidance is already delivered — at the BETTER moment. `case=5` `[t0]`'s ack
prints *"the hold stands. fix, then re-arrive"* the instant the driver declares the concede, which is
the moment the driver needs it. a second concede-worded halt at `--as passed` repeats guidance the
driver already read.

and the aha of `case=5` survives untouched: its value is the LEDGER — `passage.jsonl` records
`conceded — mechanic`, so a human who scans ten rounds sees which were churn and which were
agreement. that record is the stance write, and it is implemented. the `[t1]` halt copy was a
secondary reinforcement of guidance the ack already carries.

## .rework, and why

**clean.** the amend touches two demo files (`case=5`, `case=_`) and no code. option A, by contrast,
is DIRTY: the live rejection flows through the SHARED final judge-rejection branch that EVERY
rejection uses, so a concede-branch there ripples into the ordinary rejection surface, a new blocker
kind or a new formatter, the drive-halt dispatcher, and multiple snapshots. per
`rule.always.fix-forward-under-scouts-honor`, a dirty change is deferred, not ridden inline — so if
the council wants the halt, it is an independent change, not a line smuggled into this convergence.

## .confidence, and why it is 78%

the guidance-at-ack argument is strong and the ledger value is untouched. the 22%: `case=5` is a
wisher-authored critipath demo (feel = sharp), and the wisher may value the `--as passed` halt copy
as a distinct surface that teaches — a driver who runs `--as passed` out of habit reads a
concede-aware message rather than a generic *"blockers found"*. that is a real, if modest, ergonomic
gain option B forgoes.

⇒ **what would settle it:** one line from the wisher — *"the ack is enough, amend the demo"* or
*"emit the concede-tailored halt at `--as passed` too."*

## .where

`.behavior/v2026_09_08.feat-dispute-or-concede-review-budget/1.vision.experience.case=5.the-concede-keeps-the-hold.md` ·
`1.vision.experience.case=_.md` (R5) · `src/domain.operations/route/stones/setStoneAsPassed.ts:1054-1104`

## .the verdict

_not yet ruled._
