# seed S12 — seeds get their own dir, as an inventory

**2026-08-28. moved the seed set out of `refs/` and into `.seeds/`, as an inventory.**

## .said

> should we just have a .seeds dir in the $route/.seeds just like we have $route/.fulcrums ?

## .settled

**yes.** a seed set is an **occurrence set** exactly as a route's fulcrums are, so it takes the
same form:

```
$route/.seeds/inventory.of=seeds._.md
$route/.seeds/inventory.of=seeds.case=S$n-$slug.md
```

this **retracts** the clause `rule.always.archive-the-wishers-words-verbatim` carried — *"do not
invent a new directory for these; `refs/` already holds human-given input"*. that clause was
written against a real near-miss, and its reason was a reuse argument rather than a correctness
one. `.fulcrums/` is also a new directory beside `refs/`, and it is correct.

**what the flat `refs/` form could never have is the summary.** `refs/` holds mixed input — a
feedback template sits there too — so a seed set filed into it declares no axis, states no count,
and reports no gap. that is exactly what `rule.forbid.itemization-without-coordinates` forbids:
entries with no summary.

## .landed

- `.behavior/v2026_08_12.feat-adopt-seeded-briefs/.seeds/` — 9 seeds moved, ordinals assigned by
  the date each was uttered, plus a summary
- `src/domain.roles/driver/briefs/rule.always.archive-the-wishers-words-verbatim.md` — the form,
  the anti-patterns, and the enforcement all rewritten
- `src/domain.roles/learner/briefs/im_an.obsessive_learner.md` — the archive trigger
