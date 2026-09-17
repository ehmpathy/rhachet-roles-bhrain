# domain.term.choice.reason: concern

## .etymology

**the wisher coined it**, 2026-09-10, mid-design:

> *"we should track a review.feedback.given.concern as its own domain.term … the driver doesnt need
> to know that nor care, they can just say `--concern 'blocker.3' of 'reviewer.X'`"*

latin *concernere* — to sift together, to have reference to. an english **concern** is *a matter one
has an interest in* — which is exactly the relation here: a reviewer has an interest in one property
of the artifact, and says so once.

⇒ **it names the reviewer's STAKE, never the artifact's fault.** that is the property that made it
beat every alternative: a concern may be right or wrong, blocker or nitpick, repaired or refuted, and
the word survives all four verdicts unchanged.

## .the words it beat

| candidate | why not |
|---|---|
| `point` | ⚠️ **already in use** — `rule.always.converge-with-reviewers.via-a-taken-per-point`. it is not wrong, and it is **generic english**: a point is any assertion at all, so it names no reviewer-domain object. ⇒ the rule's prose is the drift, and the rule keeps its filename (`rule.forbid.domain-term-synonyms` — extant contracts are left until disturbed) |
| `item` | names a position in a list, and says naught about what the position holds |
| `issue` | ⛔ presumes fault. a disputed concern is one the driver argues is **not** an issue, so the word begs the verdict |
| `feedback` | 🔴 **already forbidden** as a synonym of `given`. the wisher's own phrase used it — `review.feedback.given.concern` — and the canonical form drops the segment |
| `critique` | forbidden as a synonym of `given`, same cluster |
| `blocker` / `nitpick` | these are the concern's two **severities**, never its genus. a term that names one position on an axis cannot name the axis |

🟡 **the `feedback` row is worth the read.** the wisher named the term with a segment this glossary
had already forbidden — and that is no defect in the ask. **a coinage arrives in the coiner's
vocabulary, and the glossary's job is the translation.** the concept is what was settled; the
segments are ours to fix.

## 🔴 .why the term had to exist before the axis could

the design walked a 135-cell experience product and its set-aside table asks whether
**`reviewer-count`** earns a coordinate. **it never asks `concern-count`.**

⇒ **a domain with no word for X cannot have an axis on X.** the finest named grain was the lane, so
*"the concerns within one lane"* was not a dimension anybody declined — it was one nobody could name.
the walk's completeness claim is silent about it exactly as it would be about any unnamed subject.

⚠️ **and the silence had a price.** `S05` ruled the stance grain per-POINT on 09-09; `S06` landed a
per-FILE mechanism on 09-10; every artifact stated *"per point"* in its prose while the code shed
four concerns per dispute. **the settlement reached the row it was written on and no mechanism.**

⇒ the full record: `S07` · `1.vision.experience.case=11` · `dimensions.md` § 5.

## .evidence

- **the code, read 2026-09-10** — `getReviewCountsViaRegex.ts` declares
  `{ detected: false } | { detected: true; blockers: number; nitpicks: number }`. two integers. **a
  per-concern design must add identity from scratch**, and this term is the first step of it
- **the extant admission** — `rule.always.converge-with-reviewers.via-a-taken-per-point`:
  *"the gate counts REVIEWERS. this rule counts POINTS … the door is a floor; this rule is the work."*
  ⇒ **the concern was already the real grain of the domain, admitted in a booted rule, with no term
  and no mechanism**
- **the cardinality, ruled verbatim** — *"yep, if its one fulcrum, they can register the same fulcrum
  as a dispute against 8 concerns"* ⇒ `1 fulcrum : N disputes`, and `1 dispute : 1 concern`
- 🔴 **the IDENTITY, ruled verbatim** — 2026-09-10, hours after the term was coined:
  *"stances do not survive rounds; only live in latest round"* ⇒ **invariant 2 is settled, not
  proposed.** it was a best guess at 66% (`F020`, the board's lowest) and the fork it beat was a key
  durable across rounds, which would have required `contract.reviewer-output` to grow an id
- 🔴 **the `--all` refusal, ruled verbatim** — same session: *"exactly, agreed … a driver who types
  `all` has not read all. That treats a declaration as evidence of a read, not merely a record"*
  ⇒ **invariant 5 is settled**, and its ground: a declaration is **evidence**.
  ⚠️ that reaches past the flag — it is why an **enumeration** (`--about nitpick.1,2,3`) stays
  admissible while a **range** (`nitpick.1-6`) does not, since a range is `all` with a hyphen

## .disputes

_(none open)_

## .invariants

1. a concern is **exactly one** blocker or **exactly one** nitpick — never both, never a group
2. ✅ **wisher-ruled.** its identity is `(reviewer, severity, ordinal)` **within one given**; a fresh
   given renumbers, and a stance does **not** survive the round it was made in
3. a `stance` targets **exactly one** concern
4. a declaration discharges the concerns it **names**; concerns it did not name survive it
   (`rule.forbid.suppression-of-undeclared-concerns`)
5. ✅ **wisher-ruled.** an `--all` variant is forbidden — it reintroduces the per-file defect under a
   friendlier name. *a driver who types `all` has not read all*, and a declaration is **evidence of a
   read** rather than a record

🟡 **2 and 5 are ruled; 1, 3, and 4 are not.** they follow from the coinage itself (1, 3) and from a
rule this repo booted (4), so none is a guess — but a reader who needs to know **what a council has
seen** should not have to infer it from the confidence of the prose.
