# F2 — the urgent halt's owner line is left as "please ask your human to"

## .the fork

the wish calls the budget top-up *the driver's lever*. the urgent halt in `judgeReviewed` frames
the same command under *"please ask your human to"*. two ways to go:

- **A** — change the line so the halt names the command as the driver's to run (it is: with a live
  `urgent` warrant, `route.guard.budget --add` is driver-owned per
  `rule.always.spend-own-levers-before-escalation`)
- **B** — leave the owner line as is; this route adds only `--peer <lane>` to the command

## .taken — B, and why at the time

- the wish's done criterion 2 asks that the halt *name* `route.guard.budget`; it does, with
  `--peer`. who the halt addresses is a second question
- the owner line is shared vocabulary with other halts and their pins; a change ripples into
  surfaces this fix does not touch, and the vision recorded it as another route's open call
- the fix stays one claim wide: the key, plus the lever that lands on the right lane

## .rework — clean

one string in `route.ts` plus the pins that render it. no caller leans on the phrase.

## .confidence — 70%, and why it is low

the wish's own words (*"names the driver's lever"*) lean toward A. B is defensible on scope, not on
the wish's text. a commander who reads the halt may expect it to address the driver.

## .where

`src/contract/cli/route.ts`, `judgeReviewed`, the urgent-concession halt block.

## .re-taken — A, after peer review (r1 repo-rules, nitpick.2)

the reviewer graded B a lazy deferral: the rework is clean, so the rule's door is to fix it now.
the fact that settled it, found on the re-look: route.drive's budget halt already labels this
exact lever `increase budget — yours to spend` under the same urgent warrant
(`formatBlockRemedyGroups.asBudgetHaltRemedyGroup`). so B left one lever with two owners across two
surfaces — the trap `rule.always.spend-own-levers-before-escalation` names.

the halt now reads `increase budget — yours to spend`, then *"tell your human why this stone bought
budget"* — a sentence the driver writes, never an ask (`rule.always.concede-with-a-severity`).
confidence 85%: the residual doubt is only whether the council prefers the old phrase for reasons
this route cannot see. rework stays clean — one array in `asJudgeUrgentHaltLines`.

## .verdict

A taken; open — for the council.
