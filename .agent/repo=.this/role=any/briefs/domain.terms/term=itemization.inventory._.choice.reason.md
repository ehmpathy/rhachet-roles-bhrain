# domain.term.choice.reason: inventory

## .etymology

**inventory** — from latin *inventarium*, a list of what is found, from *invenire* (to come upon).
in its ordinary sense it already carries the property that earns it here: **a stocktake is
exhaustive.** a shop's inventory that omits a shelf is not a partial inventory — it is a wrong one.

it enumerates **what** is held and **where** it sits. it does not describe each item, and that
restraint is the term's whole character.

## 🟡 .inventory vs catalog — the line

`catalog` is a **declared archetype** in the librarian's taxonomy
(`kno201.documents._.[catalog]`), so a new near-neighbor must earn its separation. it does, on one
axis: **what each entry carries.**

| | enumerates | each entry carries | a reader gets |
|---|---|---|---|
| **inventory** | every entry | **a reference only** | the address. dereference to learn more |
| **catalog** | every entry | a reference **+ a preview** | a feel for each concept **without** a dereference |

> **a catalog is an inventory plus minor demos.** the preview is a small materialization — one
> line, one visual, one *what it is*
> — quoted from `kno601.inventories._.kind=article`, which declares the archetype; amend it there

### 🟡 the trap — a reader will draw the line at COMPLETENESS, and be wrong

the available line is *"a catalog indexes what was found; an inventory claims a census"*. it is
intuitive and it does not hold:

- **completeness is common to both.** the periodic table and *Systema Naturae* — the librarian's
  own catalog exemplars — are exhaustive by intent. a catalog is not a partial inventory
- completeness is a claim about the world; per-entry content is a property of the document.
  a reviewer can check the second with a read, and can never fully check the first
- ⇒ a line verifiable by a read beats a line verifiable only by a survey
  (`rule.forbid.ambiguous-labels`: a label must read exactly one way)

### the cost each pays, and the two failure modes

⇒ both are declared in `kno601.inventories._.kind=article` under `.the cost each pays` and
`.the two failure modes`, and are not restated here.

what this cluster adds: that cost table **is** the say/ref policy `role=any/boot.yml:22-30`
already states, applied to document archetypes rather than to boot lists. so the word carries a
tier with it — reach for `inventory` and you have chosen `ref`.

## 🟡 .an axis need not be enumerable IN ADVANCE — the occurrence axis

the strongest available objection to the term runs:

> *an inventory generates its cells from the axes before entries are collected, so an empty cell
> is a gap. where entries arise one at a time and could not be predicted, an absent entry is not
> a gap — it is an entry that never arose. so it cannot be an inventory.*

**it holds for a PRODUCT of closed axes, and fails for an OCCURRENCE axis.** an occurrence
dimension — `case`, an incident id, a review round — is a real dimension whose positions are
**declared by the summary as they arise**. completeness is then checked against *the positions the
summary declares*, never against a pre-generated cross-product.

⇒ **an inventory does not require that its axes be enumerable in advance. it requires that its
entries be ADDRESSABLE and its gaps be CHECKABLE.**

both properties survive an occurrence axis, and both are what the term is for:

| the requirement | how an occurrence axis meets it |
|---|---|
| **addressable** | `case=$id` computes to exactly one path; `*.case=*.md` returns the whole set |
| **checkable** | a `Glob`: every position the summary declares has a file, and every file is in the summary |

🟡 **and this is precisely why `registry` remains a forbidden synonym here** — see below. an
occurrence axis is the case where `registry` reads most plausible, and it is still wrong: the
entries are **addressed by a declared dimension**, never merely appended by whoever arrived.

## .the verb it pairs with

**`itemize` → `inventory`**, exactly as `catalogize` → `catalog`.

- the verb was already declared here — `rule.require.domain-term-itemization`
- the noun for its output was the gap this cluster fills
- ⇒ see `term=itemization.itemize._.choice.reason.md`

## .why not the other rejected synonyms

- **registry** — 🟡 the sharpest near-miss the cluster has
  - it names an **append**: an actor puts an entry in, and its place is the order it arrived
  - an inventory's entries sit at a **coordinate on a declared dimension**, so their place is
    computed rather than granted
  - it fires hardest on an occurrence axis, where entries genuinely do arrive one at a time — and
    it is still wrong there: the summary declares `case` as a dimension, so an entry is addressed
    (`*.case=$id.md`) and the set's gaps are checkable
  - ⇒ a registry offers neither, and it is forbidden in every branch
- **manifest** — already taken in this org's tools: `rhachet.repo.yml` is a generated manifest,
  `keyrack.yml` a credential manifest. one concept, one word, so reuse here would overload
- **enumeration** — names the *act*, never the artifact, and reads as a code construct (an enum).
  the positions on a dimension may be an enum; the inventory is the document set over their product
- **list** — silent on both exhaustiveness and address. every rejected word above is at least
  specific; `list` is the generic that would erase the whole cluster

## .disputes

### dispute: catalog  —  raised 2026-08-13  —  status: RESOLVED (both stand; the line is per-entry content)
- raised.by  = driver, mid `feat-adopt-seeded-briefs`, at the wisher's prompt to *"reconcile
               inventory vs catalog"*
- claim      = `inventory` is a synonym of the extant declared `catalog` and should be forbidden
- counter    = they differ in **what each entry carries**: an inventory holds references only; a
               catalog holds references plus a preview per entry. the wisher's words:
               *"catalog is more of an inventory + minor demos; e.g., gives you a visual for the
               concept"*, *"inventory is ref only"*, *"catalog = ref w/ preview of each concept"*
- resolution = both stand, neither forbidden. `catalog` ⊃ `inventory` on the preview axis. the
               driver's earlier completeness-based line is **retracted** — completeness is common
               to both, and the per-entry-content line is checkable by a read where completeness
               is not. dispute closed

## .evidence

- **the wisher's ask (2026-08-13)**: *"the learner should aim to learn inventories of concepts,
  when a concept has enumerable entries … because of its benefits in accrual of knowledge and
  dereference lookup"* — the two named benefits are the article's spine
- **the path contract was specified by the wisher**, not derived:
  `inventory.of=$concept/$dimension=$position[.$dimension=$position]?+.md` — hence
  `rule.forbid.itemization-without-coordinates` as a peer of the require rule. that rule is named
  for the act, not the artifact: the same `$key=$value` contract binds `catalog.of=$concept.md`
  and `…example=$id.md`, so one name covers every itemization rather than one kind of it
- **precedent in this repo:** `domain.terms/` is itself an inventory — `term=` is the dimension,
  its positions are closed (the itemization rule defines which words qualify), and
  `rule.require.domain-term-itemization` is precisely a gap check over it. note it is
  ref-only in shape: the cluster root carries the data, and the depth lives in `.reason`
- **ancestry:** an inventory is a zwicky **morphological box** materialized as a filetree —
  dimensions on the axes, one cell per combination, forbidden combinations named as invariants.
  the architect's `howto.dimensional-decomposition` discovers the axes; the inventory persists them
- **invariant:** `inventory` names a document archetype of THIS org's knowledge taxonomy,
  published via `dist/` in the librarian's booted briefs — it sits beside article, catalog, demo,
  and lesson
