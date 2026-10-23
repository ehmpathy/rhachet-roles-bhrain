# seed S7 — `repo=.this` is dynamic, so it sorts to the tail of any fileset

## .said

> forget repo-rules. choose a different one for now. repo-rules is dynamic, hence must be sorted
> at end of cached rules.

and, the same round:

> and catch a todo to fix the repo-rules variant. i.e., our reviewer should know to put
> `repo=.this` content at the tail of any fileset

## .settled

a fileset that enters the prompt is ordered by **declared stability**, and the `repo=`
coordinate declares it:

- `repo=.this` is the repo under edit, so its content is **dynamic by construction** — a branch
  exists to change it. it sorts **last**
- every other `repo=` is a dependency brief, pinned by version, so it is **static**. it sorts
  first

⇒ the rule generalizes past the `rules` block the utterance names: **any fileset**, which
includes `refs` and any future block built from a glob.

🔴 and the order is computable **from the path alone** — no mtime, no filesystem read. that makes
it strictly stronger than the target sort's clock key, which a formatter, a rebase, or a fresh
checkout rewrites wholesale.

### why it fired

the prefix census was read lane by lane, and `repo-rules` was thrown out of the sample as
unrepresentative. its glob is `.agent/repo=.this/**/rule.*.md` — the briefs of the repo under
edit — so on a branch that touches a brief, the lane's own rubric churns, **in the prompt head**,
where a break voids every byte behind it.

⇒ the lane most likely to churn its head is the lane whose head is made of the files we are here
to change.

## .landed

- `.dream/v2026_09_23.feat.repo-this-content-is-dynamic-by-construction-so-it-must-sort-to-the-tail.md`
