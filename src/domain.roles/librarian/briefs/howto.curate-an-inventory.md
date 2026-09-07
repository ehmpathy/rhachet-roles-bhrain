# howto: curate an inventory 📚

## .what
the moves that take a concept from "we know some of its entries" to an addressable census.

## .why

- an inventory's value is its **completeness** and its addressability
- both are properties of how it is BUILT, never of how carefully it is written
- ⇒ so the moves matter, and `kno601.inventories._.kind=article` carries the full why

---

## the moves

### 1. test that the concept is inventoriable — before any file

> **can you name the dimensions, and are the positions on each closed?**

- **closed** — `status` ∈ {QUEUED, CLAIMED, DELIVERED}. every position is known
- **open** — `topic` ∈ {…whatever anyone writes about}. not inventoriable

⛔ if any dimension is open, **stop**:

- build a catalog of what is known, or an `example=` set
- ⇒ a census claimed over an open dimension reports gaps that may not exist

### 1b. then pick the archetype — inventory or catalog

> **does a reader need a preview of each entry, or only its address?**

- an address suffices → **inventory**. ref-only, so it scales without bound at the `ref` tier
- they need each member's shape at once → **catalog**. a catalog is an inventory plus a preview
  per entry; the previews cost more and buy a dereference saved

🟡 this is a **budget** call, not a rigor call — both enumerate fully. and it is the axis that
separates the two archetypes, so decide it here rather than let previews accrete later.

### 2. name the dimensions, not the entries

this is the move that separates an inventory from a list. do not start from the entries you have
and group them — **start from the axes and generate the cells.**

```
concept  = radio task lifecycle transition
dimension.from = QUEUED | CLAIMED | DELIVERED
dimension.into = QUEUED | CLAIMED | DELIVERED
```

⇒ the axes now generate 9 cells. **you have not looked at a single entry yet, and you already
know how many there should be.** that is the property a grouped list can never have.

### 3. generate the space, then walk it

write the cell list from the product of the axes. for each cell, one of three outcomes:

| outcome | what it means | what you write |
|---|---|---|
| **occupied** | an entry exists | the entry's file |
| **forbidden** | the combination cannot exist | an invariant — record it, do not skip it |
| **empty** | it could exist and does not | 🔴 **a gap** — the inventory's most valuable output |

🟡 **the empty cells are the point.** a grouped list would never have surfaced them. do not
quietly omit a cell because you found no entry — an omitted cell reverts the inventory to a
catalog, and its census claim silently becomes false.

### 4. address each entry by its coordinates

one file per cell, coordinates in the filename, per
`rule.forbid.itemization-without-coordinates`:

```
inventory.of=radio-task-transition._.md                              # the summary
inventory.of=radio-task-transition.from=QUEUED.into=CLAIMED.md       # occupied
inventory.of=radio-task-transition.from=QUEUED.into=DELIVERED.md     # forbidden — the invariant lives here
inventory.of=radio-task-transition.from=CLAIMED.into=DELIVERED.md    # occupied
```

🟡 **a flat cluster, never a directory.** the summary takes `._.` and its entries are its peers
(`rule.require.summary-at-the-cluster-root`) — which is what lets a reader compute the summary's
path from the concept alone.

order the dimensions **consistently** across every file in one inventory (`from=` before `into=`,
always). a stable order is what makes the path computable, and a computable path is the whole
dereference benefit.

### 5. keep the summary a pure index

`inventory.of=$concept._.md` holds: the dimensions, their positions, the cell count, and the
gap list. **no narrative about any single entry** — that belongs in the entry's own file.

this is `rule.require.catalog-is-an-index` applied to the inventory root, and the pressure is the
same one seed 359 measured: a root that absorbs entry narrative grows without bound and buries
the index every reader actually walks.

### 6. re-walk when a dimension gains a position

an inventory is only true for the axes it was built on. when a new position appears on a
dimension, the space grows by a whole slice — walk the new cells and classify each.

⇒ **a dimension that gains positions often is a dimension that was not closed.** if this recurs,
revisit move 1: the concept may not be inventoriable after all.

---

## the worked example — this repo's own glossary

`domain.terms/` is an inventory in all but name:

```
term=<x>._.choice._.md          # dimension: term=, facet: choice
term=<x>._.choice.reason.md
term=<x>._.choice.example=<abc>.md
```

- **dimension** = `term=`, positions = the words this repo declares — **closed**, since the
  itemization rule defines exactly which words qualify
- **dereference** = a reader who knows the word knows the path. no search
- **gap** = a declared dobj/dop whose term has no cluster. `rule.require.domain-term-itemization`
  is precisely a gap check over this inventory

⇒ the pattern is proven here before it is prescribed. what this guide adds is the **explicit
dimension declaration** and the **gap walk** — the two moves `domain.terms/` does implicitly.

---

## the owl's wisdom 🦉

> a list tells you what was gathered.
> an inventory tells you what was never there.
>
> declare the axes first, and the empty shelves announce themselves. 🪷

## .see also

- `kno601.inventories._.kind=article` — what an inventory is and why it accrues + dereferences
- `rule.require.inventory-for-enumerable-concepts` — when one is owed
- `rule.forbid.itemization-without-coordinates` — the naming contract
- `howto.dimensional-decomposition` (architect) — how to discover the axes
