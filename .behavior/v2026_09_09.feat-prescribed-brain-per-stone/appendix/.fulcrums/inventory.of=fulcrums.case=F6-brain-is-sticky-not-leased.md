# F6 — a switched brain is sticky, never restored on stone exit

**rework** = clean · **status** = open · **confidence** = 80%

## .the fork, stated fairly

the issue's fourth open question. a stone switches to opus, passes; the next stone declares no brain.

- **sticky** — the driver stays on opus
- **restore-on-exit** — the driver drops back to the brain it launched on

## .taken, and why at the time

**sticky, with attribution.**

1. it matches the wish's stated bound — *"a stone with no `brain:` field keeps the inherited brain"*.
   after a switch, the inherited brain **is** the switched one
2. 🔴 **it holds no state.** the live brain IS the state. restore must remember a per-stone prior
   brain and replay it on exit — and every path that can halt, block, or rewind is a path where the
   restore silently does not fire. that is a new instance of the exact seam cases 3 and 5 are already
   spent on
3. the failure modes are asymmetric: sticky runs a stone *richer* than needed (costly, never wrong);
   a broken restore leaves the recorded state **false** (wrong, and silent)

## .the counter-case, stated fairly

⚠️ **the cost leak is real.** an expensive brain set on one hard stone bills every routine stone that
follows it. on a long route that is the majority of the drive, and it is money nobody chose to spend.

### 🔴 amended 2026-09-13 — the leak is STRUCTURAL, never a tail

the wisher settled the shape of a route (`S7`): **the hard stones are vision and blueprint, and every
stone from the roadmap onward is mechanical.**

⇒ so *"on a long route"* above understates the leak by understatement of its **certainty**. the hard
region does not merely *happen* to end early on some routes — **it ends early by construction, on
every route.**

| the read | what it implies |
|---|---|
| the prior read — *"on a long route"* | a leak whose size varies with the route. sometimes small |
| 🔴 **the measured shape** | the mechanical region is the **body** of every route. the leak is **always** most of the drive |

⚠️ **and that inverts which half of the feature carries the value.** the lift to a rich brain reads as
the point; **the drop back at the roadmap is where the economy is** — and the drop is exactly the half
this fulcrum leaves to a third repo.

🔴 **so the bhuild dependency below is not merely *"a dependency of the cost claim"* — it owns the
majority of the economy.** a template that stamps a rich brain on the hard stones and stays silent
thereafter delivers the switch and none of the money.

⇒ answered — not dismissed — by the cross-repo work the issue already names: bhuild's guard templates
must stamp the **cheap** brain on routine stones, not only the expensive one on hard stones. a
template that declares opus and stays silent elsewhere bills opus for the whole route.

that answer has a real cost: it makes the bhuild template task a **dependency of the cost claim**,
not a nice-to-have.

## .rework, and why

**clean.** restore is additive: keep a prior brain, dispatch it on exit. no contract changes, no
guard field changes, no caller hardens against stickiness.

## .confidence, and why 80%

the state argument is strong and generalizes. the 20% is that the cost leak lands on a **human's
bill**, and the fix routes through another repo's templates — so if the bhuild work slips, sticky is
strictly worse than restore in the interim. a wisher who weights that interim heavily rules the other
way.

## .where

`1.vision.experience.case=7.the-next-stone-declares-none.md`.

## .the verdict

open — for the fulcrum council.
