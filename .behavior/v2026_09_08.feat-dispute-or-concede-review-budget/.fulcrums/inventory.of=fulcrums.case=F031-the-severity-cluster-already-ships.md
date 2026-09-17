# F31 · the SEVERITY term cluster already ships — the concern's premise is stale

- **rework** = clean · **confidence** = 95% · **status** = disputed (repo-rules blocker.1, r001 i004)
- **raised 2026-09-14**, mid-execution at stone `5.1.execution.from_vision`, in answer to a peer blocker

## .the concern

repo-rules blocker.1 (i004) reads: the `severity` term (`urgent`/`better`) is a new domain concept
introduced by this behavior and is **not itemized into `domain.terms/`**, so
`rule.require.domain-term-itemization` is unmet.

the reviewer hedged the read in its own text — *"if a severity (or urgent/better) cluster already
exists on a prior route, confirm and note it."*

## .taken, and why — DISPUTE

the cluster **exists and ships in this very diff.** the concern's premise — that the term is
undeclared — does not hold against the current tree.

```
.agent/repo=.this/role=any/briefs/domain.terms/term=route.guard.review.absorption.concede.severity._.choice._.md
.agent/repo=.this/role=any/briefs/domain.terms/term=route.guard.review.absorption.concede.severity._.choice.reason.md
```

the `._.choice._.md` names the chosen word, its kind, its forbidden synonyms, the closed two-position
set, and every ref the reviewer cited:

```md
term.chosen   = severity
term.kind     = noun
term.boundary = route.guard.review.absorption.concede
term.synonyms.forbidden:
- priority
- urgency
- weight
- importance
```

⇒ the placement is `term=route.guard.review.absorption.concede.severity`, **one boundary deeper** than
the reviewer's suggested `term=route.guard.review.severity` — and the deeper path is the CORRECT one
per `rule.require.boundary-qualified-terms`: a severity is an attribute of a **concede** stance
alone (it is refused on a dispute), so its boundary ancestry runs `…stance.concede`. answering
*"$word, of WHAT?"* → *"the harm grade of a concession"*. the `.reason.md` beside it carries the
etymology and why `priority`/`urgency`/`weight`/`importance` lost.

so the term IS itemized, and at a truer boundary than the concern assumed.

## .why DISPUTE, not concede

a concede says *"the reviewer is right, I will fix it."* no fix is owed — the cluster is present,
correct, and boundary-qualified. to concede would manufacture work that does not exist and
misrepresent the record. the honest stance is that the concern's premise is stale, and the code
already satisfies the rule the concern names.

## .rework — clean

no edit is owed. the dispute sheds one concern from the tally; the two files it points at are
already on disk. to reverse is to delete this row.

## .confidence — 95%

the two files are read end to end and the boundary qualification is checked against
`rule.require.boundary-qualified-terms`'s own test. what keeps it below 100%: a council may prefer
the shallower `term=route.guard.review.severity` boundary, in which case the cluster is renamed one
segment — a clean rework, not a re-derivation.

## .where

`.agent/repo=.this/role=any/briefs/domain.terms/term=route.guard.review.absorption.concede.severity._.choice._.md` ·
`.agent/repo=.this/role=any/briefs/domain.terms/term=route.guard.review.absorption.concede.severity._.choice.reason.md` ·
`rule.require.domain-term-itemization` — the rule the concern names ·
`rule.require.boundary-qualified-terms` — why the deeper boundary is correct

## .what would settle it

a council read of whether `…stance.concede.severity` is the right boundary, or whether the
shallower `…review.severity` reads truer. either way the cluster exists; the only open question is
its depth.

## .the verdict once ruled

_unruled — disputed at 95%, the council rules._
