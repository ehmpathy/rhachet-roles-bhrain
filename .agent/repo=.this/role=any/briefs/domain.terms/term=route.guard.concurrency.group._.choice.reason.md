# domain.term.choice.reason: route.guard.concurrency.group

## .etymology

**coined by the wisher**, verbatim, in seed S4 of `v2026_09_03.feat-peer-review-parallelism`:

> *"only the author of the guard file will know which guards hit the same ratelimits, so only
> they'll know which concurrency group to cluster each reviewer in"*

⚠️ **that sentence carries the term AND its justification in one breath.** the group exists because
*membership is knowledge only the guard's author holds* — no tool can infer which two reviewers call
the same provider. so the word names a set the author must declare, not one the runtime can derive.

## 🔴 .the enumeration — nine instances, seven candidates

the wisher then audited their own coinage, one utterance later (seed **S7**):

> *"are there better terms than group? e.g., bottle or rates or bottleneck ? or etc?"*

that question forced the walk `rule.require.enumerate-before-you-name` demands, and which the
coinage had never had. the word must cover **all nine**:

| # | the instance |
|---|---|
| i1 | a set of reviewers on **one provider's ratelimit** |
| i2 | a **second, disjoint** set on a different provider — both live at once |
| i3 | a set bounded by **host memory**, spanning every provider — a different KIND of resource |
| i4 | a set of **exactly one** reviewer — contends with nobody, still a set |
| i5 | a set whose bound is **never declared** — the default, and the common case |
| i6 | the **membership key on the reviewer** |
| i7 | the **map key that holds the bound** |
| i8 | what a **queued lane waits for** |
| i9 | the **render label** that tells a reader why a lane has not started |

| candidate | verdict | the row it breaks on |
|---|---|---|
| `bottleneck` | **too narrow** | **i4, i5** — a bottleneck is the *constraint*; a set with no constraint is still a set, and that is the default case |
| `rates` | **too narrow** | **i3** — host memory is a capacity, not a rate. and `rate: anthropic` is a category error at i6 |
| `bottle` | **invented** | points at no thing the domain holds — no answer to *"where did this already live?"* |
| `pool` | **inverts the referent** | a pool holds resources you draw **from**; ours holds consumers that draw |
| `lane` | **occupied** | already spoken for **one reviewer's run**, and on the glossary's open-gap list |
| `cohort` | **wrong axis** | a cohort shares a **start time**; ours shares a **resource**, and members start at different moments by construction |
| `tier` | **forbidden** | a declared forbidden synonym of `level` |
| ✅ `group` | **covers all nine** | — subject to the wideness charge below |

## ⚠️ .the wideness charge is real, and its repair is a differentia rather than a substitute

bare `group` **is** the genus. that is the identical defect recorded in
`rule.require.enumerate-before-you-name`'s own worked cases — `knowledge` covers a brief *and* a
skill; `tool` covers all four rungs.

⇒ **but a genus is repaired by a qualifier, never by a replacement.** and the wisher had already
supplied it: the term is `concurrency group`. that answers *"$word, of WHAT?"* in **one word**, which
is the test `rule.require.boundary-qualified-terms` sets.

## 🔴 .why `bottleneck` is refused — it has no slot left

it deserves a straight answer, because it is the **wish's own word**: *"we want it to have a
bottleneck ability"*.

| the concept | the settled word | so `bottleneck` would be |
|---|---|---|
| the **count** — how many at once | `concurrency` | a **synonym** — forbidden outright |
| the **set** — who contends | `concurrency group` | **too narrow** — breaks i4, i5 |
| the **mechanism** — the semaphore | `with-bottleneck`'s own word | ✅ **already its home** |

⇒ **the third row is the honest one.** `bottleneck` is the *implementation's* word, and the
implementation primitive is an execution-stage call the vision does not make.

⚠️ **and the overload would land in one file.** were `bottleneck` to name the set while
`genBottleneck()` names the semaphore, one word would carry two concepts on the same surface —
`rule.forbid.domain-term-ambiguity`, at the sharpest possible range.

## ⚠️ .the open state — settled at the vision, not yet ruled by the council

this word sits on fulcrum **F8**, **open at 91%**. the 9% doubt is narrow and named: **i8 and i9
were scored on paper.** nobody who did not write the word has read *"waiting for a free slot in group
anthropic"* in a rendered status line, and that is the one row where a shorter word might still win
on the surface.

it is carried into the glossary ahead of the council because the **evidence** decays with the round
while the **verdict** does not, and the rework is clean — two yaml keys, no callers, nothing built.

## .disputes

### dispute: bottleneck — raised 2026-09-09 — status: RESOLVED (keep `concurrency group`)

- raised.by  = the wisher, seed S7
- claim      = `bottleneck` is the wish's own word for the ability, and reads plainer than `group`
- counter    = it names the **constraint** rather than the **set**, so it breaks on the two rows the
                default case produces (an unbounded set, and a set of one). and it is already
                `with-bottleneck`'s word for the mechanism, so adopting it puts two concepts on one
                word in the same file
- resolution = keep `concurrency group`; record `bottleneck` as a forbidden synonym **for the set**,
                and leave it free for the mechanism, where it already lives

## .evidence

- discovery: the nine-instance walk above, run in full at
  `.behavior/v2026_09_03.feat-peer-review-parallelism/.fulcrums/inventory.of=fulcrums.case=F8-group-is-the-word-for-the-set.md`
- precedent checked: `formatGuardTree.ts` and `formatGuardReviewLadderFooter.ts` carry
  `remedyGroups` — a **boundary-qualified peer**, checked and cleared, not a collision
- invariants:
  - a group holds **reviewers**, never levels — a level is an integer, and an integer contends for
    no resource
  - **membership is authored, never derived** — no tool can infer which reviewers share a provider
  - a group's bound is its **cardinality**, so it is declared on the group and never repeated on a
    member (`rule.forbid.domain-term-inconsistency` would follow from the repeat: two homes, one fact)
