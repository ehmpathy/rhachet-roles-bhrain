# fulcrum F11 — does the reflect prompt still block, or does it ride the ask?

**rework** clean · **status** ✅ **RESOLVED — E1, BOUNDED by 30s from the ask** (`S13`) ·
**confidence** 97% · **where** `getSelfReviewChallengeDecision.ts:61-67`, `setStoneAsPassed.ts:248-259`

## ✅ .what was ruled — and it is a FIFTH option, not one of the two

> *"blocks once"* · *"but only if within 30s of receipt of review prompt"* · *"i.e., block up to once
> and upto 30sec from when prompt as received"* (`S13`)

```
challenge  ⟺  attempts == 0  ∧  elapsed-since-the-ask < 30s
```

**both bounds are caps, and each answers an objection the other cannot:**

| the bound | the objection it closes | whose objection it was |
|---|---|---|
| **up to once** | *"a timer HOLDS the driver"* | the wish's, and `S04`'s friction clause |
| 🔴 **only within 30s** | *"E1 confronts the thorough driver identically to the hasty one"* | **this fulcrum's own argument for E2**, and the research's target rule |

⇒ **the drive framed this as E1-vs-E2 and the answer is neither.** it takes E1's cap and conjoins the
one property only option `B` had — a target condition — and the conjunction is strictly better than
both on the measured design table:

| | blocks? | driver **held**? | confrontation **targeted**? |
|---|---|---|---|
| **B** | until 30s elapses | 🔴 yes | ✅ yes |
| **E1** | once, everyone | ✅ no | 🔴 no |
| **E2** | never | ✅ no | n/a |
| ✅ **taken** | once, **only the rushed** | ✅ **no** | ✅ **yes** |

## 🔴 .the drive's 70% was hedged in the RIGHT direction, and still missed the answer

the `.taken` below flags that *"the drive is the party that would pay E1's cost"* and that E1
*"teaches a habit too — promise once to clear the prompt, then promise again."* **that worry was
correct and its remedy was mis-located.**

- the drive treated the habit as a reason to prefer **E2** — remove the block entirely
- ⇒ the verdict removes the **audience** instead: a driver who did the work never meets the prompt, so
  they never learn to treat it as a toll. **the hasty driver, who meets it, is the one for whom it is
  not a toll but a question**

🟡 **the transferable shape:** the drive saw a cost that fell on the wrong party and reached for
*"delete the mechanism."* the wisher reached for *"narrow who it fires on."* ⇒ **when a mechanism
harms the wrong audience, check whether the audience is selectable before you judge the mechanism.**

## 🔴 .and it answers this fulcrum's sharpest argument against itself

the section below, `🔴 the sharpest form`, reads:

> *"E1 is the timer's shape with the clock swapped for a round trip. the thorough driver is still
> refused once for work they already did."*

**that objection is answered rather than accepted.** under the verdict the thorough driver is refused
**not at all** — they promise past 30s and clear on their first attempt. ⇒ the structure of the
injustice the drive named does not survive; only the hasty driver meets the prompt, and for them a
prompt is not an injustice.

## ⚠️ .what it costs — and one fulcrum comes back from the dead

| the cost | what it means |
|---|---|
| 🔴 **the threshold returns** | `F06` was marked 🌙 **moot** on the grounds that *"there is no threshold left to configure."* **that is now false.** `F06` is un-mooted, and its fork has an operand again |
| 🔴 **`30` is a number with no defence, again** | the round re-endorses it. it was never measured, and `F01`'s con — *"`30` remains a number with no defence"* — returns with it |
| **the cheapest bypass is a `sleep`** | wait 31s, promise once with a garbage articulation, meet no prompt. under E1 everyone met it. ⇒ the gate re-admits duration as a signal about review |
| **the wish's `.what is NOT wanted`** | a reader will see *"a cleverer clock"* and must be pointed at the wait-vs-command distinction (`S13`), rather than left to find it |

⇒ **the bypass is the honest residual**, and it is bounded by what the refusal COSTS. 🔴 **the clock
does refuse the promise** — `challenge:rushed` returns `challenged: true`, the cli exits 2 — but at
most **once per slug**, only inside the window of the ask, and for **one command, no wait**. **no
driver is held for any duration, so the wish's `.the outcome` holds in full** — and its
requirement 1, *"never refused for elapsed time alone"*, is what `S13` superseded.

## .the gap this fulcrum closes

`S11` says *"keep the prompt, drop the clock"*. **the clock half is unambiguous; the prompt half is
not.** *"keep"* settles that the prompt survives; it does not settle **where it fires** — and that is
a real fork, because the prompt has two possible homes and they differ by one whole round trip.

⇒ raised rather than guessed silently, per `rule.always.itemize-the-fulcrums-you-best-guess`.

## .the fork, stated fairly

| | **E1 — the prompt blocks once** | **E2 — the prompt rides the ask** |
|---|---|---|
| where it fires | the driver's **first promise** per slug — `challenge:first`, as today minus the clock | the `--as passed` **ask**, when the review is handed out |
| the verdict on a first promise | `challenge:first` — refused, prompt rendered | `allowed`, if the articulation is present and fresh |
| the thorough driver's cost | **one extra command.** they read, repaired, wrote, promised — and are told to reflect, then promise again | **naught.** they clear on their first promise, ever |
| the hasty driver | meets the prompt at their promise, where the temptation is live | met the prompt at the ask, ~40 minutes before the temptation |
| the flow `S05` liked | preserved **literally** — the prompt arrives at the promise, which is where the wisher met it | preserved in **content**, moved earlier |
| the code change | delete the elapsed read; keep the `!report` branch | delete the `!report` branch; add the prompt to the `--as passed` emit |
| what the report is still for | the attempt count, and `F02`'s freshness operand | the same — it must still be minted at the ask |

## 🔴 .the argument each way, and neither is weak

### for E1 — the cue fires where the behavior happens

`research.selfreview-effectiveness` grades **situational cues** at `d = 0.65` — its strongest
measured lever — and the mechanism is an *implementation intention*: a cue that fires **at the moment
of the decision** it means to shape. the decision *"do I promise now or read more?"* happens at the
promise, never at the ask.

⇒ so E1 puts the strongest lever at the point of temptation, which is what the research says makes it
work. **E2 fires the cue ~40 minutes early, against a decision the driver has not yet faced.**

🟡 and it is the **smaller** change: the `!report` branch already exists and already renders the
prompt. E1 deletes the clock and keeps everything else.

### for E2 — the wish's subject is friction, and E1 keeps one round of it

`S04` is the north star: *eliminate friction but still encourage thorough self reviews*. E1 charges
**every** driver one extra command, including the one who read for forty minutes and wrote a real
articulation. that is friction with no target, which is the exact property that made the timer wrong.

⇒ and `research.selfreview-effectiveness`'s own design table says *"target interventions — targeted >
universal"*. **E1 is universal.** it confronts the thorough driver identically to the hasty one, which
is the objection `F01` recorded against option E and left standing.

🔴 **the sharpest form: E1 is the timer's shape with the clock swapped for a round trip.** the
thorough driver is still refused once for work they already did — the cost fell from 30s to one
command, and the *structure* of the injustice survived.

## .taken, and why at the time

**E1**, at 70% — and the drive states plainly that this is its least settled call after `F03`.

three reasons, in order of weight:

1. **`S05` is evidence about the prompt's LOCATION, not merely its existence.** the wisher said they
   *"kinda like the 'whats the rush?' flow"* — and the flow they met was a prompt **at the promise**.
   E2 keeps the words and changes the encounter
2. **the cue research argues for the point of decision**, and the promise is that point
3. it is the smaller change, and `rule.prefer.prevent-over-correct`'s ladder prefers the constraint
   that is already built

⚠️ **the reason confidence is 70% and not higher** is argument 1 from the other side: **the drive is
the party that would pay E1's cost**, and it just reported that the timer's real harm was the habit
it taught rather than the seconds it cost. **E1 teaches a habit too** — *promise once to clear the
prompt, then promise again* — and a driver who learns that has learned to treat the prompt as a toll
rather than a cue. ⇒ that is the same defect the round was convened to repair, one layer in, and the
drive cannot rule out that it is repeating it.

## 🟡 .the third option the drive considered and did not table

**E3 — render the prompt at the ask AND block on the first promise.** rejected: it is E1 plus
redundancy, and it shows the same text twice, which teaches a reader to skip it. ⇒ recorded so a
council does not re-derive it.

## .the rework

**clean, and symmetric** — unusually so. E1 ↔ E2 is one branch in one operation; neither direction
breaks a caller, changes an artifact on disk, or moves a cell on any other axis. ⇒ **so this is a
safe fulcrum to rule late**, and the cheapest in the round to reverse.

## .the verdict

✅ **ruled: E1, bounded** (`S13`). the prompt blocks **at most once** per slug, and **only** when the
promise lands within 30s of the ask.

⇒ the question was: **should a driver who did the work be refused once, to be shown a prompt?** the
answer is **no** — and the drive's framing made that answer un-pickable, because it offered only
*"refuse everyone once"* or *"refuse no one ever."*

🟡 **the lesson, and it is this round's THIRD instance of one pattern.** three times now a verdict has
landed on an option or refinement the fork did not contain:

| # | the fork offered | the answer added |
|---|---|---|
| `F01` | A / B / C / D | **E** — an arrears entry a self review added late |
| `F10` | A / B / C, all deletion strategies | **archive**, which no option contained |
| 🔴 `F11` | E1 / E2 | **E1 ∧ a target condition** |

⇒ **a fork is a hypothesis about the answer's shape, and this round's forks were wrong about the
shape three times.** the common failure: each fork presented its options as **mutually exclusive**
when the real answer was a **conjunction** of properties drawn from two of them. ⇒ the check is
mechanical — *"can two of these options be combined, and has anyone asked?"*
