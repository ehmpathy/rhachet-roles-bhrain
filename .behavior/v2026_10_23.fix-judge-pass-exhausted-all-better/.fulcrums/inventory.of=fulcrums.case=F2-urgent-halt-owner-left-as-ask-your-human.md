# F2 — the urgent halt's owner line is left as "please ask your human to"

## .the fork

the wish calls the budget top-up *the driver's lever*. the urgent halt in `judgeReviewed` frames
the same command under *"please ask your human to"*. two ways to go:

- **A** — change the line so the halt names the command as the driver's to run (with a live
  `urgent` warrant, `route.guard.budget --add` is driver-owned per
  `rule.always.spend-own-levers-before-escalation`, and route.drive's budget halt already labels it
  `increase budget — yours to spend`)
- **B** — leave the owner line as is; this route adds only `--peer <lane>` to the command

## .taken — B

- a shipped nurture invariant, `define.invariant.review.peer.judge.urgent-guides-the-budget-ask`,
  holds the judge's urgent halt to *"please ask your human to"*. a fix route does not overturn an
  invariant; a council does
- the wish's done criterion 2 asks that the halt *name* `route.guard.budget`; it does, with
  `--peer`. who the halt addresses is a second question
- the two shipped briefs disagree on who owns this lever. that disagreement is real, and it is the
  council's to reconcile — the halt's doc note names both, so the next reader sees the seam

## .the litigation

r1 (repo-rules, i001 nitpick.2) graded B a lazy deferral, since the rework is clean. A was taken for
one round on that ground plus the route.drive label. r10 (i002) then cited the invariant above,
which mandates the B phrase for this exact halt. B was restored: a clean rework is not a licence to
override a declared invariant.

## .rework — clean

one array in `asJudgeUrgentHaltLines` plus the pins that render it. the owner label is now one
constant, `JUDGE_HALT_ASK_HUMAN_LABEL`, shared by both judges, so a council verdict for A is a
one-line change.

## .confidence — 75%, and why it is low

the wish's own words (*"names the driver's lever"*) and the driver brief lean toward A; the
invariant holds B. the call sits between two shipped artifacts.

## .where

`src/domain.operations/route/guard/review/peer/asJudgeUrgentHaltLines.ts`.

## .verdict

B held; open — for the council to reconcile the invariant with the driver brief.
