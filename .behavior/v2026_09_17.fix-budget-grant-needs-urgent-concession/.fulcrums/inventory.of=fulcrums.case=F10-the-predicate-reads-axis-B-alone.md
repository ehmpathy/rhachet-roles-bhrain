# F10 · the predicate reads axis B alone — a live lane is gated identically

- **rework** = clean · **confidence** = 55% · **status** = 🔴 **RULED — option B.** the taken option
  is reversed; see `.the verdict`

## .the fork

the walk's axis C is the lane meter — `live` · `exhausted` · `malfunctioned` · `forgiven`. **does
the gate read it?**

| option | the gate |
|---|---|
| 🔴 A | **axis B alone** — a live lane and an exhausted one are gated identically |
| B | axis B ∧ C — a grant is permitted only where a lane is actually exhausted |

## .taken, and why

**option A**, and it is the weaker half of this board.

1. **req 1 is unconditional** — *"a budget grant is refused by default."* it names no meter state,
   and `case=5.the-preemptive-pad.md` demos the refusal of a grant sought at 3/8 for exactly that
   reason: a pad taken before the bound bites is the bound removed in advance.
2. **the meter is not a fact the gate needs.** the predicate asks *was a round earned?* — a question
   about the last round's stances, never about how many rounds are left.
3. 🟡 **and option B has a real hazard**: a lane at 7/8 is not exhausted, so option B refuses a
   grant there — and the driver simply burns the eighth round and asks again. ⇒ option B converts a
   refusal into a **one-round delay**, which is worse than either alternative.

## 🔴 .the hole it leaves — `urgent × live`

a stone with a live urgent concession and a lane at **3/8** permits a grant. the driver has five
rounds it has not spent and a valid lift, so it may pad to 13/8 before the bound ever bites.

| | what the wish wanted | what option A gives |
|---|---|---|
| the bound bites | at exhaustion | at exhaustion — **unless** an urgent concession stands |
| the pad is refused | always | only where no urgent concession stands |

⇒ **the lift does not merely permit one round; it permits any number, at any meter position.** that
is the cell `case=5` does **not** cover.

🟡 **`F03`'s auto-grant successor closes it structurally** — an engine that adds exactly one round
needs no `--add N` at all, so the size and the moment both stop to be the driver's to choose. ⇒ the
hole is a property of the *lever*, never of the *predicate*.

## 🔴 .the hole is WIDER than the section above states — found at `r2` by `case=9`'s probes

the section above measures the hole on **one lane**. the dense walk probed two cells no spotlight
reaches, and both hold:

> 🔴 **one warrant funds EVERY dry lane on the stone, and it survives the lapse of every lane that
> ran.**

| the probe | what it found |
|---|---|
| `case=9` `[b5x]` — top up a **third** lane on one warrant | ✅ granted. axis B is **stone**-scoped, so the same row is re-read per grant, never spent per grant |
| `case=9` `[b6x]` — top up a lane that was **dry** through the round that lapsed the others | ✅ granted. a skipped lane re-reads no given, so no key moved for it and the stance is still its latest |

⚠️ **`[b6x]` is the sharper of the two, and it follows from `F11`'s own correction.** a stance lapses
against **its own slug's** latest `.given` (`getLiveReviewAbsorptions.ts:50-52`). a lane that was
skipped mints no given, so for that lane the stance never stops to be current — however many
generations the stone advances.

⇒ **so `case=9` `[b6]`'s redemption — *"the warrant is consumed by the round it bought"* — is true
per LANE and false per STONE.** the breadth is one generation wide **for each lane that speaks**,
and unbounded for every lane that stays quiet.

### 🟡 .one BOUND on that width, found at `r3` — a shipped verdict already caps it

the section above says *"every dry lane on the stone."* the source says **every dry lane at the
LATEST LEVEL**, and a lower level is out of reach unless the driver names it:

| the invocation | what one warrant funds | cited |
|---|---|---|
| a bare `--add N` | every dry lane at the **latest level** | `route.ts:2179-2181` · `computeBudgetTargetSlugs.ts:56-65` |
| `--level M` | every dry lane at level M — **a level already passed, too** | `computeBudgetTargetSlugs.ts:45-50` |

⇒ **`F022` fork E already forbade the blanket sweep across levels**, on the same reasons this board
argues: *"a level stays exhausted unless it is EXPLICITLY named."*

🟡 **so the residual is narrower than stated, and it is not closed.** a bare grant is level-bounded;
`--level M` re-opens the width by one deliberate word, and that word is neither a concession nor a
claim — **it is a scope flag, and the gate reads no scope** (`F09`, option B). the residual stands,
with its default case capped.

### what it changes, and what it does not

⚠️ **it does not change the taken option.** every one of the three arguments for option A holds
unchanged, and option B repairs none of this — a conjunct on the meter gates *when* a grant lands,
never *how many lanes one warrant reaches*.

⇒ **what it argues for is a `grant-size` or `grant-count` cap**, or `F03`'s auto-grant successor,
which hands out exactly one round to exactly one lane and therefore cannot be spread at all. **the
successor closes this hole and the one above with one move**, which is the strongest case on this
board for it.

## 🔴 .the obvious cap, weighed and REFUSED at `r3`

the residual above names a `grant-size` cap and does not weigh one. the obvious shape is free:
`getStoneLiveUrgentConcessionSlugs` returns an **array**, so `--add N` could cap `N` at its
`.length` — a refusal is then the cap at zero, and the whole design collapses into one number.

🔴 **the source refuses it.** the operation's last two lines are:

```ts
// dedupe: one reviewer may carry several urgent concerns, but names the human once
return [...new Set(urgentSlugs)];
```

⇒ **`.length` counts REVIEWERS, never urgent concerns.** so a cap on it is perverse:

| the stone | `.length` | the cap it would grant |
|---|---|---|
| 5 urgent concerns, all from **one** lane | **1** | one round |
| 1 urgent concern each, from **five** lanes | **5** | five rounds |

⇒ **the cap would reward a driver who spreads its concessions across lanes**, and penalize one that
concentrates them where the harm actually is. that is the opposite of what the wish's harm test
grades.

⚠️ **and the dedupe is CORRECT for the purpose it was written for** — its own comment says so:
*"names the human once."* the defect is not in the operation; it is that this design **reuses an
operation shaped for a different effect.**

✅ **the boolean read is safe, and by construction rather than by luck once stated.** a dedupe cannot
change whether an array is empty. ⇒ the gate reads `.length > 0` and must **never** read `.length` as
a count — and the design says so explicitly now, because the seam is invisible at the call site.

🔴 **this is the same shape as `F12`, `F13`, and the `r3` tool-name find:** a bound stated over a
mechanism shaped for one effect, reused where a second effect is wanted. **here it was caught before
it shipped**, which is what the pattern is for.

⇒ **the residual stands.** a sound size cap needs the **pre-dedupe concern count**, which this
operation discards — so it needs a peer operation, never a `.length`, and that cost belongs to
`F03`'s auto-grant successor rather than to this route.

## .rework, and why

**clean.** option B is one extra conjunct over a meter the operation already reads at `:2253`.

## .confidence, and why it is 55%

🟡 **it was 65% until `r2` self-review.** the three arguments for option A are unchanged and still
sound; what fell is my certainty that a **council** will accept the residual, now that the residual
is measured at its full width rather than at one lane's.

req 1 states its bar with no condition attached, and the delay hazard cuts the same way — both
favour option A. **the 45%:** a council that reads the wish's cue — *"drivers … reach for `--add N`
each time the meter runs dry"* — may conclude the wish was written entirely about the exhausted case;
and the `[b6x]` result means a single `urgent` grade can fund a pad on every quiet lane of a stone,
for the life of that stone, which reads far harder than *"it permits one extra round."*

⇒ **what would settle it:** whether a grant may be taken before a lane is exhausted, and whether
`--add N` needs a **size** cap, a **count** cap, or both (the `grant-size` residual).

## .where

`1.vision.experience.dimensions.md` §6 · `1.vision.experience.case=5.the-preemptive-pad.md` ·
`1.vision.experience.case=9.the-dense-walk.md` `[b5x]` `[b6x]` — the probes that widened it ·
`…case=F11-the-stance-lapses-on-a-reviewer-run-not-a-driver-edit.md` — the mechanism beneath `[b6x]`

## .the verdict

🔴 **RULED 2026-09-18 — option B. the taken option is REVERSED.**

> **a grant is permitted only where the lane is actually exhausted.** the gate reads axis B **∧** C.

⇒ the second reversal on this board, and the second time a row's own **taken** option lost. `F13`
was reversed on its req-7 argument; this one is reversed on the cell its own § *the hole it leaves*
names — `urgent × live`, the pad the driver may take with rounds still in hand.

### what the three arguments for option A were worth

| the argument | after the verdict |
|---|---|
| 1 — *"req 1 is unconditional"* | ✅ **held, and pointed the other way.** req 1 refuses **by default**; option B refuses **more**. the row read an unconditional bar as an argument against a second conjunct, and a second conjunct only ever narrows |
| 2 — *"the meter is not a fact the gate needs"* | 🟡 **true of the PREDICATE, and the gate is not the predicate.** `routeGuardBudget` already reads the meters at `:2253`; the conjunct costs a field it holds |
| 3 — 🟡 *"option B converts a refusal into a one-round delay"* | ✅ **the one live argument, and the council accepted its cost.** a driver at 7/8 burns the eighth round and asks again ⇒ **one wasted round, once per lane, and then the bound bites** |

🔴 **argument 3 is the row's honest cost and it survives the verdict — so state it as a deliverable,
never as a regret.** the refusal at 7/8 must say *why* it refuses, or a driver reads it as a defect:

```
├─ refused — rounds remain; a grant is for a reviewer that has run dry
│  └─ mech-rules = 7/8 rounds spent
```

### 🔴 what the verdict closes, beyond the cell it was asked about

`[b6x]` — *"one warrant funds a lane that was dry through the round that lapsed the others"* — was
this row's widest residual, and **option B closes it, by a mechanism no option-B argument named:**

```
option B grants only to an EXHAUSTED lane
   → a granted lane has budget again, so it RUNS next round
      → it mints a .given
         → its own stance lapses
```

⇒ **the warrant is consumed by the round it buys, per lane, and now for every lane it can reach** —
which is `case=9` `[b6]`'s redemption restored in full. under option A the exception was the **live**
skipped lane, which mints no given and is grantable anyway; option B refuses exactly that lane.

⚠️ **this is argued, not verified.** it rests on *a topped-up lane runs next round*, which is true of
the level it sits at and is **not** re-derived from source here. ⇒ **the criteria stone owes the
clamp**: grant an exhausted lane, re-arrive, assert its stance has lapsed.

### 🟡 what survives

- **`[b5x]` is narrowed, not closed.** one warrant still funds **several** lanes where several are
  exhausted at the same level. the reach is stone-scoped; only the eligibility narrowed
- **the size residual stands.** `--add N` takes any `N`, and § *the obvious cap, weighed and REFUSED*
  shows why `.length` cannot bound it. that cost still belongs to `F03`'s auto-grant successor
- 🟡 **req 2's letter-vs-intent gap is smaller and not gone.** a stance lapses per `.given`, so an
  exhausted lane's stance is still stale by a generation until the grant lets it run

### .what moves

| artifact | change |
|---|---|
| the gate | a second conjunct — the target lane's meter must read exhausted |
| the refusal copy | a **second refusal reason** — *rounds remain* — distinct from *no warrant stands* |
| `case=5.the-preemptive-pad.md` | ✅ **unchanged** — it already demos this refusal, and its `[tn]` sketch is now the ruled path rather than an argued one |
| 🔴 `case=13.the-pointless-permission.md` | **the cell flips.** `driver × urgent × live` was **permitted**; it is now **refused**, and the demo's whole point — *a permission that buys naught* — becomes a refusal that says so |
| `1.vision.experience.case=_.md` | the census shifts: every `live`-meter cell is refused, whatever B reads |
