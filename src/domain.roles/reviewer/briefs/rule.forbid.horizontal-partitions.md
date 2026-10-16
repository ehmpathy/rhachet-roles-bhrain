# rule.forbid.horizontal-partitions

> **partition through vertical domains, never through horizontal layers.**

a **horizontal layer** is every file of one kind or one tier, across all domains: every test, every
snapshot, every type, every contract, every data-access module. a partition scoped to one layer
holds a slice of every domain and the whole of none.

the forbid peer of `rule.require.vertical-partitions`. that rule names the cut to make; this names
the cut to refuse, since a ban on a shape bites where a call for a better one slides by.

## .why a layer cannot be graded alone

a layer is half of every claim it touches. a test asserts on code in another layer; a contract
delegates to operations in another; a type is read by every tier above it. a partition of one
layer grades each file against neighbours it cannot see, so it either guesses or raises concerns
the absent layer would have answered.

## .the forbidden shapes

| 👎 a partition whose scope is… | the layer it slices |
|---|---|
| every test file, by its suffix or its test dir | tests, apart from their subjects |
| every snapshot | snapshots, apart from the tests that wrote them |
| every source file, beside a partition of tests | the other half of the same cut |
| every contract, every operation, or every data-access module | one architecture tier, apart from the tiers it calls and is called by |
| every type, or every domain object, alone | shared context — it belongs IN each partition that reads it, as an overlap |

## .the test

> **does any partition's scope name a LAYER — what a file is, or which tier it sits on — rather
> than a DOMAIN — what it is about?**

yes → forbidden. rename each partition after a domain, and give it every layer of that domain.

## .the one exception

a test that reaches the code only through its public contract — an acceptance test, wherever a
repo keeps them — may stand apart from the source it exercises. it still splits per contract
surface, never into one bucket of every such test.

| when… | then… |
|---|---|
| a review overflows and the refusal names the partition lever | the moment this fires. the cheapest glob to type is a layer — refuse it |
| a partition's slug names a layer (`tests`, `snaps`, `types`, `contracts`, `daos`) | the slug gave it away. cut again through domains |
| a glob names a test or snapshot suffix with no domain path ahead of it | the scope is a layer. prefix the domain |

blocker: a partition scoped to one horizontal layer · a test partitioned apart from the code it
asserts on (contract-level tests per surface excepted) · shared context declared as a partition of
its own rather than an overlap.

⇒ see also: `rule.require.vertical-partitions` (the positive peer — where the seams sit) ·
`howto.partition-an-overflowed-review` (the mechanism).
