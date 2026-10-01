# fulcrum F27 — a kill mid-await leaves a LIVE claim and no dispatch, so a brain stone renders as case=10 for 15s

**raised** 2026-09-18, on i038 — `r010` blocker.1 asked for exactly this earmark
**rework** = 🔴 dirty · **status** = open · **confidence** = 70%

## 🔴 .why this fulcrum exists at all — the reviewer named the remedy

`r010` (`behavior-intent-coverage`) graded the window a **blocker**, and its close is not a code fix:

> *"Per `rule.require.behavior-intent-coverage`, every requirement must be satisfied or explicitly
> deferred. This arm is neither: it violates the fail-loud bound and was accepted by the build, not
> deferred by the wisher."*
>
> *"A `5.3` verification stone will not let this drive pass without it … fixed or **explicitly
> earmarked to the wisher**."*

⇒ **the build accepted a tradeoff that only the wisher may accept.** the source said so in its own
words — *"accepted tradeoff, no wisher was asked"* — which is a confession rather than a deferral.
**this file is the earmark**, and it converts a build-accepted arm into a wisher-owned call.

## .the fork, stated fairly

the wish's bound: *"fail loud, never a silent no-op, if the driver clone is unreachable or the brain
rejects `/model`."* the vision narrows it: *"a switch that was **ASKED for** and did not happen →
fail loud."*

**this arm breaks that bound for up to 15s, on a stone that asked.**

the mechanism, and it is forced rather than chosen:

| step | what happens |
|---|---|
| 1 | the claim is written **before** the dispatch |
| 2 | 🔴 the process is KILLED here — a driver hook is killable at its own cap (`F-d`) |
| 3 | `setEntry` and `delClaim` never run, so the claim survives with a **fresh** mtime |
| 4 | `isBrainDispatchClaimLive` reads it LIVE, so every peer and every next tick stands down |
| 5 | the drive renders `{ outcome: 'none' }` — **byte-identical to `case=10`** — until the mtime expires |

🔴 **step 1's order is not a preference.** to hold the state lock across a multi-second probe would
blow its 500ms acquire deadline, so the claim must precede the dispatch, so the window exists by
construction.

> 🔴 **amended 2026-09-25, at the execution stone — this corner was the NORMAL case, not a race.**
> the two `route.drive` hook sites now carry `timeout: 25`; at the vision-time `timeout: 5` a
> measured `clone whoami` p50 of **5537ms** exceeded the whole budget, so step 2 fired on **every
> entry tick with a healthy probe**.
>
> ⚠️ **the window itself is unchanged, and so is every choice this fulcrum records.** a cap that
> admits the probe makes the kill rare again; it does not remove it. ⇒ `1.vision.yield.md`'s F-d
> amendment carries the measurement.

| | the choice |
|---|---|
| **taken** | accept the window, bounded at `BRAIN_DISPATCH_CLAIM_WINDOW_MS` (15s), self-healed on the first tick after expiry |
| **rejected A** | shorten the window — it shortens the pty interleave protection the claim exists to give (i029 `r007` blocker.1) |
| **rejected B** | write a liveness pid into the claim, so a dead writer's claim is reaped at once — it re-introduces the `O_EXCL`-plus-reap shape the claim deliberately is **not** |
| **rejected C** | write the claim AFTER the dispatch — then two concurrent ticks both dispatch, which is the exact interleave the claim was built to prevent |

## .what was taken, and why

**the argument is that the window is bounded, self-healed, and cheaper than every repair for it.**

- 15s is one tick's worth of silence on a drive that runs for hours
- the next tick after expiry dispatches normally — **no state is corrupted and no manual repair is owed**
- rejected C is not a repair at all; it trades a bounded silence for an unbounded double-dispatch into
  a live pty, which is the harm the claim exists to prevent
- A and B each **buy the fix with the guarantee the claim was built for**, so each converts one
  defect into another rather than removes one

⇒ so the ranked harm is: a **15s silence that heals itself** beats a **pty corruption that does not**.

## 🔴 .the counter-case, and it is real

**the silence is INDISTINGUISHABLE from the one case the design most needs to keep distinct.**

- `case=10`'s whole contract is *"a stone that declares no brain is entirely silent"*
- this arm renders that exact output for a stone that **did** declare one
- ⇒ so a driver reads *"this stone has no brain"* from a surface that means *"the switch is still owed"*

🔴 **and that conflation is what the wish's bound names, verbatim.** the vision's own words: a
build that reads the bound narrowly must still fail loud for *"a switch that was ASKED for and did
not happen"* — and this arm asks, does not switch, and does not say so.

the bound has a second weakness: **15s is a bound on the CLAIM, never on the drive's exposure.** a
driver who reads the drive output inside that window acts on a false read, and the render carries no
mark that a claim was live. ⚠️ **so the self-heal repairs the STATE and not the driver's belief.**

🟡 and rejected B's objection is weaker than it reads. the claim's subject is *a write window*, not
*a process*, so a pid is foreign to it — but a **generation counter or a boot id** is not, and neither
was costed. ⇒ **the option set above may be incomplete**, which is a reason for a wisher to look
rather than to ratify.

## .why it is dirty

the rework cost depends on which repair a wisher picks, and two of the three touch a contract:

| the repair | cost of a reversal |
|---|---|
| **A** — shorten the window | ✅ clean mechanically — one constant. 🔴 but it re-opens i029 `r007` blocker.1, so the reversal is a *guarantee* trade rather than a code trade |
| **B** — a liveness field | 🔴 dirty — `BrainDispatchClaim`'s shape, `genBrainDispatchClaim`, `isBrainDispatchClaimLive`, `delBrainDispatchClaim`, their unit + integration suites, and the acceptance snapshots that render the claim's lifecycle |
| **C** — reorder the write | 🔴 dirty, and it is refused on correctness rather than cost |

⇒ graded **dirty** on the majority case: the only repair that closes the window without a guarantee
trade is B, and B is a contract change across five operations plus their snapshots.

## .where

- `src/domain.operations/route/brain/applyStoneBrainOnEntry.ts` — the window, and the note that admits it
- `src/domain.operations/route/brain/genBrainDispatchClaim.ts` — the write that precedes the dispatch
- `src/domain.operations/route/brain/BrainDispatchClaim.ts` — `BRAIN_DISPATCH_CLAIM_WINDOW_MS`, and the shape B would change
- `blackbox/driver.route.brain.acceptance.test.ts` — the residuals table that recorded it as accepted
- `…i038…r010._.given.by_peer.behavior-intent-coverage.report.md` — the blocker that asked for this earmark

## .confidence, and why

**70%.** what is measured: the mechanism, the forced write order, the 500ms lock deadline that forces
it, and that the render is byte-identical to `case=10`. what is a judgment is the **rank of two
harms** — a bounded silent window against a pty interleave — and that rank rests on how often a
driver hook is actually killed mid-await, which nobody here has counted.

⚠️ **the residual 30% is one specific gap: the option set is not proven complete.** a generation
counter was never costed, and a **render mark** — one line that says a claim was live rather than
that no brain was declared — would close the *conflation* with no touch of the claim's contract at
all. ⇒ **a wisher may fairly rule that the cheapest fix is to make the silence legible rather than to
remove it**, and neither the build nor this file costed that arm.

## .the verdict, once ruled

*(open)*
