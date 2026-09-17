# seed S9 — level unlock is a latch

**said** — 2026-09-16, by the wisher · **kind** — 🔴 **a design change, plus its rationale**

## .said — verbatim, untouched

> *"that way we keep the train moving, cause we know if its terminal, l3 is up regardless of
> what happens to the l1 reviews"*

> *"lets make it a latch though. as soon as l3 begins to run, it never stops the runs."*

> *"so even if l1 is restored, l3 doesnt stop"*

> *"right, the only operation that resets this is --as rewound, as expected"*

⚠️ `.said` is verbatim per `rule.always.archive-the-wishers-words-verbatim` — typos and all.

## .settled

**level unlock is a LATCH.** once a level pours, it stays open for every later pass,
whatever the levels below it do next. `--as rewound` is the one lever that resets it.

⇒ `define.invariant.review.peer.level-unlock-is-a-latch`.

## 🔴 .the rationale arrived FIRST, and the design change followed from it

the order matters here. the wisher first stated the *why* — **keep the train in motion** —
as a description of behavior they believed already held. the examination that followed
showed it held only for `exhausted`:

| l1's terminal verdict | can l1 change later? | was l3 safe? |
|---|---|---|
| `exhausted` | ❌ no — hash-independent, budget-locked | ✅ yes |
| `malfunction` / `constraint` | ✅ yes — re-runs every pass, **spends no round** | ❌ **no** |

⇒ **the wisher's model was the correct one and the code was short of it.** so the change
was not a new requirement; it was the repair that makes an already-stated principle true.

⚠️ and the fourth quote closes it: the reset was specified before it was asked for, which
is what let the implementation reuse `passage.jsonl`'s extant rewind cascade rather than
write reset logic that could drift.

## 🔴 .the term probe that followed — and it found a real defect

the wisher then asked *"so why even use Poured if we have Unlocked?"*

that is `rule.forbid.domain-term-synonyms` applied from the outside, and it landed: the
first implementation recorded a row named **`poured`** on the condition **`canRun`**, which
IS "unlocked". name and recorded fact disagreed, so `poured` genuinely was a second word
for `unlocked`.

⇒ repaired to a genuine pour — `canRun && toPour.length > 0`. the two words now name two
facts:

| | `unlocked` | `poured` |
|---|---|---|
| tense | **now** — may this level run? | **past** — did it ever release its reviewers? |
| kind | derived, recomputed each pass | recorded once, durable |
| relation | the gate's **output** | an **input** to the gate |

## 🟡 .the name corrections, and the bound the wisher drew on their own metaphor

- **`levelsPoured`, never `pouredLevels`** — `rule.require.order.noun_adj`, so the noun
  prefix groups in autocomplete
- *"lets lean into the metaphore"* — the pour vocabulary carries the LATCH terms
- 🔴 **and then the bound**: *"UnrunUnlocked is a little clearer, no?"* — against a
  proposed `getLevelsPourableUnpoured`

⇒ the third is the sharpest. the lean-in has a limit, and the wisher found it: `pourable`
/ `unpoured` uses one root twice and reads circular, where `unrun` / `unlocked` states two
different facts. **a metaphor earns the vocabulary it makes clearer and no more** — so
`isReviewLevelPourable` was reverted to `isReviewLevelUnlocked`, because the gate already
had a good word and only the latch was new.

## .landed

- `define.invariant.review.peer.level-unlock-is-a-latch` — the invariant
- `PassageReport.status` gains `'poured'`; `getAllPassageReports` makes it sticky per
  (stone, level) and clears it on rewind, with cascade
- `getStoneGuardLevelsPoured` — the reader
- `isReviewLevelUnlocked({ …, levelsPoured })` — the gate, latch read first
- `blackbox/driver.route.peer-level-unlock-latch.acceptance.test.ts` — the journey
- `5.3.verification.yield.md` — the round that produced it
