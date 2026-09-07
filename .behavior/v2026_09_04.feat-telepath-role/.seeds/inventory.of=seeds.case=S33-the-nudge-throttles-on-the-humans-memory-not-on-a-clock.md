# S33 · the nudge throttles on the HUMAN'S MEMORY — not on a clock

## .said

verbatim, 2026-09-06, after the onStop reminder was made generic and de-shouted:

> sweet. and this nudge fires a max of once per 15min?

I answered it as a question — described the current cadence, laid out a case for and against a
throttle, and starred an ask. the correction:

> i already said i want a throttle, why have you asked ;

then, on the size of the window:

> and lets make it a 10min throttle

then, on the whole mechanism:

> oh. how about this. can we make it based on the transcript? if there's been more than 5min passed since the last time a human spoke, no need to do it. (i.e., if its been autonomous for more than 5min, it does need to fire)

> that way its based on the expected cache-duration of the human's memory of the tree

> 5min, its warm. more than that? needs a refresh

and, before any of it was built:

> lets archive this seed before you continue

## .settled

### 1 · a question that names a parameter is an ASK

*"fires a max of once per 15min?"* holds a number. a question that carries a **specific value**
does not ask what the value is — it proposes one.

⇒ **that is the typo-grant shape of `rule.forbid.genie-answers`, at the level of a speech act
rather than a word.** I served the interrogative form and refused the concept, then spent a
reply on a case-for and a case-against that the wisher had already settled by the number.

🟡 **and the clamp I reached for made it worse.** `rule.require.answer-what-they-meant` prescribes
*"act, and state the read in one line"* for exactly this case — a clean rework. I put a starred
ask instead, which is the **interrogation grant**: the shape the same rule names as *worse than
the other five, because a question spends the scarcest resource in the loop.*

⇒ so the rule was in context, booted, and correct, and it was looked past. the tell was available:
**the rework was clean.** a throttle is ~20 lines and reversible, so there was no fulcrum to raise.

### 2 · the window is the HUMAN'S memory, not the nudge's cadence

> verbatim: *"that way its based on the expected cache-duration of the human's memory of the tree"*

| the throttle asks | what it keys off |
|---|---|
| a **clock** throttle | *how often is too often?* — the nudge's own last fire |
| **this** throttle | *when did the reader go cold?* — the human's last utterance |

⇒ a clock throttle is a guess at an annoyance threshold. this one is a **model of the reader**,
and it is the same claim `rule.require.elucidation` already makes about a passage: the light
must reach where the peer stands.

### 3 · the direction inverts the obvious one — AUTONOMY is what earns the nudge

| the human last spoke | their memory of the tree | the nudge |
|---|---|---|
| **< 5 min** ago | **warm** — they hold the context | **skip** |
| **≥ 5 min** ago | **cold** — an autonomous stretch ran without them | **fire** |

> verbatim: *"5min, its warm. more than that? needs a refresh"*

🟡 **the naive throttle suppresses the nudge when the NUDGE fired recently. this one suppresses it
when the HUMAN spoke recently** — so a long autonomous stretch, which is precisely when a reader
has lost the thread, is what makes the summary owed rather than what makes it redundant.

⇒ and it repairs the measured defect exactly: the reminder fired on three consecutive turns with
the wisher present the whole time. under this rule not one of those three fires.

### 4 · 🟡 the spec's first clause contradicts its own parenthetical, and the gloss holds

as said: *"if there's been **more** than 5min passed since the last time a human spoke, no need to
do it"* — then, in the same breath, *"(i.e., if its been autonomous for more than 5min, it **does**
need to fire)"*.

the two are opposite verdicts on one condition. **the parenthetical is the intended one**, and the
third utterance settles it beyond doubt. the first clause reads as `more` where `less` was meant.

⇒ recorded rather than tidied, per `rule.always.archive-the-wishers-words-verbatim` — *"a tidied
quote is already a paraphrase"*. **the disagreement is the evidence that the parenthetical was the
clarifying half**, and a cleaned `.said` would have deleted the one signal that settles the read.

## .landed

- `src/contract/cli/telepath.ts` — the hook face reads `transcript_path` from the Stop payload
- `src/domain.operations/telepath/` — the transcript read + the warm/cold predicate
- `src/domain.operations/getFsErrorCode.ts` — lifted out of `learn/` on its second consumer
  (`rule.prefer.most-common-denominator`: lift immediately on proven reuse)

## .see also

- `S32` — the round before this one, on the same hook: substance before density, and the de-shout
- `rule.forbid.genie-answers` — the literal grant and the interrogation grant, both instanced here
- `rule.require.answer-what-they-meant` — *"act, and state the read in one line"*, the move I skipped
- `S22` — *"archive the seeds FIRST"*, which is why this file precedes the build
