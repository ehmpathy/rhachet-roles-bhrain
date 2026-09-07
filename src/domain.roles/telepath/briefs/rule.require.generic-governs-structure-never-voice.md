# rule.require.generic-governs-structure-never-voice

## .what

> **telepath governs the STRUCTURE of a message. it governs the VOICE not at all.**

| axis | who owns it | examples |
|---|---|---|
| **structure** | 🔮 telepath | what the message says, in what order, in how many words, where each passage sits |
| **voice** | the adopter's mascot and the role that speaks | capitalization, emoji, persona, vibe phrases, mascot lines |

the two **compose**. a telepath rule fires inside an owl's voice here, inside a seaturtle's voice
in `ehmpathy`, and inside any voice a future repo adopts — unchanged.

## .why — a generic that carries a voice cannot BE generic

this is the whole reason the role exists as a generic rather than as a section of each repo's
persona brief.

**a structural rule is repo-agnostic by nature.** *"lead with the point"*, *"a passage sits where
its subject sits"*, *"answer what they meant"* — every one of those holds for an owl, a seaturtle,
a beaver, and a corporate style guide alike. so the rule is written once and adopted everywhere.

**a voice rule is repo-specific by nature.** 🦉 belongs to this repo and 🐢 to `ehmpathy`; lowercase
is a house style, not a transfer property. the moment a generic carries one of these, the generic
stops to be adoptable — a repo that wants the structure must either take the foreign voice with it
or fork the rule, and a forked rule drifts.

⇒ **the seam is what makes the role reusable.** cross it and telepath becomes a second persona
brief, which every repo already has.

## .the cues — when → then

| when… | then… |
|---|---|
| you write a telepath rule and reach for an **emoji** in its prescription | that is voice. state the structural property instead, and let the adopter's mascot supply the glyph |
| you write *"say it in lowercase"* or *"open with the mascot"* | voice. it belongs in `im_a.<mascot>` |
| you write *"lead with the point, then the detail"* | structure. it is telepath's |
| a telepath example needs a concrete message to show the shape | **use this repo's voice in the EXAMPLE** — an example illustrates, it does not prescribe |
| a repo adopts a telepath rule and its output looks wrong | check which axis broke. wrong order = telepath's defect. wrong glyph = the mascot's |

## .the test

> **would this rule read the same if the reader's mascot were a seaturtle instead of an owl?**

- yes → **structure.** it is telepath's
- no → **voice.** it belongs to the mascot brief of whichever repo adopts it

## .examples

### 👍 good — structure stated, voice left open

> lead with the answer. the reader's first line is the one they came for; the reason follows it.

an owl obeys this in lowercase with a 🦉; a seaturtle obeys it with a 🐢. the rule did not say.

### 👎 bad — voice smuggled into a structural rule

> lead with the answer, in lowercase, prefixed with 🦉.

now `ehmpathy` cannot adopt it and leave this repo's mascot behind, so it forks — and the two
copies drift on the structural half, which is the half that was worth a shared home.

### 👍 good — voice in the example, structure in the rule

> **rule:** an error names the fix, not merely the symptom.
>
> **example:** `🦉 bummer — no route bound. bind one with: rhx route.bind.set --route <path>`

the example wears this repo's voice because an example must be concrete. the **rule** above it
wears none, so it travels.

## 🟡 .the voice row is declared in ONE cell — cite it, never copy it

a peer rule that restates the members will drift from them, and the drift is silent: no reader ever
holds two copies at once, so a copy that is short one member reads as complete.

⇒ **so every rule in this canon points at the table above rather than re-lists it.**

### the measured case — this canon drifted from its own row

walked 2026-09-07, across telepath's briefs:

| what the walk found | count |
|---|---|
| source files that **restated** the four members in `.the axis` | 18 |
| of those, copies that had **already drifted** | 2 |
| `.md.min` files that restated it | none found |

- `rule.forbid.absolutes` wrote `glyph` where the row says `emoji`
- `rule.forbid.emphasis-noise` wrote `glyph, case, or persona` — two members renamed, and
  `mascot line` dropped, so a copy short one member read as complete

⇒ **each copy was authored by someone who had just read the row, and two drifted anyway.** that is
the argument in one line: a copy must be re-checked on every edit; a reference cannot go stale.

🟡 and the mins cited correctly throughout, so the defect was invisible to a reader who boots the
role — it sat only in the source a human opens.

## 🟡 .the owed migration

the output-half generics were drafted in the `v2026_08_14.fix-standarized-speech` behavior and
currently live in `ehmpathy`'s mechanic + architect roles under `lang.prose/` — where they sit
beside `lang.tones/`, that repo's **voice** cluster.

that co-location is exactly the seam this rule draws, already observed in practice by another
repo. **their migration here is owed and not yet done**; when it happens, `lang.prose/` moves and
`lang.tones/` stays.

## .enforcement

- a telepath rule that prescribes a member of the **voice** row = **blocker** — it is voice, and it
  makes the rule unadoptable
- a mascot brief that prescribes message order, length, or passage placement = **blocker** — it is
  structure, and it will drift from the generic that owns it
- a peer rule that **restates** the voice row rather than cites it = **blocker** — measured above, and
  two of eighteen copies had already drifted
- a telepath **example** written in the adopter's voice = **false positive** — an example must be
  concrete to illustrate at all

## .see also

- `define.bhrain-repo-mascot` (repo=.this) — the voice half in this repo, and the repo-mascot vs
  role-marker split it already draws
- `rule.require.place-a-passage-by-its-subject` — a structural rule, and a worked demonstration
  that the seam holds: it prescribes position and says not one word about how the passage sounds
- `define.simplified-technical-english` (ehmpathy/mechanic) — the extant output-half overlay, which
  states this same reviewer split in its own `.exemptions`
