# define.purpose-first

> **establish why it needs to be said at all. THEN measure the prose against how directly it
> fulfills that.**

two acts, in order, and **the second is the one no other rule performs**.

## .the two acts

⇒ the pair — establish before a word exists, then measure what exists against it — is declared in
`rule.require.purpose-first` and is not restated here.

what that rule cannot carry, and this file does: the purpose becomes a **yardstick** rather than a
prompt. a prompt is consumed once; a yardstick is applied to every line — which is what parts this
from *"think before you write"*.

## .the measure has four grades, and `displaced` is where good authors lose

| grade | the passage | the repair |
|---|---|---|
| direct | goes straight at the purpose | leave it |
| a lap | reaches the purpose the long way | cut to the line that carries it |
| displaced | serves a **different** purpose, and serves it well | **cut it, or move it to the passage whose purpose it serves** |
| none | serves no purpose you can name | cut it |

**a `displaced` passage is invisible without step 1.** it is well-made, true, and worth a read —
so every rule that grades a **property of the words** passes it. only a stated purpose reveals that
it is aimed elsewhere.

⇒ that is the whole argument for the rule: **every other rule grades the words; this grades whether
they are aimed at the target.**

## .why "directly" and not merely "fulfills"

the wisher's word is exact. a passage that reaches its purpose **by a lap** is a violation, even
where each word survives every other rule.

⇒ and it supplies `rule.forbid.subversive-prose` its baseline: **elongation and encirclation are
defined relative to a purpose.** a rule that never establishes one has no ground on which to call a
passage long — *long compared to what?*

🟡 so purpose-first is not merely first in sequence. **it is what makes the later rules measurable at
all.**

## .the demos

### 👎 bad — a section that exists because a template named it

> ## .the aha
>
> *the reviewer most likely to overflow is the reviewer whose job is to prevent the overflow.*

⇒ the purpose was never established — a template asked for `.the aha`, so a header appeared and prose
was produced to fill it. **the passage's purpose is the header's existence** — grade *none*.

### 👍 good — the purpose established, the section earned or dropped

> ## .the constraint the design turns on
>
> the reviewer's subject grows with the artifact it grades: **915.3k tokens, 94.3% of the gate**.

**purpose: warn a reader who will size the reviewer's scope.** the passage now has a target, and it hits
it in one line — or, had there been no such reader, the section is written `none` and dropped.

---

### 👎 bad — grade *displaced*

a `.what` section that opens with three paragraphs on how the concept was discovered.

⇒ true, well-made, and its purpose is *provenance* — while the section's purpose is *tell the reader
what this is*. **two purposes, one home.** no brevity rule fires, because each sentence is tight.

### 👍 good — the passage moved to the purpose it serves

- the `.what` states what it is, in one line
- ⇒ the discovery story moves to `example=$id.md`, whose declared purpose **is** provenance

**the words did not change. their home did.**

---

### 👎 bad — the purpose assumed rather than established

> *"here is a summary of the reviewer."*

⇒ a summary for whom, and to decide what? with no answer, the author writes what they know,
and the reader gets a passage aimed at the author's inventory.

### 👍 good — the purpose named, then the prose measured against it

> **purpose: an adopter must decide whether to wire this reviewer onto their guard.**
>
> - it costs 2 files and 0 lines of logic
> - it reads `.behavior/**/*.md`, never `src/`
> - ⇒ it blocks on overflow rather than a false `0/0`

**three lines, and every one of them is a fact the decision turns on.**

## 🟡 .the boundary

| a violation | not a violation |
|---|---|
| a section that exists because a template named it | a section whose purpose you can state in one line |
| a passage aimed at a different purpose than its home's | a passage moved to the home whose purpose it serves |
| a purpose stated **after** the prose, to justify it | a purpose stated before, then revised as the concept sharpens |
| *"a summary of X"* as the purpose | *"so a reader can decide Y"* as the purpose |

**a purpose is named for the READER'S decision, never for the passage's subject.** *"to explain
the reviewer"* is a subject; *"so an adopter can decide whether to wire it"* is a purpose — and only the
second can grade a line.

## .where it sits in the canon

**it fires first**, and its output is the input every later rule measures against.

⇒ the full order is declared once, in the role's `readme.md`.

## .see also

- `rule.require.purpose-first` — the trait
- `rule.require.elucidation` — the root purpose this establishes an instance of
- `rule.forbid.subversive-prose` — elongation, defined relative to the purpose this names
- `rule.require.distillation` — the next rule in the pipeline
