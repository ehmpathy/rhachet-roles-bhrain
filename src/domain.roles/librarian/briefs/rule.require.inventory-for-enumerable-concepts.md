# rule.require.inventory-for-enumerable-concepts

## .what

when a concept's entries are **enumerable** — its dimensions are nameable and each dimension's
positions are closed — its documents must be curated as an **inventory**: one file per cell,
addressed by coordinates, with every cell of the generated space accounted for.

a prose list, a grouped section, or a partial catalog over an enumerable concept is a **defect**,
not a stylistic choice.

## .why

`kno601.inventories._.kind=article` carries the full argument. the two that make this a rule rather
than a preference:

- **absence becomes visible.** an inventory generates its cells from the axes *before* entries are
  collected, so an empty cell is a gap. a list can never report absence — in a list, "not there"
  and "nobody looked" are indistinguishable
- **lookup becomes an address.** a reader who knows the coordinates computes the path. no grep, no
  ranked candidates, no judgment — which is the same energy saved that
  `philosophy.entoolment-is-the-pinnacle` argues for, applied to knowledge rather than tactics
- **it scales without bound.** an inventory is **ref-only** — one address per entry, no preview —
  so it grows to any size at a fixed cost per entry. that is what earns it the `ref` tier

⇒ the cost is one walk of the axes. the benefit is paid on every future read and every future gap.

## .the cues — when → then

| when… | then… |
|---|---|
| you write a doc that **enumerates** members of one concept | ask move 1 of `howto.curate-an-inventory`: are the dimensions closed? |
| you find yourself with a **grouped list** whose groups are a dimension | the groups ARE an axis — the list wants to be an inventory |
| you add the **Nth entry** to a doc that already lists N-1 | 🔴 an accretion path. stop and ask whether the space is generable |
| a reader must **grep** to find one member | the members are not addressed — coordinates would remove the search |
| you say *"the possible values are …"* out loud | you just declared a closed dimension |
| a doc's sections read `## $x` where every `$x` is one position | the section headers are coordinates in prose form |

## .the test — forced articulation

before the doc lands, answer both, on the page:

> **1. "what are the dimensions, and what are the positions on each?"**

if you cannot list them → the concept is **not** inventoriable. build a catalog or an `example=`
set, and this rule does not apply.

> **2. "how many cells does that generate, and how many are occupied?"**

if those two numbers are equal, say so. if they differ, **the difference is the gap list, and it
is the most valuable output of the exercise.** a doc that cannot answer question 2 is a list in an
inventory's clothes.

🟡 answer 2 **in the root's index**, not in your head. an unwritten gap list decays to zero within
a round.

## .what it requires

1. **declare the axes** — the dimensions and their closed positions, in `inventory.of=$concept._.md`
2. **one file per cell**, named per `rule.forbid.itemization-without-coordinates`
3. **classify every cell** — occupied, forbidden (an invariant), or empty (a gap). never omit one
4. **keep the summary an index** — the axes, the counts, the gaps. no per-entry narrative
5. **re-walk on a new position** — a dimension that grows adds a slice; walk it

🟡 **1 and 2 are both owed, always.** a summary with no per-cell files indexes a set that has no
addresses; cells with no summary have no place to declare their axes or their gaps.

## .the boundary — where this rule stops

| the concept | the artifact | why |
|---|---|---|
| dimensions closed + an address suffices per entry | **inventory** | refs only; it scales without bound at the `ref` tier |
| dimensions closed + the reader needs each member's shape at once | **catalog** | a catalog is an inventory **plus a preview per entry** — it buys a dereference saved |
| dimensions open-ended | **catalog** of what is known | a census is not deliverable, so do not claim one |
| **occurrences on a declared axis** | **inventory** over that axis | see *the occurrence axis*, below |
| occurrences sampled, no axis declared | **`example=$id` files** | samples accrue against no dimension, so there is no set to take a census of |

### 🟡 the occurrence axis — "enumerable" does not mean "enumerable in advance"

this rule's name invites a misread, and the misread costs a real artifact: *"my entries arise one
at a time and I could not have predicted them, so my concept is not enumerable, so this rule does
not apply."*

**it applies.** an occurrence dimension — `case`, an incident id, a review round — is a real axis
whose positions are **declared by the summary as they arise**. completeness is then checked
against *the positions the summary declares*, never against a pre-generated cross-product.

⇒ **an inventory does not require that its axes be enumerable in advance. it requires that its
entries be ADDRESSABLE and its gaps be CHECKABLE** (`term=inventory`). both hold on an occurrence
axis: `case=$id` computes to one path, and the census is a `Glob` — every position the summary
declares has a file, and every file is in the summary.

🟡 **the failure this prevents is a coined synonym.** a reader who concludes *"this cannot be an
inventory"* names their artifact by some other word — a `register`, a `log`, a `fulcrums.md` —
and that is one concept under a second word, which `rule.forbid.domain-term-synonyms` forbids
outright.

🟡 **inventory and catalog are not partial-vs-complete.** both enumerate fully; they differ in
**what each entry carries** (`kno601.inventories._.kind=article`). the choice between them is a
budget call, not a rigor call:

- **an inventory with previews** is a catalog that has not admitted it — it will grow past its
  budget while still filed as cheap
- **a catalog with no previews** is an inventory with extra ceremony

🟡 **and do not force either onto an open concept.** a census claimed over an open dimension
reports gaps that may not exist.

## .enforcement

- a doc that enumerates an **enumerable** concept as prose or a grouped list = **blocker**
- an inventory whose root declares no dimensions and positions = **blocker**
- an inventory with a silently omitted cell (neither occupied, forbidden, nor named a gap) =
  **blocker** — the omission voids the census claim
- an inventory over a dimension with open positions = **blocker** (it is a catalog)
- an **occurrence** set filed under a coined name (`register`, `log`, a prose filename) because
  its axis was not enumerable in advance = **blocker** — it is an inventory over that axis
- per-entry narrative in the inventory root = **blocker** (eject it to the entry's file)
- an inventory whose entries carry **previews** rather than references = **blocker** — it is a
  catalog filed as an inventory, and its budget claim is false

## .see also

- `kno601.inventories._.kind=article` — the why
- `howto.curate-an-inventory` — the moves
- `rule.forbid.itemization-without-coordinates` — the naming contract
- `rule.require.catalog-is-an-index` — the peer discipline for open-membership docs
- `rule.require.domain-term-itemization` (learner) — a gap check over this repo's own inventory
