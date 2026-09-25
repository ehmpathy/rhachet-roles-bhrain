# seed S13 — block up to once, and only within 30s of the ask

**status** live · **rules** `F11` → **a refinement no option in the fork contained** · **utterances** 3
· **on** 2026-09-18

## .said

> blocks once

> but only if within 30s of receipt of review prompt

> i.e., block up to once and upto 30sec from when prompt as received

## .settled

**the challenge fires when BOTH bounds hold, and each is a cap rather than a threshold:**

```
challenge  ⟺  attempts == 0  ∧  elapsed-since-the-ask < 30s
```

| the bound | what it caps |
|---|---|
| **up to once** | at most **one** challenge per `(stone, slug)`. the next promise clears |
| **up to 30s** | the challenge fires only inside 30s **of the ask**. past that, no challenge at all |

⇒ **so a driver is never held, and a driver who took their time is never confronted.** the first
bound removes the wait; the second removes the universality. **the two bounds answer two different
objections, and neither alone answers both.**

## 🔴 .this is a FIFTH option, and the fork contained none of it

the comparison offered `E1` (block once, universally) and `E2` (never block). the answer takes
**neither** — it conjoins `E1`'s cap with a target condition that only option `B` had:

| | blocks? | is the driver **held**? | is the confrontation **targeted**? |
|---|---|---|---|
| **B** — keep the clock | until 30s elapses | 🔴 **yes** — they wait | ✅ yes |
| **E1** — block once | once, everyone | ✅ no | 🔴 **no** — universal |
| **E2** — never block | never | ✅ no | n/a — no confrontation exists |
| 🔴 **this** | once, **only the rushed** | ✅ **no** | ✅ **yes** |

⇒ **it is the only option on the page that is unambiguously better than two of its neighbours** on
the measured design table: it honors *"preserve autonomy — guide but don't block"* (nobody waits)
**and** *"target interventions — only confront on repeated rapid attempts"* (only the fast driver is
met). `B` bought the second at the cost of the first; `E1` bought the first at the cost of the
second.

## .the concept, stripped of this round

> **a clock that costs a command is not a clock that costs a wait.**

the wish rejects duration as **evidence of review** — *"a cleverer clock … preserves the premise
this wish rejects: that duration is evidence of review."* that rejection is about a **wait of
unbounded length, charged to everyone**. this answer keeps a refusal and strips the wait:

| the clock's job | does it refuse? | the driver's cost when it fires |
|---|---|---|
| a **gate** — duration is the evidence | 🔴 yes, until the clock runs out | a **wait**, of unbounded annoyance and zero information |
| 🔴 a **cue** — duration picks who hears a prompt | 🔴 **yes, once per slug** | **one command**, and a paragraph that names four checks |

⚠️ **both rows refuse, and the round must not hide that.** `challenge:rushed` returns
`challenged: true`, the cli turns it into exit 2, so the promise is not recorded either way. **what
parts the two rows is the price and the population**: a wait charged to every driver, versus one
re-run charged only to a driver who promised inside 30s of the ask, at most once per slug.

⇒ the general shape: **a signal too weak to justify a WAIT can still be strong enough to justify a
question.** elapsed time cannot tell an honest fast read from a dishonest one — so it must not hold
anybody. it *can* tell who is likely to benefit from a reminder — so it may pick who hears one, and
charge them a re-run to read it.

🔴 **and the target is what finally makes the prompt's own words true.** *"what's the rush?"* asked
of a driver who spent forty minutes is a non sequitur, and under `E1` it was asked of them every
time. under this answer it is asked only where it is a real question.

## ⚠️ .what it costs, and the objection the council must weigh

**the cheapest bypass is now a `sleep`.** a driver who waits 31 seconds and promises once, with a
garbage articulation at the right path, meets no prompt at all — where under `E1` they would have
met it. so the round re-admits the premise that duration carries information about review.

⇒ **that is real, and it is bounded by what the refusal COSTS.** 🔴 a promise **is** refused for
duration — `challenge:rushed` returns `challenged: true` and the cli exits 2 — but at most **once
per slug**, only inside the window of the ask, for **one command and no wait**. so the wish's
`.the outcome` — *"a driver who has genuinely reviewed is never **held** by a clock"* — holds in
full, and its requirement 1 — *"never **refused** for elapsed time alone"* — is what this seed
supersedes. ⚠️ **a reader of `0.wish.md`'s *"what is NOT wanted"* will still see *"a cleverer
clock"* and should be pointed at this distinction rather than left to find it.**

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F11-does-the-reflect-prompt-still-block.md`
- `.fulcrums/inventory.of=fulcrums.case=F06-should-the-threshold-become-a-guard-knob.md` — 🔴
  **un-mooted.** the threshold returns, so the knob question has an operand again
- `.fulcrums/inventory.of=fulcrums.case=F01-keep-or-drop-the-min-timer.md`
- `1.vision.experience.dimensions.md` · `1.vision.experience.case=_.md` · `case=1` · `case=2`
- `1.vision.yield.md`
