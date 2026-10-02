# hazard.a-hook-cannot-say-into-its-own-clone

> **a hook that calls `rhx clone say` on its own clone deadlocks — and the symptom lies.**

## .the fingerprint

you are inside this hazard if all of these hold:

| # | what you see |
|---|---|
| 1 | a hook dispatches `rhx clone say` into the clone the hook itself runs inside |
| 2 | the hook spends 15s, or its full cap — whichever is smaller — every time |
| 3 | the message never appears in the transcript |
| 4 | 🔴 under a cap below 15s, the failure reads as a slow hook, never as a failed dispatch |

🟡 **row 4 is why this costs hours, and it is the one row a cap can hide.** a hook timeout looks
like a performance problem, so the first instinct is to raise the cap — which lengthens the deadlock
and repairs none of it. what a raise past 15s does buy is a NAMED fault rather than a silent kill
(the cap table below), and a named fault on a wait that cannot succeed is still a fault.

## .the mechanism

`clone say` is deliberately not fire-and-forget. it proves the message was submitted, never
merely handed off:

- `sayClone` writes to the target's pty input and takes a `delivered` ack
- 🔴 then `invokeCloneSay` polls the target's transcript until the message appears as a real user
  turn (`invokeCloneSay.js:107-123`), up to `CLONE_SUBMIT_VERIFY_TIMEOUT_MS = 15000`
  (`constants.js:30`)
- only then does it print `delivered: true`

that poll is what makes `clone say` trustworthy from outside. from inside it is a deadlock:

> the submit it waits for can only be performed by the brain that is, right now, blocked on the hook
> that holds the poll open.

no elapsed time resolves it.

🟡 the hook's own cap then decides which of two symptoms you see — and the deadlock is the same
either way:

| the driver's hook cap | what a driver observes |
|---|---|
| under the 15s verify | the hook dies FIRST, so the `MalfunctionError` that would have named the fix is never reached. ⇒ row 4 above: it reads as a slow hook |
| over the 15s verify | the verify completes and raises the `MalfunctionError`, so the fault names itself — after 15s burnt, every time |

⇒ 🔴 **the second row is a better SYMPTOM and not a repair.** this repo's `route.drive` hooks are
capped at 25s (`.claude/settings.json`), so a deadlock here does name itself — and still spends 15s
of a 25s budget on a wait that cannot succeed.

## .the invariant

> **a hook must never wait on its own brain.**

any dispatch a hook makes into its own clone is **fire-and-hand-off**. the confirmation belongs to a
later turn — never to the hook that made it.

**blocker:** a hook that awaits a `clone say` addressed to its own clone.

## .the repair

- dispatch, and return at once. do not await the submit verify
- move the confirmation to the next turn, where the brain is free — read the resulting state and
  compare it against what was intended
- 🟡 **do not raise the hook timeout to repair THIS.** the wait is unbounded by construction; 5s and
  500s deadlock identically. a raise moves the SYMPTOM across the cap table above and leaves the
  fault untouched. ⇒ raise a cap for a genuine budget shortfall — never as a deadlock remedy

## 🟡 .why the wrong mental model is the natural one

every other use of `clone say` reaches *into* a clone *from* outside — a cron, a comms surface, a
human at a second terminal. that model is correct everywhere except here.

so a design review reads a hook that runs `clone whoami` then `clone say @:self` and finds no
defect, because both commands are individually correct and the sequence is the documented one. the
hazard lives entirely in **where the code runs**, which a command-level read does not surface.

## .the worked example

`.behavior/v2026_09_09.feat-prescribed-brain-per-stone/1.vision.experience.case=5.the-hook-says-to-itself.md`
— a per-stone brain switch, whose seed issue specifies exactly the deadlocked sequence.

## .see also

- `rule.forbid.failhide` (ehmpathy/mechanic) — the swallowed error this produces
- `rule.require.errors-name-the-fix` (ehmpathy/ergonomist) — the message the timeout preempts
