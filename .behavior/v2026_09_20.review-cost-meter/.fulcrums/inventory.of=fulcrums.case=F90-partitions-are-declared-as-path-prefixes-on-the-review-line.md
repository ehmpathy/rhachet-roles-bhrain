# F90 — partitions are declared as path prefixes, on the review line

## .the fork

S33 left open the flag grammar, and whether `--partitionable` lives on the guard's reviewer line or
in the rule file.

| option | for | against |
|---|---|---|
| **a. a flag on `rhx review`** — the guard's reviewer line carries it | one place the bind already lives; `route.mutate.guard` edits it; a hand call can pass it too | a rubric that is always splittable must say so on every lane that runs it |
| b. a frontmatter key in each rule file | travels with the rubric | a rule file grades a concern, not a corpus; the split is a property of the SCOPE, which the lane owns |

## .taken

**a.** `--partitionable` takes a list of path prefixes, repeatable, and a brace list expands:
`--partitionable '{src/domain.operations/review,src,blackbox}'`. a bare prefix `x` matches `x` and
`x/**`; a value with a glob metachar is used as a glob as-is. 🔴 **one flag only** — a caller who
isolates a subtree at the call site (the MAYBE in S33) passes one more `--partitionable`. a second
flag for the same concept was drafted and struck as a synonym (S33).

a target joins the FIRST partition that matches, in declared order, so a narrow prefix listed before
a wide one carves its subtree out of it. a target that matches none joins one
`rest` partition.

🟡 **amended at the 5.1 coverage review:** a prefix declared AFTER its own ancestor moves ahead of
it. a caller's flag is appended behind the guard's, so under strict declared order the subtree S33's
MAYBE isolates would claim no target and be dropped as empty — in silence. no declared order can
intend a partition that claims naught, so the move changes no meant outcome. globs keep declared
order. clamp: `asReviewPartitionsFromFlags.test.ts` `[case5]`, seen red without the move.

## .rework

**clean** — the parse is one transformer (`asReviewPartitionsFromFlags`); a move to frontmatter adds a
second source to the same list.

## .confidence

75% — the split is a fact about the subject, which the lane binds; a rubric does not know how big
the branch it grades will be.

## .verdict

**superseded, 2026-10-05, by seeds S44 and S46.** partitions are now caller-declared, overlapped sets,
with overlap computed (`common` vs `narrow`) rather than first-match. each declaration names the whole
set for `@all` or one peer, and the guard stores it in `$route/.route/partitions.json` rather than on
the review line. the first-match rule, the `rest` remainder, and the prefix-ahead-of-ancestor move are
gone; declared order now decides only which partition grades a common file.