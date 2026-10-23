# seed S47 — partition by operation, never by test vs source

archived verbatim, before distillation. typos repaired. a correction to the examples that
showed a `tests=` partition beside a source partition.

## .said

> yes, exactly. and hopefully we dont encourage folks to separate tests vs etc. maybe blackbox can be separate, but even then it should probably be per operation

> exactly so

> and we should enbrief that and enrule that for the reviewer role
> so folks know how to partition well

> and it should also nudge them to do that when it says they need to partition, when the reviews are too large

> yeah, give it a forbid peer too
> since forbid always bites more reliably than require

> no red circles
> thats just visual noise
> and reference the forbid rule

> why would you say 'and blackbox tests split', not every repo has blackbox
> you cant assume repo structure

> how about 'partition through vertical domains, never through horizontal layers'

> forbid horizontal partitions then ?

## .settled

- a partition cuts along the code's own seams — one operation, or one subdomain of operations —
  and carries that operation's source and its tests together. a test is judged beside its subject
- no example, brief, or lever suggestion may show a split by file kind (`src=` vs `tests=`). that
  split puts a test in one prompt and the code it asserts on in another, so neither half can be
  graded alone
- a test that reaches the code only through its public contract may sit apart from the source —
  but per contract surface, never as one bucket of every such test
- the guidance names no repo layout. a reviewer role ships to every repo, so a dir name like
  `blackbox` or `src` in a rule or a refusal is an assumption the next repo breaks
- the overflow nudge carries no 🔴 and cites `rule.forbid.horizontal-partitions`

- the law, in one line: partition through vertical domains, never through horizontal layers. a
  horizontal layer spans file kinds (tests, snapshots, types) and architecture tiers (contracts,
  operations, data access) alike; a vertical domain holds every layer of one operation
- the pair is named for it: `rule.forbid.horizontal-partitions` and `rule.require.vertical-partitions`
- the reviewer role carries it as a rule pair, both resident: a require that names the seam, and
  a forbid that refuses the file-kind shape — a ban bites where a call for the better shape slides by
- the overflow refusal's partition lever names the forbid at the moment it says to partition

## .landed in

- `src/domain.roles/reviewer/briefs/rule.require.vertical-partitions.md`
- `src/domain.roles/reviewer/briefs/rule.forbid.horizontal-partitions.md`
- `src/domain.roles/reviewer/boot.yml`
- `src/domain.roles/reviewer/briefs/howto.partition-an-overflowed-review.md`
- `src/domain.roles/reviewer/briefs/review.tactics.md`
- `src/domain.operations/review/asReviewOverflowLeverLines.ts`
