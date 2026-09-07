# rule.prefer.rules-that-refout

> **a rule carries its CUE and refs out its ARGUMENT. the cue boots; the case for the cue does not.**

a briefs library that keeps both resident pays for the argument on every boot, forever, and charges
it to every reader who already accepted the rule.

```
rule.$directive.$topic.md               # the CUE — say tier, resident
define.$concept.md                      # the ARGUMENT + the demos — ref tier, fetched
rule.$directive.$topic.example=$id.md   # ONE occurrence — ref tier (rule.require.rules-are-clusters)
```

⇒ a third axis beside `rule.require.rules-are-clusters`. that rule splits the **class** from **one
occurrence**; this splits the **cue** from the **case for the cue**, and it is the split that decides
the boot tier.

## .why — the two halves have different READERS, and they arrive at different moments

| | the cue | the argument |
|---|---|---|
| who reads it | an author, mid-sentence | a reader who disputes the rule, or first learns it |
| when | before the prose exists | after a flag lands, or once per author |
| how often | every turn | once |
| what a late arrival costs | the prose was already written | naught — they were not mid-sentence |

⇒ **a cue that must be fetched has already lost the round.** an author does not consult an index
before each keystroke, so a rule fetched after a paragraph exists asks for a rewrite of prose that
should never have been written.

⇒ and an argument that boots is charged to a reader who did not ask. they accepted the rule the first
time; the case for it is then a permanent tax on a settled question.

🟡 the asymmetry is the whole rule, and it runs both ways — so this is a **placement** decision, never
a length one. a short argument still refs out, and a long cue still stays resident.

## .the test

> **does this content fire BEFORE the prose exists, or AFTER a reader disputes it?**

before → the rule, at say · after → the define, at ref · **you cannot say** → it is argument, and
argument refs out. the burden sits on residence, never on the fetch.

## .what each half holds

| the rule — say | the define — ref |
|---|---|
| the claim, one line, as a blockquote | the etymology, and why this word over its rejected peers |
| the test that fires it | the worked pair — 👎 beside 👍, at length |
| the cue table — `when… / then…` | the measured case, with its date and its numbers |
| the shapes table — one line per detector | the counter-argument, stated fairly |
| `blocker:` / `nitpick:` / `false positive:` | the boundary, argued rather than listed |
| a `⇒ see also` line, which names the define | a pointer back up to its rule |

🟡 **the enforcement block stays with the rule, always.** a reviewer grades in the same pass they
read, so a fetched exemption list is one nobody consults — and a flag with no legal refutation is a
deletion mandate at any severity.

## .the cues

| when… | then… |
|---|---|
| you write a rule and reach for *"the reason this holds is…"* | 🔴 the strongest cue. that sentence opens the define |
| a rule file runs past its siblings' median | measure its argument share before you cut. the excess is usually the case for the rule |
| you write a `define.$x` that no rule cites | an orphan. nobody fetches it — either a rule is owed, or the define is not |
| a rule has no define and its argument grows each round | the define is owed. the argument has nowhere else to go |
| a define sits at **say** | 🔴 read the exception below. it is argued, never assumed |
| a rule sits at **ref** | 🔴 the inversion. a cue must be resident or it does not fire |
| you would cut a cue to reach a size target | forbidden — `rule.require.a-cue-is-not-a-claim`. move the argument instead |
| a demo pair renders as a blockquote rather than a table | it is still a **cue**. do not sort by markup |

## 🟡 .the one exception — a FORM the author must render reflexively

a define whose subject is the shape every passage is rendered in must stay resident, because you
cannot reflexively render a form you must go fetch.

⇒ measured: `define.bulletize` sits at say in `bhrain/role=telepath` for exactly this reason, and it
earns it — **62% of its min is demo pairs**, which are cue-shaped by the test above.

🟡 the exception is narrow, and it is not *"this define feels important"*. the test is whether the
reader must PRODUCE the subject at the keyboard, or merely UNDERSTAND it. a form is produced; an
etymology is understood.

## .the failure modes

| shape | what it costs |
|---|---|
| **the orphan rule** — a rule with no define | the argument accretes into the rule, and every boot pays for it |
| **the orphan define** — a define no rule cites | it is never fetched. the argument was written for nobody |
| **the inverted pair** — define at say, rule at ref | the exact inversion: the case boots and the cue is fetched |
| **the mixed rule** — cue and argument in one resident file | the common case, and it is invisible until measured |

🟡 **the mixed rule is the one you will actually have.** each paragraph of argument was written by
someone who had just made the point and wanted it to hold, so no single edit is the defect.

## .the measurement that makes it checkable

sort each resident brief's lines into cue and argument, then state the share:

- **cue** — a table row · a blockquote · a bullet · a `👎`/`👍` demo header · an enforcement line
- **argument** — each other line

⇒ walked 2026-09-07 across `bhrain/role=telepath`'s 26 resident briefs: **108,701 chars, 46%
argument.** so nearly half of a role's fixed boot cost was the case for rules its readers had already
accepted.

🟡 **a first pass returned 58%, and it was wrong** — the classifier counted `👎`/`👍` demo pairs as
argument because they render as blockquotes rather than table rows. a demo is a cue: it teaches by
demonstration, and it fires at the keyboard.

⇒ so the instrument is verified before its output is a claim, and the tell was one file at 94%
argument that proved to be 62% demos.

## .the boundary

| a violation | not a violation |
|---|---|
| an argument paragraph in a resident rule | a **one-line** ground beside a claim the claim is unusable without |
| a define at say with no argued exception | a define at say **for a form**, with the exception stated |
| a cue moved to ref to reach a size target | an argument moved to ref, however short |
| a rule with no define whose argument grows each round | a rule with no define whose argument is one line |

**the line that parts them: would an author mid-sentence use this?** yes → a cue, and it stays
resident however long it runs · no, it is why they should → it refs out, however short it is.

nitpick: an argument paragraph left in a resident brief · a define at say with no argued exception ·
a rule at ref, where its cue cannot fire · a define no rule cites · a rule with no define whose
argument grows each round · an enforcement block moved to a define.
blocker: a cue cut to reach a size target — which is `rule.require.a-cue-is-not-a-claim`'s blocker,
never this rule's.
false positive: a define at say **for a form the author renders reflexively**, with the exception
argued · a one-line ground beside a claim · a demo pair rendered as a blockquote, which is a cue.

⇒ see also: `rule.require.rules-are-clusters` (the class/occurrence axis this sits beside) ·
`rule.require.catalog-is-an-index` (the same grain model) ·
`rule.prefer.decompose-a-subject-via-suffixes` (the WHETHER to eject) ·
`rule.require.a-cue-is-not-a-claim` (bhrain/role=learner — why a cue may never be traded for bytes) ·
`philosophy.entoolment-is-the-pinnacle._` (bhrain/role=learner — why a resident brief is a fixed cost).
