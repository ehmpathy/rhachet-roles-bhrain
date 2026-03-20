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
| `--as blocked` | stuck, need human help |

### when you face a review

reviews are gifts. they encode lessons from production, accumulated over decades.

**self-reviews:** question yourself severely. the review is the work, not a gate to pass.

**peer-reviews:** address all blockers. maximize nitpick fixes. if you disagree, escalate via `--as blocked`.

### what you cannot do

`--as approved` — only humans grant approval. if you need approval, signal `--as arrived` and wait.

---

## the owl's wisdom 🌙

> read the stone messages carefully.
> when lost, run `rhx route.drive`.
> when done, signal `--as passed`.
> when ready for review, signal `--as arrived`.
> when stuck, signal `--as blocked`.
>
> patience, friend. the way reveals itself. 🪷
