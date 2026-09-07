# rule.require.timeless-lessons

## .what

> **a brief distills a CONCEPT. the chronicle that led to it is a DEMO of that concept, and it
> belongs in a file of its own.**

```
$brief.md                     # the concept — fundamental, focused, free of episode
$brief.example=$slug.md       # one demo — the dated, sourced episode that shows it
```

a concept is timeless by nature; a demo is dated by nature. **the rule is not "delete the
history" — it is "do not mix the two in one file."**

## .why — the mix is what makes a brief rot, not the history itself

the librarian's ontology already draws this line
(`kno101.primitives.1.ontology.[article].frame.docs_as_materializations`): **concepts** are
patterns in reality, **instances** are the atoms of experience, and a **document** materializes a
concept by an arrangement of instances. a demo is the archetype whose job is *"how this instance
exemplifies the concept"* (`kno201.documents._.[catalog]`).

so a brief that carries its own episode inline is **two archetypes in one file**, and each one
degrades the other:

| the harm | how it lands |
|---|---|
| **the concept loses focus** | a reader who wants the pattern must sift the episode out of it, on every read |
| **the demo loses its citation** | an episode buried in prose has no date, no repo, no path — it stops being checkable |
| **the file grows without bound** | each new round adds an episode; the concept does not get longer |

⇒ **eject the demo and both improve.** the concept becomes the fundamental claim it was meant to
be, and the episode becomes evidence a reader can verify.

## .the test — strip and re-read

> **strip every temporal and session-bound word. does the claim still stand as a statement of what
> IS and why?**

- yes → it is the **concept**. it stays
- no → it is a **demo**. eject it to `example=$slug.md`, dated and sourced
- it was neither — it merely gestured at a conversation → **not a demo either.** a demo has a
  date, a repo, and a path; a gesture has none, so there is naught to eject

## .the smells — each is a demo trapped inside a concept

| smell | what it actually is |
|---|---|
| *"recently"*, *"this time"*, *"we just"*, *"as we saw above"* | an episode with its citation stripped |
| *"we decided"*, *"we deliberately"*, *"we chose not to"* | a deliberation the reader did not attend |
| *"as discussed"*, *"per the conversation"* | a source that cannot be dereferenced |
| *"an earlier draft of this brief said…"* | 🔴 the document's own version history — not even a demo. delete it |
| *"yet"*, *"for now"*, *"not … yet"* | a schedule, and the schedule expires |
| a term named **only** to say we do NOT adopt it, with no durable reason | the rejection outlives the reason for it |

🟡 **the *"an earlier draft"* smell is the one with no ejection.** a brief's account of its own prior
drafts is archaeology, and archaeology has no `example=` home — it goes to git history
(`rule.forbid.chronological-accretion`, ehmpathy/mechanic).

## .what a demo owes, once ejected

a demo is only worth its file if it is **checkable**. it carries:

- the **date**, the **repo**, and the **path or branch**
- what happened, in the shortest form that stands alone
- the **cost** — what the episode actually spent, which is what makes it evidence rather than anecdote
- a pointer up to the concept it demonstrates

⇒ that is `rule.require.persist-domain-term-evidence` (architect), applied to a brief rather than
a term.

## 🟡 .a `.reason` file IS an ejection target — do not eject from it again

a term cluster splits along exactly this line already:

| the file | archetype | holds |
|---|---|---|
| `term=$x._.choice._.md` | **the concept** | the chosen word, its kind, its forbidden synonyms — this rule binds it in full |
| `term=$x._.choice.reason.md` | **the decision record** | `.etymology`, `.disputes`, `.evidence` — dated by contract |
| `term=$x._.choice.example=$id.md` | **the demo** | one notable occurrence |

`template.domain-term` prescribes that middle shape, and
`rule.require.persist-domain-term-evidence` (architect) makes its dated evidence **mandatory** —
a term choice recorded with no evidence is *"a guess on record as if a decision"*.

⇒ so **a dated entry under `.disputes` or `.evidence` is the archetype at work, never a smell.**
it is the same carve-out `rule.forbid.chronological-accretion` grants a changelog whose declared
purpose IS the chronology. to eject it to an `example=` file would move the record out of the
place two rules put it.

🟡 **what a `.reason` still may not hold is the *"an earlier draft"* smell** — the file's own draft
history. *"this entry
first closed with X, and that half is superseded"* is archaeology wherever it sits; the
`.disputes` shape (`raised` / `claim` / `counter` / `resolution`) is how a reversal is recorded,
and a superseded entry is amended in place or answered by a **new dated dispute**, never annotated
with a changelog of itself.

## .examples

### 👎 bad — concept and demo fused

> we deliberately do not declare a purpose enum here — the moment we would, it collapses back to
> the muddle we discussed.

no reader can retrieve the muddle. *"we deliberately"* narrates a deliberation; *"discussed"* cites
a conversation that no longer exists. **and there is no demo to eject** — the episode was never
recorded, only gestured at.

### 👍 good — the concept, focused

> purpose is derived, never stamped: a stamped purpose enum re-couples a flow-word to a
> perspective — the moneyType anti-pattern. keep purpose a read-time projection.

it stands alone. the anti-pattern is a **named, durable anchor**.

### 👍 good — the demo, ejected and checkable

```
rule.forbid.stamped-purpose.example=moneytype-recoupling.md
```

> **2026-08-09 · `<repo>` · branch `<branch>`.** a `moneyType` enum was stamped on the transaction
> row. three read paths then had to reconcile the stamp against the motion triple, and one of them
> disagreed for four months. cost: a migration plus a backfill.

dated, sourced, and it costs the concept file zero lines.

## 🟡 .a verbatim wisher quote is a SEED, not a demo

a `.said` block is verbatim by contract, and its temporal words are part of the record. **never
tidy a quote to satisfy this rule.**

its home is the route's seed inventory (`rule.always.archive-the-wishers-words-verbatim`), and a
brief cites it by path — the same ejection, to a different archetype.

## .the pavement this stands on

`rule.require.timeless-comments` ships in `rhachet-roles-ehmpathy` (mechanic role) and carries the
same strip-and-re-read test, the same smell list, and the same worked example. it lives in a
**separate package**, so it cannot be symlinked or extended from here — only adapted and cited.

| brief | governs | where the episode goes |
|---|---|---|
| `rule.require.timeless-comments` (ehmpathy/mechanic) | **code comments** | git history |
| this rule (bhrain/learner) | **distilled lessons** — briefs, rules, term clusters | `example=$slug.md` |

⇒ **the ejection target is what this adaptation adds.** the general rule says *do not write it*;
this one says *where it goes instead* — which is what makes it obeyable rather than lossy
(`rule.always.reuse-pavement-before-improvise`).

## .enforcement

- a brief that fuses an episode into its concept, where an `example=$slug.md` would serve =
  **blocker**
- a lesson that fails the strip-and-re-read test = **blocker**
- a `yet` / `for now` / `we decided` in a brief body = **blocker**
- a brief that narrates its **own prior drafts** = **blocker**, and there is no ejection — delete it
- an ejected demo with no date, repo, or path = **blocker** — it is an anecdote, not evidence
- a demo file with no pointer up to its concept = **nitpick** — an unlinked example is unfindable
- a dated, sourced incident **inside** the concept, where it is the shortest form of the claim =
  **false positive** — one line of history that a reader must act on is the answer, not archaeology
- a verbatim `.said` block that carries temporal words = **false positive** — it is a quote, and
  to tidy it is its own blocker
- a dated entry under a term `.reason` file's `.disputes` or `.evidence` = **false positive** —
  that file's declared purpose IS the record, and two rules require the date to be there
- a term `.reason` file that annotates its **own** superseded entries = **blocker** — amend in
  place, or answer with a new dated dispute

## .see also

- `rule.require.rules-are-clusters` (librarian) — the `example=$id` ejection this applies to a
  brief's episodes
- `kno201.documents._.[catalog]` (librarian) — the archetype a chronicle actually is: a **demo**
- `rule.forbid.chronological-accretion` (ehmpathy/mechanic, `lang.prose/`) — the doc-level twin,
  and the home for the one case that has no ejection
- `rule.require.timeless-comments` (ehmpathy/mechanic) — the precedent this adapts
- `rule.always.yield-the-output-not-the-archaeology` (driver) — the peer specialization, for a
  route yield rather than a distilled lesson
- `rule.always.archive-the-wishers-words-verbatim` — where a verbatim quote goes instead
- `rule.require.persist-domain-term-evidence` (ehmpathy/architect) — what an ejected demo owes
