# F03 · the urgent lift goes to the BOT; the human is warned, never asked

- **rework** = clean · **confidence** = 88% · **status** = best-guessed

🔴 **one of the two rows a council should read first.** it reverses what a shipped surface does today.

🟡 **the header read `60%` until 2026-09-18**, while this file's own confidence table ended at `88%`
four sections down. a stale header on the one field a council sorts on is the drift
`rule.always.itemize-the-fulcrums-you-best-guess` exists to prevent, so it is repaired in place
rather than noted.

## .the fork

`0.wish.md` req 2 says the refusal is *"lifted only by an explicit urgent concession on the LAST
round."* **lifted for whom?**

req 7 says a human is never gated. so if the lift in req 2 were also the human's, req 2 would grant
naught — a human needs no lift. ⇒ **the lift must be the BOT's**, or the requirement is empty.

**but that contradicts what ships today:**

| surface | what it does with a live urgent concession |
|---|---|
| the `reviewed?` judge, `route.ts:1300` **and** `:1562` | *"please **ask your human** to"* + the budget command — **two** render sites |
| the drive halt, snap `case1c` (`:115-146`) | *"spend your own lever first, **then ask a human**"* |
| 🔴 `getStoneLiveUrgentConcessionSlugs.ts:6-14` | *"an urgent concession's one honest remedy is a **HUMAN budget grant** … a `better` concession … its remedy is the driver's **OWN top-up**"* |
| `define.invariant…urgent-earns-budget` §invariant | *"≥1 live urgent concession ⟹ needs increased budget — **warn** the human this PR"* |
| its own table, line 34 | *"the human **grants** more"* · *"warned, this PR"* |

## 🔴 .but the RENDER disagrees with the docblock — and the render is what ships

read byte for byte from the pinned snapshot, **both** halts label the budget lever the same way:

| case | the remedy block, verbatim |
|---|---|
| `case1b` — `better` | `what to do — yours to run, no human needed` → `increase budget — **yours to spend**` |
| `case1c` — `urgent` | `spend your own lever first, then ask a human` → `increase budget — **yours to spend**` · `approve as-is — a human must grant` |

🔴 **so today the driver already spends the budget lever in BOTH severities.** what an urgent
concession changes is **who grants the APPROVAL**, never who tops up the budget.

⇒ **this row's claim is therefore mostly already shipped.** the docblock's *"an urgent concession's
one honest remedy is a HUMAN budget grant"* is contradicted by the halt the driver actually reads,
`:137` — and a driver obeys the render, never the docblock.

🟡 **what remains genuinely reversed** is narrow: `case1c:125` says *"this round is owed a human's
grant"*, and under this design the round is owed **no** human at all — the live urgent concession is
itself the warrant. the human keeps the **approval**, which this design does not touch.

## .taken, and why

**the bot takes the round; the human is warned this PR.**

three reasons, in order of weight:

1. 🔴 **req 2 is empty otherwise.** a lift that only a human may use is not a lift, since the human was
   never gated (req 7). the requirement only has content if it names the bot's path.
2. ⚠️ **WITHDRAWN at `r1` self-review.** this argued that the invariant contradicts itself — line 22
   says `warn`, line 34 says `grants` — and that the formal line should hold. **a re-read shows no
   contradiction.** line 22 reads *"needs increased budget — warn the human this PR"*: it names the
   **notification** and is silent on **who increases**. line 34 supplies that actor. the two compose,
   and the invariant says `grants` with one voice. ⇒ this fulcrum rests on arguments 1 and 3 alone.
3. **the auto-grant dream argues the same direction, from the wisher's own words** — *"if the last
   round had an urgent one, automatically allow one more"* — which removes the human entirely. ⇒ this
   fulcrum is a **half-step toward a destination the wisher already named**, never a departure from it.

🟡 **what the human keeps:** the warn, this PR. a run of urgent grants stays countable and visible, so
the abuse the invariant's counter-argument names (*"grade every concession urgent to buy rounds"*)
remains socially bounded, exactly as today.

## .rework, and why

**clean.** it is a copy change on two halts plus one branch in the judge. no caller is hardened
against either phrasing, and the snapshots that pin them are the artifact the change updates.

## 🔴 .the decisive witness — the newest copy, and it states this row verbatim

`setStoneAsConcernAbsorbed.ts:102-113` is the error a driver reads when they omit `--severity`. its
own comment dates it **2026-09-15** — the most recent statement on the question — and it says:

```
--severity urgent  — a shipped harm (security | safety | monetary | reputation |
                     behavioral); earns budget, warns the human
--severity better  — code idealism / maintenance; the floor, never earns budget
```

🔴 **"earns budget, warns the human"** — that is this row's claim, word for word, in copy a driver
reads. the bot's concession **earns the budget**; the human is **warned**, never asked.

⇒ and `better` — *"the floor, never earns budget"* — is `F04`'s premise in the same breath.

🟡 **a second fact from the same file, new to this route:** `--severity` is **forbidden for a
dispute** (`:92-101`) — *"a dispute concedes naught, so it has none."* ⇒ a disputed stance can never
carry `urgent`, so the predicate's `status === 'conceded' && severity === 'urgent'` filter is not
merely correct, it is **unfalsifiable by construction**. no dispute can ever forge the lift.

## .confidence, and why it is 88%

🔴 **it went 70% → 60% → 78% → 88% across one `r1` self-review**, and that swerve is itself a result:

| pass | what changed |
|---|---|
| authored | 70%, on three arguments |
| `r1`, first look | **60%** — argument 2 fell as a misread, and the docblock was found against |
| `r1`, second look | **78%** — the pinned **render** was read; it says `yours to spend` in the urgent case |
| `r1`, third look | **88%** — the `--severity` error copy was read; it says *"earns budget, warns the human"*, dated 2026-09-15 |

**what holds it up now:**

1. **argument 1, unchanged and strong** — if the urgent lift were the human's, req 2 would CONSTRAIN
   the human while req 7 unconstrains them; a contradiction inside the wish. under the bot read,
   req 2 is the bot's path and req 7 is the human's, and both stand
2. 🔴 **the shipped render already agrees** — `increase budget — yours to spend`, in the urgent halt.
   this row keeps that; it does not reverse it
3. **the auto-grant dream argues the same direction, from the wisher's own words**

**the 12%:** the docblock of the very operation the gate calls says the opposite in plain words, and
`case1c:125` says *"this round is owed a human's grant"*. `F032` on the predecessor board settled a
render two weeks ago, and this snapshot case is named `case1c … (F028/S14)` — a fulcrum AND a seed
already bear on it.

⇒ 🔴 **the honest statement is that the SHIPPED SURFACES DISAGREE WITH EACH OTHER**, and the tally is
now lopsided:

| for the bot | against |
|---|---|
| `setStoneAsConcernAbsorbed.ts:109` — *"earns budget, warns the human"*, **2026-09-15** | `getStoneLiveUrgentConcessionSlugs.ts:7-9` — *"one honest remedy is a HUMAN budget grant"* |
| `formatRouteDriveHalts` snap `case1c:137` — *"increase budget — yours to spend"* | snap `case1c:125` — *"this round is owed a human's grant"* |

🔴 **and `case1c` contradicts ITSELF, twelve lines apart** — its reason line says a human's grant is
owed, its remedy block hands the driver the command as their own. ⇒ **this row does not reverse a
settled rule; it PICKS A SIDE in a live disagreement**, and it picks the side that is both newer and
the one a driver actually obeys.

⇒ **what would settle it:** the wisher says whether an urgent concession earns the bot a round, or
earns the human a decision.

## 🔴 .corroborated by an INDEPENDENT reviewer at i004 — and it carries a deferral clamp

review `i004` r010 `enroll-impl-behavior-intent` reached this row on its own, named it its single 🔴
item, and asked it be surfaced *before this stone passes*. it adds two facts the board did not carry.

**1. a THIRD contradictory surface, un-named here until now.**
`formatRouteDriveMixedHalt.ts:89` prints *"spend your own lever first, then ask a human"* as its
header, then lists *"increase budget — yours to spend"* as a remedy line **twelve lines beneath it**.
⇒ that is `case1c`'s self-contradiction reproduced at a **second** render, so the disagreement is not
one snapshot's accident.

**2. 🔴 a deferral clamp — the actionable half, owed whichever way the council rules.**

> `formatRouteDriveHalts.test.ts:396-486` — both its `[case1]` and `[t1]` mixed-halt cases use a
> **plain** (non-concession) exhaustion reason. the cell that manifests the contradiction is a
> **live urgent** concession, and no test or snapshot pins it.

⇒ so a future fix here, **or further drift**, would be caught by naught. r010's own words:

> *"If it stays deferred, I'd add a test that pins today's (admittedly contradictory) text so the
> drift is visible rather than silent."*

🟡 the cell exists under either verdict, so the clamp is **not contingent on the council's call** —
it is owed by the criteria stone regardless, and it is recorded here rather than left to memory.

## 🔴 .the conflict reaches a committed INVARIANT BRIEF — found at i005 by r011

a **second** independent reviewer, `enroll-impl-arch-defects`, reached this row on its own pass and
named the one surface the board had missed: **the disagreement is not confined to render copy. a
declared invariant asserts the other side, and naught marks it superseded.**

`define.invariant.review.peer.judge.urgent-guides-the-budget-ask` states, as law:

```
reviewed?  holds ∧ live urgent concession   ⟹  judge prints the budget-ask guidance
```

and its own table spells that guidance out as *"please ask your human to … route.guard.budget --add N"*.
its `.enforcement` makes the absence a **blocker**.

🟡 **I verified all three surfaces directly rather than on the reviewer's word:**

| the surface | what it says | in this diff? |
|---|---|---|
| `define.invariant.…judge.urgent-guides-the-budget-ask` `.what` + `.why` table | the remedy is **a human's grant**; the judge must name the human | 🔴 **no** — it predates this behavior |
| `route.ts:1571-1578` (the `reviewed?` judge halt) | *"this round is owed a human's grant"* → *"please ask your human to"* | 🔴 **no** — untouched, confirmed by `git diff` |
| `formatBudgetGrantRefusalLines.ts:156,197,232` (the new gate) | *"yours to run, no human needed"* | ✅ **yes** — this diff authored it |

⇒ **two artifacts of this repo now assert opposite policy for one cell**, and one of them is an
invariant — the strongest form of claim the repo makes. a maintainer who greps for the policy finds
two ruled answers and no supersession marker between them.

### 🔴 what this adds to the ASK

the question the council must settle is unchanged. **what it must also DO once ruled has grown:**

> whichever way `F03` is ruled, the **invariant brief that loses must be amended or retired in the
> same breath**. to rule the copy and leave the invariant in force is to leave the contradiction in
> the one place a reader trusts most.

🟡 this is a fact about the verdict's **scope**, never an argument for either side — recorded so the
council's act is complete rather than partial.

## .where

`1.vision.yield.md` § *what is awkward* · `1.vision.experience.dimensions.md` §3 ·
`1.vision.experience.case=2.the-lift.md` ·
`.reviews/peer/…i004…r010._.taken.by_self.enroll-impl-behavior-intent.md` (the corroboration, and
why a `.taken` declined to close it) ·
`.reviews/peer/…i005…r011._.given.by_peer.enroll-impl-arch-defects.md` (the invariant-brief conflict)

## .the verdict

_not yet ruled._
