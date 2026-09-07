# rule.prefer.decompose-a-subject-via-suffixes

## .what

> **when a subject grows a distinct sub-claim, EJECT it into a suffixed peer. do not accrete it
> inline.**

```
$subject._.md            # the root — the whole subject, and an index of its zoom-ins
$subject.$zoom.md        # one zoom-in per sub-claim, a PEER of the root
```

the root then carries a **pointer**, never the zoom's body:

```md
⇒ **the zoom-in is `$subject.$zoom.md`** — <the one line that says when to reach for it>
```

`rule.require.summary-at-the-cluster-root` governs the **name** once a split has happened. this
rule governs **whether to split**, and its answer is: prefer the split.

## .why — a zoom-in that lives inline is COSTED UPFRONT, forever

this is the whole argument, and it is a boot-economics one.

a booted brief is inlined into every session that loads its role. so **every line of a zoom-in
that sits inside its root is a token charged to every reader, on every boot, whether or not they
were the one reader that day who needed it.**

eject it, and the cost inverts:

| the zoom-in is | what a reader pays |
|---|---|
| **inline in the root** | its full body, **every boot**, whether or not they reach for it |
| **a suffixed peer at `ref`** | one path — and its body **only when they dereference it** |

⇒ **that is the dereference benefit `term=inventory` argues for, applied to a brief rather than a
filetree.** a root stays a fixed, small footprint; depth grows beside it without bound.

### and it is the same policy the boot lists already state

`role=any/boot.yml` declares it directly for the glossary — *"`say` holds a fixed, small
footprint … depth lives under `ref`, so it can grow without bound while every boot stays a fixed
size."* a suffixed zoom-in is what makes that policy **available to a brief**: with no split, the
only two options are *carry the depth at `say`* or *drop the depth entirely*.

## .the second why — accretion is what a root does when it cannot eject

a root that has nowhere to put a sub-claim **absorbs** it, and absorption is a one-way ratchet:

- each addition is locally correct, so no single edit is the defect
- the root grows on every round; the answer it exists to state does not
- eventually a reader cannot find the answer under the material about the answer

that is `rule.require.catalog-is-an-index`'s claim about a catalog, and
`rule.always.yield-the-output-not-the-archaeology`'s about a yield. **it is one claim about every
clustered artifact**, and the suffix is the mechanism that lets a root obey it.

## .the cues — when → then

| when… | then… |
|---|---|
| you are about to add a **`##` section** to a booted brief for a claim that holds on its own | 🔴 eject it to `$subject.$zoom.md` and leave a pointer |
| a section has grown its **own** subsections, examples, and enforcement lines | it is a brief. give it a filename |
| a reader would want that section **once**, not on every boot | that is the dereference case exactly — eject it |
| a section explains **WHY** a rule holds where the root states **WHAT** to do | the why is a zoom-in; the what is the root |
| you reach for a **new top-level name** for a sub-claim of an extant brief | 🔴 a peer name hides the parent. a suffix declares it |
| a subject genuinely has one claim and one shape | leave it. the rule fires on the **split**, never before |

## .the suffix names the ZOOM, not the ordinal

```
👎  philosophy.entoolment-is-the-pinnacle.2.md          # an ordinal — 2 of WHAT?
👎  philosophy.entoolment-is-the-pinnacle.more.md       # names no zoom
👍  philosophy.entoolment-is-the-pinnacle.via-routes.md # legible from a directory read
```

⇒ the same claim `rule.forbid.itemization-without-coordinates` makes about an ordinal id: a number
keeps a sequence and carries no sense, so the path is computable only by someone who already knows
the answer. **a suffix is an address; an ordinal is a counter.**

## 🟡 .a zoom-in is not a fork — it must not restate its root

a peer **forks** two ways: it **restates** the parent's claim in its own words, or it sits
**unlinked** from the parent. either way two files hold one claim, they drift, and the reader must
reconcile them.

⇒ so the pointer is owed in **both** directions. the root names the zoom by path and says when to
reach for it; the zoom names its root and says it is a zoom of it.

against the restate half: a zoom-in **assumes** its root and adds what the root does not carry:

| the root holds | the zoom-in holds |
|---|---|
| the claim, in the shortest form that stands alone | one facet of it, in depth |
| an index line per zoom-in | the worked cases, the counter-argument, the enforcement for that facet |
| the WHAT | the WHY, or the HOW, for one part |

## .examples

### 👍 good — a philosophy that split along one rung

```
philosophy.entoolment-is-the-pinnacle._.md            # the ladder, all five rungs
philosophy.entoolment-is-the-pinnacle.via-routes.md   # rung 3 in depth, where a route lives
```

the root keeps a five-line pointer at rung 3. a reader who wants the ladder pays for the ladder; a
reader who wants routes dereferences one path.

### 👍 good — a rule that split along its mechanical half

```
rule.always.converge-with-reviewers._.md                     # converge rather than escalate
rule.always.converge-with-reviewers.via-a-taken-per-point.md # the obligation each round imposes
```

### 👎 bad — the zoom accreted inline

a 129-line rule that grows a 44-line `## .the hard clause` with its own two subsections and its
own worked incident. every reader of the parent claim now boots the incident too.

## .enforcement

- a booted brief that accretes a **self-contained sub-claim** inline, where a suffixed peer would
  serve = **nitpick**
- a sub-claim given a **new top-level name** rather than a suffix of its parent = **blocker** — the
  relation is unrecoverable from the filename, and a reader will not find it
- a zoom-in with **no pointer** from its root, or no back-pointer to it = **blocker** — an unlinked
  peer is a fork, and forks drift
- a zoom-in that **restates** its root's claim = **blocker** — one claim, two files
- a suffix that is an **ordinal** or a non-name (`.2`, `.more`, `.extra`) = **blocker**
- a single-claim brief left whole = **false positive** — the rule fires on the split

## .see also

- `rule.require.summary-at-the-cluster-root` — the NAME once a split has happened; this is the
  WHETHER
- `rule.require.rules-are-clusters` — the same move for a rule and its occurrences
- `rule.require.catalog-is-an-index` — the same move for a catalog and its members
- `rule.forbid.itemization-without-coordinates` — why a suffix must name a zoom, never an ordinal
- `kno601.inventories._.kind=article` — the dereference benefit this applies to a brief
- `rule.always.yield-the-output-not-the-archaeology` (driver) — the same claim for a route yield
