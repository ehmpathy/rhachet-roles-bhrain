# rule.forbid.itemization-without-coordinates

## .what

> **whenever you itemize an enumerable concept, the artifact is named by its coordinates.**

every segment of the name is a `$key=$value` pair. a bare word is a violation.

```
$kind.of=$concept._.md                   # the SUMMARY — the axes, the counts, the gaps
$kind.of=$concept.$dimension=$position.md   # one ENTRY per member — always, never optional
```

🟡 **the artifact KIND does not change the convention.** an inventory and a catalog are both
itemizations of an enumerable concept, and **both take this one name.** the kind decides what each
entry *carries*; the coordinates decide where each entry *sits*:

```
inventory.of=fulcrums._.md              catalog.of=archetype._.md
inventory.of=fulcrums.case=F14.md       catalog.of=archetype.kind=article.md
```

**both files are owed, always.** a summary with no entries is a list wearing a manifest's name; an
entry set with no summary has no place to declare its axes, its counts, or its gaps.

⇒ this composes two extant conventions rather than coining a third:

| the piece | the convention it reuses |
|---|---|
| `._.md` for the summary | `rule.require.summary-at-the-cluster-root` |
| `$dimension=$position` for each entry | **this rule** — the coordinate contract |

## .the parts

- the **concept** is always declared as `of=$concept` — it is a coordinate like any other
- the **summary** takes `._.` as its final segment, per the cluster-root convention
- each **entry** declares its cell: `$dimension=$position` segments, dot-joined, in one fixed order
- `case=$case` is the dimension a set of **occurrences** sits on — see `.the case dimension`, below

a prose filename, a numbered filename, or a filename that carries only the position without its
dimension = **defect**.

🟡 **`example=$id` is the same coordinate form**, already in use by `term=$x._.choice.example=$id`
and prescribed by `rule.require.rules-are-clusters`. it is one discipline across every itemization
this repo keeps, never three conventions that happen to rhyme.

## .the test

> **"am i about to itemize an enumerable concept?"**

- yes → **the name is coordinates, and both files are owed.** pick the kind by
  `rule.require.inventory-for-enumerable-concepts`, then name it per the block above
- no — this is prose, a lesson, a philosophy → the convention does not apply

🟡 **the trap is that the kind question feels like the name question, and it is not.** a reader who
settles *"inventory or catalog?"* feels finished and reaches for a name freely — which is how
`register.md` and `fulcrums.md` get written. **the kind was never the name decision.** the name is
coordinates in every branch, so it can be settled before the kind is.

## .why

the coordinates are not decoration — **they are the dereference mechanism**, and the entire value
of an itemization rests on them:

- **the path is computable.** a reader who knows the coordinates knows the filename, with no
  search. the moment a name is prose, the reader must scan and judge — and the constant-cost
  lookup becomes a linear hunt (`kno601.inventories._.kind=article`)
- **the dimension names itself.** `status=QUEUED.md` says which axis `QUEUED` sits on;
  `queued.md` does not. one is addressable, the other must be interpreted
- **completeness becomes checkable.** a machine can generate the expected filenames from the axes
  the summary declares, and diff them against disk. **the gap check is a `Glob`, not a read** —
  which is the entoolment of the census itself
- **slices are globbable.** `*.from=QUEUED.*` returns a whole row. prose names cannot be sliced

⇒ prose names do not merely read worse. they **delete the four properties** an itemization exists
to provide.

## .the case dimension

when the members are **occurrences** rather than cells of a product — a fulcrum decided mid-drive,
an incident, a review round — the dimension is `case`:

```
inventory.of=fulcrums._.md          # the axes: id, rework, status. the counts. the gaps
inventory.of=fulcrums.case=F14.md   # one occurrence, its full record
inventory.of=fulcrums.case=F15.md
```

`case=` names the axis explicitly, so the id is an address rather than a bare label. `*.case=*.md`
returns every occurrence.

### 🟡 an ordinal is not an id — it needs a slug beside it

```
👎  case=F14                                        # F14 of WHAT?
👍  case=F14-entoolment-ladder-is-fluid-rigid-solid
```

the two halves do different jobs, and to drop either costs a real property:

| half | holds | lost without it |
|---|---|---|
| the **ordinal** | the order the occurrence arose | the sequence, which is what makes an append-only record auditable |
| the **slug** | what the occurrence IS | a reader must open every file to find the one they want |

⇒ **a bare ordinal is the `1.`/`2.`/`3.` defect under a `case=` prefix.** it satisfies the letter
of the coordinate form and delivers none of what the form is for: the path is computable only if
you already know which number you want, which is the search the address was meant to retire.

🟡 **join the two with a hyphen, never a dot.** a dot is the segment separator, so
`case=F14.entoolment-ladder` parses as a second coordinate with no dimension — a bare position,
which this rule forbids outright.

## .the cues — when → then

| when… | then… |
|---|---|
| you name an entry file after **what it is about** | 🔴 stop — name it after **where it sits** |
| a filename holds a value with no `$dimension=` prefix | the axis is implied; make it explicit |
| you write a summary and stop there | 🔴 the entries are owed too — a summary alone is a list |
| you write entries and stop there | 🔴 the summary is owed too — the axes and gaps have no home |
| you reach for `1.`, `2.`, `3.` prefixes to order entries | ordinals are not coordinates — order belongs in the summary |
| two entries list their dimensions in **different order** | the path stops being computable — pick one order, apply it everywhere |
| you want a file for a cell that cannot exist | it is **forbidden**, and it still gets its coordinate file, which holds the invariant |

## .examples

### 👎 bad — prose names, no coordinates, no summary

```
radio-task-transitions/
  queued-to-claimed.md        # which dimension is "queued"? from, or into?
  the-invalid-one.md          # invalid how? unaddressable
  2.delivered.md              # an ordinal, plus a bare position
```

a reader who wants *"QUEUED → DELIVERED"* must open files to find out which is which. the set is
organized and **not** addressable, and no file declares what the axes are.

### 👍 good — a summary plus one entry per cell

```
inventory.of=radio-task-transition._.md                      # the axes, the counts, the gaps
inventory.of=radio-task-transition.from=QUEUED.into=CLAIMED.md      # occupied
inventory.of=radio-task-transition.from=QUEUED.into=DELIVERED.md    # forbidden — the invariant lives here
inventory.of=radio-task-transition.from=CLAIMED.into=DELIVERED.md   # occupied
```

the path for *"QUEUED → DELIVERED"* is computed, never searched. `*.from=QUEUED.*` returns the row,
and `*.of=radio-task-transition.*` returns the whole set including its summary.

### 👍 good — one dimension is enough

a single-axis itemization is still an itemization, and it still owes both files:

```
inventory.of=exit-code-class._.md
inventory.of=exit-code-class.code=0.md
inventory.of=exit-code-class.code=2.md
inventory.of=exit-code-class.code=other.md
```

## .the precedent

this is the repo's own established idiom, generalized — not a new convention:

```
.agent/repo=bhrain/role=learner/     # repo= and role= are coordinates
domain.terms/term=<x>._.choice.*     # term= is a coordinate, and ._. is the cluster root
review/self/for.1.vision._.r4.$slug  # the guard computes this path, and demands it exactly
```

⇒ the review-artifact path is the sharpest precedent: **the guard rejects a file written to the
wrong coordinates**, because it looks precisely at the computed path. that is the dereference
contract enforced by a tool — and it is what this rule protects for the librarian's itemizations.

## .enforcement

- an entry whose filename is not entirely `$dimension=$position` segments = **blocker**
- a bare position with no `$dimension=` prefix = **blocker**
- a summary with no per-entry files = **blocker** — the summary indexes a set that has no addresses
- entries with no `._.md` summary = **blocker** — the axes, the counts, and the gaps have no home
- inconsistent dimension order across one itemization = **blocker** (the path stops being computable)
- ordinal prefixes (`1.`, `2.`) on entries = **blocker** (order belongs in the summary)
- an occurrence id that is a **bare ordinal** (`case=F14`) with no slug = **blocker** — the number
  keeps the sequence and carries no sense, so the path is computable only by someone who already
  knows the answer
- a forbidden cell with no file = **blocker** — the invariant needs its coordinate home too
- an itemization filed under a prose name (`catalog.md`, `register.md`, `fulcrums.md`) rather than
  `$kind.of=$concept._.md` = **blocker** — the concept it indexes must be in its address
- an ejected member record named anything but a coordinate (`example=$id`, `case=$case`) =
  **blocker** — the id is the citation (`rule.require.rules-are-clusters`)

## .see also

- `rule.require.summary-at-the-cluster-root` — the `._.md` half of this name
- `kno601.inventories._.kind=article` — why dereference is the point
- `rule.require.inventory-for-enumerable-concepts` — when an inventory is owed
- `rule.require.catalog-is-an-index` — what a catalog's summary carries
- `howto.curate-an-inventory` — the moves, and the consistent dimension order
