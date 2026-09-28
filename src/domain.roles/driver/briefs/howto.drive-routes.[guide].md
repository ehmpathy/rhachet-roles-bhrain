# howto: drive routes

## .what
guide for drive thought routes: status commands, reviews, and the road ahead.

## .why
enable drivers to navigate routes without hit dead ends or wait for help unnecessarily.

---

## the road ahead 🦉

> a route is a paved path — worn smooth by those who walked before.
> stones mark milestones. guards ensure readiness.
> you drive forward, one stone at a time.
>
> the route was crafted from generations of trial and error.
> respect the wisdom embedded in each stone.

---

## when you're on the road

### if you don't know what to do

run `rhx route.drive` — it shows the current stone and what to do next.

### when you've completed the work

| command | when to use |
|---------|-------------|
| `--as passed` | signal work complete, proceed |
| `--as arrived` | signal work complete, request review |
| `--as disputed\|conceded --with <reviewer> --about <concern>` | absorb ONE concern — dispute it, or concede it |
| `--as absorbed --that <slug>` | absorb the feedback — record you engaged a reviewer, **after every concern is absorbed** |
| `--as blocked` | at a genuine wall — and only after you answered what you could |

### when you face a review

reviews are gifts. they encode lessons from production, accumulated over decades.

**self-reviews:** question yourself severely. the review is the work, not a gate to pass.

**peer-reviews:** address all blockers. maximize nitpick fixes.

🔴 **if you disagree, that is a `[REFUTE]` in your `.taken` — never a halt.** write the argument
with cited evidence, absorb the concern as `--as disputed`, run `--as absorbed --that <slug>`, and
re-arrive. feedback you have not absorbed is not a wall, and the entrance gate refuses a fresh round
while any reviewer is owed an answer (`rule.forbid.unanswered-exits-from-a-blocker`).

⚠️ **and a code fix is not an answer either.** the debt is keyed to the reviewer, so it survives
your edit — the reviewer never learns of a repair you did not write down, and re-raises it.

### what you cannot do

`--as approved` — only humans grant approval. if you need approval, signal `--as arrived` and wait.

### keep the drive alive on a long road

on a long, autonomous drive that may span api outages or idle stretches, a **RouteReminder**
keeps the session in motion — a scheduled nudge that pokes it back into motion, and self-exits the
moment the route blocks, halts, or the session dies (no infiniloops).

you do **not** turn it on by hand: `route.drive` findserts the reminder automatically on every
drive while the route is live, and reaps it when the route is dead. an enrolled drive is covered
with no action from you.

the full runbook — the auto path, the manual inspect/override skills, and what it does NOT cover —
is in `howto.route-reminder.[guide].md`.

---

## the owl's wisdom 🌙

> read the stone messages carefully.
> when lost, run `rhx route.drive`.
> when done, signal `--as passed`.
> when ready for review, signal `--as arrived`.
> when stuck, signal `--as blocked`.
>
> patience, friend. the way reveals itself. 🪷
