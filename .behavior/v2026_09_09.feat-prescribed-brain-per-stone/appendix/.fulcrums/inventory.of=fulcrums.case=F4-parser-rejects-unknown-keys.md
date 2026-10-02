# F4 — the guard parser rejects unknown top-level keys

**rework** = 🔴 dirty · **status** = 🔴 **RULED — the parser stays permissive** · **confidence** = n/a, settled

> 🔴 **the wisher overturned the best-guess.** verbatim: *"lets not"* · *"we want future compat."*
> archived at `.seeds/inventory.of=seeds.case=S2-the-fulcrum-council-settles-three.md`.
>
> ⇒ the counter-case below was the correct read, and the best-guess was not. the full record of the
> verdict is at the foot of this file.

## .the fork, stated fairly

**measured:** `parseStoneGuard` drops unknown top-level keys in silence
(`parseStoneGuard.ts:164-430`; construct at `:47-53`). a misspelled `brain:` is discarded with no
throw, no warn, and no trace at any surface.

- **reject** — a closed key set. an unknown top-level key throws at parse and names the valid keys
- **keep the drop** — unknown keys stay ignored; the typo stays silent

## .taken, and why at the time

**reject.**

case 4 is the only critipath in this space with **no natural moment of discovery**. every other sharp
path halts and teaches. this one produces a guard that looks correct at every surface — on disk, at
parse, at apply — and quietly does nothing.

⇒ a contract that accepts a key and discards it is a contract that lies.
`rule.forbid.failhide` names exactly this shape.

## 🔴 .the counter-case, stated fairly — this is the strong one

**the silent drop IS the forward-compatibility mechanism.** it is why a new guard field can be added
at all: an older parser meets `brain:` and ignores it rather than crashes.

close the key set and that property inverts. a guard that declares `brain:` becomes **unparseable**
to any consumer on an older bhrain — every repo, every route, every `.behavior` dir. the feature
that adds the field is the feature that breaks every reader that predates it.

## 🔴 .the blast radius, measured — and the measurement is PARTIAL by construction

added at self-review r4, because the counter-case above was argued and never counted.

**walked: every `*.guard` in this repo, top-level keys extracted.**

| measured | result |
|---|---|
| guard files | 12 |
| distinct top-level keys across all 12 | exactly `artifacts` · `reviews` · `judges` · `protect` |
| unknown keys that a closed set would reject **today** | 🔴 **zero** |
| guards that already declare `brain:` or `model:` | zero (`grepsafe '^(model\|brain):'` → 0 matches) |

⇒ **so the migration cost, inside this repo, is naught.** that is real evidence and it moves the call
— it did not move it to 93%, and the reason is the second row below.

🔴 **the measurement cannot reach the population that decides the fulcrum.** the risk is *"a guard
authored under a NEW bhrain, read by an OLD parser, in a DOWNSTREAM repo."* not one of those three
is in this worktree, and the scope bound forbids a read outside it.

| the question | answerable here? |
|---|---|
| do extant guards carry unknown keys today? | ✅ **yes, and the answer is no** |
| would a downstream repo's guards break? | 🔴 **no** — no downstream repo is readable from here |
| does an older parser crash or ignore on a new key? | 🔴 no — that is a **version-matrix** question, and it needs the released parsers |

⇒ the honest statement is therefore narrow: **this repo's 12 guards would survive a closed key set
unchanged.** it is not a claim that the ecosystem would, and it must not be read as one.

## .rework, and why 🔴 dirty

it changes parse behavior for **every guard file in every repo** that consumes bhrain. once shipped,
guards will be authored against it and consumers will pin to it. the reversal is a teardown across
repos, not a flag flip.

⚠️ this is the one fulcrum here whose reversal is genuinely expensive. it is flagged, not smuggled.

## .confidence, and why 65%

the lowest confidence of any call in this vision that is not `F7`.

the harm is measured and the argument for rejection is sound **in isolation**. what is not settled is
the migration: a version gate on the guard schema is asserted as the answer and has not been
designed. if that gate turns out to be costly, "warn on unknown key, never throw" becomes the better
trade — it catches case 4 loudly while it keeps forward compatibility intact.

⇒ **a warn-only variant may well be the right answer, and it was not fully weighed.** it is named
here rather than left for a reviewer to find.

🟡 **held at 65% after the r4 measurement, deliberately.** the count above answers *"what breaks
today, here"* and the fulcrum turns on *"what breaks tomorrow, downstream."* **a measurement that
does not reach the doubt does not discharge it** — to raise the number on it would convert an
unreached question into a settled one, which is the shape `rule.forbid.obfuscation` names as a
decoy needle.

## .where

`1.vision.experience.case=4.the-field-name-is-misspelled.md` — `[t4]`.
`1.vision.experience.case=_.md` — fact **F-b**, and the `⛔ forbidden` cell this would create.

## 🔴 .the verdict — RULED 2026-09-10: keep the drop

**the parser stays permissive. the key set does not close.**

> *"lets not"* … *"we want future compat."* — the wisher, verbatim (`S2`)

### what the ruling settles, as a concept

> **forward compatibility is a property of the FORMAT; a loud typo is a property of one author's
> afternoon.**

- the silent drop is the mechanism by which a guard schema can grow at all
  - a newer producer writes `brain:`; an older consumer ignores it and keeps running
  - close the set and that inverts: **the feature that adds the field breaks every reader that
    predates it**
- and the two costs are not comparable
  - a discarded typo costs **one author, once**, and is recoverable by other means
  - an unparseable guard costs **every downstream consumer on an older pin**, and is recoverable
    only by a coordinated upgrade

⇒ so the counter-case was not a caveat to weigh against the best-guess. **it was the deciding
argument**, and the best-guess had it as a footnote.

### 🟡 what this does NOT settle — `case=4` is still owed a fail-safe

⚠️ **a permissive parser does not license a silent typo.** `case=4` is a sharp critipath, and
`rule.require.experience-coverage` still demands it be shown to fail safe. what the ruling removes is
exactly one candidate remedy — **the throw** — and it leaves the others intact:

| the remedy | ruled out? |
|---|---|
| **throw** on an unknown top-level key | 🔴 **yes.** this is what "lets not" refuses |
| **warn** on an unknown key that is a near-miss of a known one | ✅ available, and it keeps the drop |
| `model:` allowlisted as a warned alias (`F2`) | ✅ available, and now **more** valuable — it is the one lever left for the most likely typo |

⇒ 🔴 **the warn-only variant this file already named as *"may well be the right answer"* is now the
only surviving answer.** it catches `case=4` loudly and keeps forward compatibility whole — which is
what the fulcrum's own 65% was reserved for.

⚠️ **`F2` rose in weight on this ruling.** the alias was a courtesy while a closed key set existed to
back it up; with the set open, the alias warn is the **entire** defense against `case=4`. the
blueprint stone should treat it as load-carrying rather than as a nicety.
