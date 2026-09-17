# rule.forbid.verbatim-quotes-outside-seeds

> **a wisher's verbatim words live in ONE artifact: their seed. every other artifact states the
> claim in its own words — and does not quote it, and does not cite it.**

the clamp on `rule.always.archive-the-wishers-words-verbatim`. that rule says where the words MUST
go; this says where they must NOT go — which is everywhere else: a brief, a rule, an invariant, a
yield, a fulcrum, a term's `.reason`, a commit body, a PR description.

🔴 **and the ban covers the CITATION, not merely the quote.** a seed path in a brief is the same
defect one hop further out — see `.why the PATH goes too`, below.

## .why — a copied quote is a SECOND original, and only one of the two is governed

`.said` is verbatim by contract and it is the artifact a reader checks a distillate against. a copy
elsewhere inherits the authority and none of the contract:

- it can be **trimmed, reflowed, or reworded** silently. 🔴 and the drift is undetectable from
  either side, because **no reader ever holds both copies at once** — they read the one in front of
  them and inherit whatever it says
- it carries the wisher's authority **with no record behind it**. a reader cannot part a quote from a
  remembered quote, so an invented one reads exactly as strong as a real one
- it goes **stale when the settlement moves**, and a copy has no supersession channel. the seed set
  does — a later seed overrules an earlier one, in one place, where the census can see both
- it is **archaeology inlined where a ref was owed** (`rule.require.archaeology-in-notes`). the exact
  words serve the one reader who disputes the claim; every other reader pays for them on every read

⇒ and the copy buys naught. **what the artifact needs is the CLAIM**, and the claim reads sharper in
the author's own words than in a mid-thought utterance that was never written to be read.

## 🔴 .why the PATH goes too

a citation reads as the cautious middle — the words stay home, the reader gains provenance. it is
not. **a seed path in a brief has three defects a quote does not fix:**

| the defect | what it costs |
|---|---|
| **it is a phantom path where it matters most** | a brief PUBLISHES to other repos; `$route/.seeds/…` resolves in none of them (`hazard.published-brief-cannot-cite-the-repo-glossary`). the reader who most needs provenance is the one who cannot follow it |
| **it rots faster than the claim** | a route is archived, a seed renumbered, a slug reworded — and the brief that cites it is a durable artifact with no reason to be re-read. ⇒ a dead link with a live claim beside it, which reads as though the claim died too |
| **it re-frames the claim as a REPORT** | *"the wisher said X, see `…S14…`"* makes the brief an account of an utterance. **a rule is a law, not a transcript with a footnote.** it binds because it is true, never because someone said it |

⇒ and the provenance is not lost by the cut. **git holds it, and the route holds it** — the seed
sits in its own inventory, indexed, where a reader who wants the archaeology already goes
(`rule.require.archaeology-in-notes`: a note is reached from the route that wrote it, not from every
artifact it touched).

🟡 **a brief is not the seed's index. the seed inventory is.** to cite one seed from a brief is to
start a second index that no census maintains.

## .the repair — state the claim, and STOP

the words are not deleted; they are already archived. the artifact keeps its full claim and gains
naught else:

```md
👎  > *"only urgent concessions qualify for 'needs increased budget'."*
    > — the wisher, 2026-09-14 (seed S14)

👎  the wisher set the line at shipped harm: only an `urgent` concession earns more budget.
    ⇒ the words, on record: `$route/.seeds/inventory.of=seeds.case=S14-<slug>.md`

👍  the line sits at shipped harm: only an `urgent` concession earns more budget, and a `better`
    one never does — it is maintenance, and maintenance must not weigh the work down.
```

🔴 **the third form does not name the wisher either.** a law does not carry the name of who spoke
it; it carries why it holds. *"the wisher said"* is provenance, and provenance is git's job.

## .the cues

| when… | then… |
|---|---|
| you are about to paste `> *"…"*` attributed to the wisher | 🔴 the strongest cue. state the claim, and stop |
| you would soften that to a **seed path** instead | 🔴 the second-strongest, and it feels careful. the path is the same defect, one hop out |
| you write *"the wisher said"* / *"verbatim"* / *"their words"* | cut the attribution. the claim binds on its own |
| a `.the litigation` section asks who argued what | it asks for the **argument and what settled it**, never a transcript and never a link to one |
| an invariant, a rule, or a philosophy would quote to prove it was ordained | 🔴 a law does not prove itself by who spoke it. state why it holds |
| the quote is *"sharper than any restatement"* | 🟡 that sharpness is the SEED's job, and the reason the seed is verbatim. write the sharper restatement |
| you cannot find the seed at all | 🔴 the utterance was never archived — the parent rule fires first. archive it. then still do not cite it |
| the artifact is **published** to other repos | 🔴 there the path resolves to naught. the claim must have been standing alone all along |

## .the boundary — a WISHER utterance, never all quotation

| a violation | not a violation |
|---|---|
| a wisher utterance reproduced in a brief, rule, invariant, yield, fulcrum, or `.reason` | the `.said` block of the seed itself — verbatim is its contract |
| a **seed path** cited from a brief, rule, invariant, or philosophy | a seed cited from **within the route that wrote it** — a fulcrum, a yield, the seed inventory |
| a wisher paraphrase dressed as a verbatim quote | a **published external source** quoted with its citation (a book, a spec, a standard, a gh issue) |
| a wisher quote in a commit body or PR description | a **reviewer's** concern quoted in a `.taken` — the `.given` is its record |
| a wisher quote carried into a `.min` from its source | a tool's stdout, a code line, a file's content — their record is the file |

**the two lines that part every case:**

1. **does the quoted party have a SEED as their record?** yes → restate, never copy. no → not a
   wisher utterance, and this rule says naught about it
2. **is the artifact INSIDE the route that archived it?** yes → the path resolves and the reader is
   already there; cite freely. no → the path turns phantom the moment it publishes; state the claim alone

## .the extant set — fix forward, no sweep

extant copies are left in place until disturbed. touch an artifact that carries one, and you repair
it on the way through (`rule.prefer.scouts-honor`). **a bulk find-and-replace is forbidden**: it
cannot part a copied quote from a cited one, and it would rewrite the seed files themselves — the one
place the words belong.

blocker: a wisher utterance reproduced verbatim outside its seed · a **seed path cited from a brief,
rule, invariant, or philosophy** · a *"the wisher said X"* attribution offered as the claim's ground ·
a claim the reader cannot read unless they open the quote it cites · a bulk rewrite of quotes across
files.
false positive: the seed's own `.said` · a seed cited from within its own route (a fulcrum, a yield,
the inventory) · a published external source with its citation · a reviewer concern quoted in a
`.taken` · a quote in an artifact whose declared subject IS the transcript.

⇒ see also: `rule.always.archive-the-wishers-words-verbatim` (the positive peer — where the words
go, and the typo/profanity repair its `.said` carries) · `rule.require.archaeology-in-notes` (the
move-and-ref this instances, and the reason the ref stays in the route) ·
`hazard.published-brief-cannot-cite-the-repo-glossary` (why the path is a phantom downstream) ·
`rule.require.timeless-lessons` (its `.said` false-positive, which this rule bounds) ·
`im_an.obsessive_learner.for.domain.invariants` (the `.the litigation` field this governs).
