# rule.require.vertical-partitions

> **partition through vertical domains, never through horizontal layers.**

a **vertical domain** is one operation, or one subdomain of operations, with every layer that
serves it: its source, its tests, its snapshots, and the shared types it reads. a partition must
hold all its own files need to be judged alone (`howto.partition-an-overflowed-review`), and only a
vertical slice does. the cut to refuse is named in `rule.forbid.horizontal-partitions`.

## .the test

> **for each file in this partition, are the files it leans on — its subject, its callers, its
> tests — in this partition too, or listed as a shared overlap?**

yes for every file → the cut is vertical · no → it slices a layer. move the boundary.

## .where the seams sit

the repo's own layout decides the globs; the seam is the same in every layout:

- **one operation, through every layer** — wherever the repo keeps each layer. where tests sit
  beside their subject, a directory cut keeps them together, which is why the overflow lever
  suggests directories. where layers live in separate trees, each partition names every half
- **a subdomain** — when one operation is too small to stand alone, group operations that share a
  noun, never ones that share a layer
- **contract-level tests** — a test that reaches the code only through its public contract may
  stand apart from the source, per contract surface
- **shared context** — types, domain objects, a bound route's spec: list them in each partition
  that reads them. the overlap is computed, and a common file is graded once

| when… | then… |
|---|---|
| a review overflows and the refusal names the partition lever | the moment this fires. name the domains before you type a glob |
| an overflow lever suggests directories | a start, never a verdict. move each boundary to where the domains separate |
| one domain alone still overflows | split it into its own subdomains, never into its layers |

blocker: a test partitioned apart from the code it asserts on (contract-level tests per surface
excepted).
nitpick: a subdomain grouped by an incidental name rather than a shared noun.

⇒ see also: `rule.forbid.horizontal-partitions` (the forbid peer) ·
`howto.partition-an-overflowed-review` (the mechanism) · `review.tactics` (the cue on overflow).
