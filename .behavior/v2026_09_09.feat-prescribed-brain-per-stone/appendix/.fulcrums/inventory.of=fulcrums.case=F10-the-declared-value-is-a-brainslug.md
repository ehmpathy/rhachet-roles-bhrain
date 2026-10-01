# F10 — the declared value is a rhachet brainslug, and the hook translates it for `/model`

**rework** = clean · **status** = 🔴 **RULED — the value is the `/model` argument (#3)** · **confidence** = n/a, settled

> 🔴 **the wisher overturned the best-guess.** verbatim: *"for now, lets use the brain-cli's own
> /model argument"*. archived at `.seeds/inventory.of=seeds.case=S2-the-fulcrum-council-settles-three.md`.
>
> ⇒ the counter-case below won, and it won on the ground the counter-case named. the full record of
> the verdict is at the foot of this file.

> raised at self-review r1. **the vision named one vocabulary where three meet at this field.**

## .the fork, stated fairly

`brain:` takes a value. three vocabularies could supply it, and they are not the same strings:

| # | vocabulary | example | who reads it |
|---|---|---|---|
| 1 | rhachet **brain-cli** | `claude` | `enroll --brain`, `getSupportedBrainCommand` |
| 2 | rhachet **brainslug** | `anthropic/claude/sonnet` | `review --brain`, `ActorOndisk.brain`, `getBrainSlugFull` |
| 3 | the brain-cli's **`/model` argument** | `claude-opus-5[1m]`, `opus` | the slash command the wish dispatches |

⚠️ **the wish declares in #3 and the engine records in #2.** its own example is
`rhx clone say @:driver --what '/model <brainslug>'` — the word is *brainslug*, the example value is
`claude-opus-5[1m]`, and that is a claude-code model name, not a rhachet brainslug.

⇒ so the question the vision never put: **which vocabulary does the guard declare, and who translates
to #3 before `/model` is typed?**

## .taken, and why at the time

**the guard declares #2, a rhachet brainslug. the hook translates to #3 at dispatch.**

- `case=3` and `case=6` both compare declared against **live**, and live comes from rhachet's own
  record (`ActorOndisk.brain`, `clone whoami` per `F5`) — which is #2. **a guard that declares #3
  cannot be compared against it at all without the same translation, one step later and once per
  read rather than once per dispatch**
- #2 is the only one of the three with a **normalizer already shipped** — `getBrainSlugFull` /
  `getBrainSlugParts`, and `findActorBrainInAllowlist` already compares through it
- #2 is the vocabulary the extant per-review precedent uses (`review --brain`), so a guard author
  who has written a peer-review line already knows it (`F2`)
- #1 is ruled out outright: `claude` names a CLI, and every stone in a route runs the same CLI. it
  cannot express the distinction this feature exists to make

## .the counter-case, stated fairly

**the wish wrote #3, and a guard author types what they last typed into `/model`.** every argument
above is an argument from the engine's convenience; the counter is an argument from the hand at the
keyboard, and `rule.prefer.defaults-match-common-case` sides with the hand.

⇒ and the translation is not free. `#2 → #3` needs a **map** that rhachet does not ship: naught
converts `anthropic/claude/opus` into whatever string this brain-cli's `/model` accepts today. a
build that assumes the two coincide will be wrong the first time a brain-cli renames a model.

⚠️ **that map may not exist to be written.** the `/model` argument set is the brain-cli's, it is
undocumented here, and it changes without our release. if so, `F10` inverts: the guard declares #3,
and the **comparison** carries the translation instead — which is `F5`'s problem, not this one's.

## .rework, and why

**clean.** it is which string a guard field holds and where one translation sits. no caller is
hardened against either choice, and no later stone builds on it yet — the reversal is a rename of a
value plus a move of one transform.

⚠️ it is clean only until guards in **downstream repos** carry values in the rejected vocabulary. so
it wants an answer at the blueprint stone, before bhuild's templates stamp aught.

## .confidence, and why 65%

low, and honestly so. the call rests on a premise i could not verify: **that a `#2 → #3` map is
writable at all.** i read `getBrainSlugFull` and `getBrainSlugParts`, and neither targets `/model`;
i found no surface in rhachet that maps a brainslug to a brain-cli's model argument.

⇒ if that map is absent and unwritable, the counter-case wins outright rather than narrowly. **this
is the one fulcrum here whose answer is a research question, not a preference** — and the research is
one read of the brain-cli's `/model` surface, which the blueprint stone is equipped to do and this
stone is not.

## .where

`1.vision.experience.case=3.the-slug-the-brain-rejects.md` ·
`1.vision.experience.case=6.the-brain-is-already-right.md` — both compare declared against live, so
both depend on which vocabulary the declaration holds.

## 🔴 .the verdict — RULED 2026-09-10: the value is #3, the brain-cli's `/model` argument

> *"for now, lets use the brain-cli's own /model argument"* — the wisher, verbatim (`S2`)

### what the verdict settles, as a concept

> **a prescription is written in the vocabulary of the tool that executes it.**

the value in the guard is handed to `/model` **verbatim**. no translation layer exists, so no
translation layer can be wrong, and no map has to be kept in step with a brain-cli's release cadence.

⇒ 🔴 **the 65% is discharged by the verdict rather than by the research.** the confidence was low
because a `#2 → #3` map might not be writable at all — and the verdict removes the need for one. the
open research question that sat behind this fulcrum is **closed by the design change**, not by an
answer.

🟡 *"for now"* is the wisher's own bound. it fixes the vocabulary **today** and makes no claim that
the brainslug reading is wrong forever — a later route may add the map and move the field to #2.

### 🔴 what moves downstream — three consequences the blueprint stone inherits

| what changes | from | to |
|---|---|---|
| the guard's example value | `anthropic/claude/opus` | `opus` / `claude-opus-5[1m]` — whatever `/model` accepts |
| where a translation sits | the hook, before dispatch | 🔴 **nowhere at dispatch** — the string passes through |
| where a translation sits **at COMPARE** | nowhere | 🔴 **the compare**, if `F5` ever lands |

⚠️ **the third row is the one that carries a cost, and this file predicted it:** *"if so, `F10`
inverts: the guard declares #3, and the comparison carries the translation instead — which is `F5`'s
problem, not this one's."* that is now the state of affairs.

⇒ so `case=3`'s and `case=6`'s compares change shape. they compare a **`/model` argument** against
whatever `clone whoami` would report, and rhachet records brains in #2. **the normalizer this repo
cited — `getBrainSlugFull` — normalizes within #2 and does not bridge #2 to #3.**

🟡 **that is a real transfer of difficulty, not its removal**, and it lands squarely on `F5`. it is
also an argument *against* `F5`: with the value in #3, a live-brain compare needs a map that the
`declare rather than detect` build needs not at all.

### what stays true

`#1` — the brain-cli name — remains ruled out on its own merits: every stone in a route runs the same
CLI, so `claude` cannot express the distinction this feature exists to make.
