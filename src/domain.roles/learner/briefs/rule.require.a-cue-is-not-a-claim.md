# rule.require.a-cue-is-not-a-claim

> **`declare-once` binds a CLAIM. it does not bind a CUE.**
> a costly defect earns as many cues as it takes — from as many angles as you can find.

a **claim** asserts a fact the reader may act on. a **cue** is a detector: a when-row, a smell, a
symptom, a rule aimed at one defect from one angle.

🟡 **the two look identical on the page** — both are one line of prose in a rule file — which is why
a careful author applies the wrong law to one of them.

## .the failure modes invert, and that is the whole rule

| the artifact | what a second copy does | so the law is |
|---|---|---|
| a **claim** | drifts from the first, silently, and the summary is what goes stale | **declare it once**, cite it thereafter |
| a **cue** | **fires where the first one missed** | **as many as it takes** |

⇒ a claim can be wrong, so two copies can **disagree**. a cue cannot be wrong — it either fires or
it does not. two cues cannot disagree; they can only both miss, or one catch.

🟡 **so a redundant cue carries no drift risk at all.** that is not a tolerance granted to cues; it
is a property of what a cue is.

## .the cost asymmetry

| | a redundant one costs | a missed one costs |
|---|---|---|
| a **claim** | a line, plus permanent drift risk | — |
| a **cue** | a line | **whatever the defect costs** |

⇒ for a defect that broke a route, the second column is not close to the first. an overlapped
detector is a second chance, never a duplicate.

## .the test

> **could these two passages DISAGREE with each other?**

- **yes** → they are claims. declare one, cite it from the other
- **no** → they are cues. keep both, and look for a third

🟡 the test is mechanical, and it does not ask you to judge redundancy. two rows that say *"a
paragraph of three claims"* and *"a passage with no line you can point at"* cannot contradict each
other — they are two nets over one defect.

## .when it fires

| when… | then… |
|---|---|
| you would cut a when-row because a peer row already covers it | the strongest cue. ask whether the two could disagree. no → keep both |
| you author a second rule on a defect a first rule already names | correct, where it grades a different property. name the seam between them |
| you author a third | still correct. the count is set by the defect's cost, never by tidiness |
| you would restate a measurement or a count in a summary | that is a claim. cite it, or enumerate by id |
| a cue cites a fact — a number, a file, an incident | the cue is a cue; the fact inside it is a claim, and it obeys `declare-once` |
| you cannot say what angle a new cue adds | the one case to cut it — an angle no reader occupies detects nobody |

## .the worked case — three rules on one defect

the telepath canon carries three rules over prose that fails to transfer its point. the case to cut
the third — that it collides with the first — was argued and refused by the wisher, and the
settlement is the demo:

| rule | grades | its subject |
|---|---|---|
| `forbid.subversive-prose` | falsifiability — can the reader dispute it? | what is claimed |
| `forbid.diffusion` | findability — can the reader locate the point? | where the point sits |
| `forbid.obfuscation` | selection — is what the reader needs even here? | what is absent |

⇒ the three overlap heavily and no two of them can disagree, because each grades a different
property of the same passage. a passage can pass two and fail the third — which is precisely what
the third exists to catch.

> the wisher, verbatim: *"the more the better here. as many angles as it takes to forbid this nasty
> speech pattern"*

## .the boundary — a cue that carries a fact carries a claim inside it

this is not a licence to restate. the cue is exempt; the evidence inside it is not.

| a violation | not a violation |
|---|---|
| a summary that restates a count its source owns | two when-rows that detect one defect from two angles |
| a measurement repeated in a second file | a measurement stated once and **cited** from the second |
| a cue whose angle you cannot name | a third rule on a defect, where its property is named |
| two rules that give contradictory repairs | two rules whose repairs compose |

**the line that parts them: could a future edit make these two passages disagree?** yes → one is a
claim, and one of the two must become a citation. no → they are detectors, and the cost of the
second is one line.

## .why it is a rule of its own

`declare-once` is a real rule and it is well-evidenced — its instance table sits in the
`v2026_09_04.feat-telepath-role` vision yield, and every row is a summary that drifted from the
artifact it summarized. **an author who learns it will apply it to a rule's when-table, and delete
the cue that would have fired.**

⇒ that is the failure this rule prevents: a correct law, applied to the wrong artifact, at a cost
paid later and invisibly.

🟡 **this passage carried a count until 2026-09-05, and by then the count was two short.** the rule
that forbids a restated number had restated one, in the file that argues for it — which is the
sharpest evidence the set holds, and the reason its repair shape is *cite the source, never copy
its arithmetic*.

## .enforcement

- a **cue** cut on `declare-once` grounds, where the two could not have disagreed = **blocker**
- a **claim** — a count, a measurement, a verdict — restated where a citation would serve = **blocker**
  (that is `declare-once`, and this rule does not weaken it)
- a new rule on an extant defect with no named angle = **nitpick**

## .see also

- `rule.forbid.emphasis-noise` (telepath) — this file was authored before it and measured **1 in 7**
  against its **1 per section** bar. the repair is the demo
- `rule.require.specialize-a-rule-its-readers-look-past` — the same claim for a whole rule: a second
  rule in a second domain is a second cue, never a fork
- `rule.require.enumerate-before-you-name` — the list that proves a cue's angle is real
- `research.selfreview-effectiveness` — why a when-then cue outscores a bare principle, which is what
  makes the count worth its cost
