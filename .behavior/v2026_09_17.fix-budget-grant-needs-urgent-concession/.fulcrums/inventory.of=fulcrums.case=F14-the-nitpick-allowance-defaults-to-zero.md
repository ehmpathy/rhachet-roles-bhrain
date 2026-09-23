# F14 · the wish's CUE has a one-line remedy this design does not take

- **rework** = clean · **confidence** = 65% · **status** = best-guessed

🔴 **found at `r3`, by the guide's own question: *"could we achieve the goal in a simpler way?"* —
turned on the wish's CUE rather than on its outcome.**

## .the fork

`0.wish.md` opens with a measured loop, and it is the whole motivation for the behavior:

```
lane raises a nitpick  →  driver edits  →  lane raises another nitpick
   →  budget runs dry  →  --add N  →  lane raises another nitpick  →  …
```

its diagnosis: *"a nitpick lane is never done — it grades taste, and taste has no floor."*

🔴 **the source says the floor is a number, and the number defaults to ZERO.**

| site | the line |
|---|---|
| `route.ts:1243-1244` | `parseInt(options['allow-blockers'] ?? '0')` · `parseInt(options['allow-nitpicks'] ?? '0')` |
| `genContextCliEmit.ts:281` | `?? { allowBlockers: 0, allowNitpicks: 0 }` |

⇒ **with `allowNitpicks: 0`, ONE cosmetic nitpick rejects the lane.** and the repo states the
consequence in its own test name: *"a nitpick-only rejection over the allowance … a **strict**
allowance makes the nitpicks a real verdict"* (`assertAbsorptionHasSubject.test.ts:122-124`).

| option | the intervention |
|---|---|
| 🔴 A | **leave the allowance alone.** this behavior gates the grant, and the allowance stays a route-author knob at its zero default |
| B | raise the **default** `allowNitpicks` to a small nonzero, and the loop largely dissolves with no gate at all |
| C | both — the allowance dissolves the cue, the gate bounds the lever |

## .taken, and why

**option A**, for this route.

1. **the wish's OUTCOME is about the lever, never the allowance.** *"the budget is the only bound
   that makes a round COST"* — an allowance change bounds no budget at all. a driver that pads for
   any other reason is untouched by option B.
2. **req 1 is unconditional**, and it names the grant. an allowance change satisfies none of the
   eight requirements.
3. **the blast radius is wrong for this route.** `allowNitpicks` is read by the judge on **every**
   stone of **every** route in every repo that boots these roles. a default change is a fleet-wide
   behavior change smuggled into a behavior about one command — the `CLEAN` question of
   `rule.always.fix-forward-under-scouts-honor`, answered no.

## 🔴 .what it costs to leave it

⚠️ **the honest statement: this design bounds the lever and leaves the LOOP intact.**

| | the cue's loop | this design |
|---|---|---|
| a lane raises a cosmetic nitpick | rejects at `allowNitpicks: 0` | 🔴 **unchanged** |
| the driver edits, the lane finds another | repeats | 🔴 **unchanged** |
| the budget runs dry | `--add N` | ✅ **refused, unless a harm is named** |

⇒ **the driver is stopped one step later than the loop begins.** the rounds spent before the meter
runs dry are metered grove spend that this behavior does not recover — and those are the majority of
them, since the refusal fires only at exhaustion.

🟡 **so option C is the honest recommendation and option A is the honest scope.** the two are
complements rather than alternatives: the allowance dissolves the cue, the gate bounds the lever, and
neither does the other's job.

## .rework, and why

**clean.** option B is a changed default literal at two sites, and this design does not read
`allowNitpicks` at all — so the two never touch. a council may rule B or C at any point with no
rework to this gate.

## .confidence, and why it is 65%

the three arguments for option A are sound and the blast-radius one is decisive for **this** route.

**the 35%:** a council reads a wish whose entire motivation is the nitpick loop, and finds a design
that leaves the loop in place and gates the step after it. ⇒ *"you fixed the symptom's symptom"* is a
fair read, and `rule.require.solve-at-cause` is the brief that would be cited.

⚠️ **and the counter to that counter is real too:** the cue is the motivation, never the requirement.
the wish's eight requirements are unanimous about the lever, and a driver that re-scoped a wish
toward its cue would have settled the wisher's question by side effect.

⇒ **what would settle it:** whether the wisher wants the **loop** dissolved (option B or C, a
fleet-wide default change) or the **lever** bounded (option A, this behavior) — or both, in order.

## .where

`1.vision.yield.md` § *each requirement, challenged* — the provenance table that surfaced it ·
`0.wish.md` § *the cue that fired* — the loop this row weighs against ·
`assertAbsorptionHasSubject.test.ts:122-124` — the repo's own statement that a strict allowance is
what makes nitpicks a verdict

## .the verdict

🔴 **RULED — option A, and the ROW'S OWN PREMISE IS STRUCK.** `$route/.seeds/…case=S03…`.

the council took option A. **it did not take it for any of the three reasons above.** it took it
because the loop this row calls a cost is not a cost:

> **the budget IS the allowance for `better` churn. inside the meter, taste counts. past the meter,
> only `urgent` does.**

### 🔴 what the strike reaches

| this row said | what holds |
|---|---|
| *"this design bounds the lever and leaves the LOOP intact"* | 🔴 **there is no loop to dissolve.** there is a **window** the route author bought, and a bound at the end of it |
| *"the rounds spent before the meter runs dry are metered grove spend this behavior does not recover"* | 🔴 **false.** they are the budget, spent as designed. naught is owed a recovery |
| *"taste has no floor because the floor is set at zero"* | 🔴 **the floor was never `allowNitpicks`. the floor is the METER**, and it was there the whole time |
| option C, *"the honest recommendation"* | **refused.** a raised allowance would spend the window on lanes the route author did not buy taste from |

⇒ § *what it costs to leave it* is **withdrawn in full**, and the 35% it justified with it.

### 🟡 the class, and it is why this row was wrong rather than merely unlucky

**this row read the wish's CUE as a defect report, and it is a usage report.** `0.wish.md` opens with
the churn loop to show *where the lever gets reached for* — never to claim the churn itself is waste.
the row inferred the second from the first and then argued three pages downstream of the inference.

⚠️ **and the inference was invisible to every instrument this route ran.** the consistency sweep
needs two artifacts that disagree, and none did — the yield, the row, and `case=_.md` all inherited
the same misread. a source read cannot check it either, because the claim is about **intent**. ⇒
**only the wisher could settle it, and the row's own `triage` marker said so.** the marker worked;
the three-page argument beneath it was spent before the marker was honoured.

## .the amendment

**confidence: 65% → RULED.** the 35% named the right risk and pointed it at the wrong party — it
feared a council would say *"you fixed the symptom's symptom"*, and the council instead said **there
was no symptom there to fix.**
