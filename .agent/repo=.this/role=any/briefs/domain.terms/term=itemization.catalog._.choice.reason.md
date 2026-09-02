# domain.term.choice.reason: catalog

## .etymology

**catalog** — from greek *katalogos*, a register, from *katalegein* (to list, to recount fully).
the *kata-* prefix carries *"through, completely"*, so the word's own root claims a **full** recount
rather than a sample. that is the property it shares with `inventory`, and it is why the two could
not be parted on completeness.

what the word adds beyond the census is the *legein* half — **to recount, to tell**. a catalog does
not merely name its members; it says a word about each. a mail-order catalog with a bare list of
part numbers is not a catalog, and every reader knows it at a glance.

⇒ **the preview is not an embellishment of the census. it is what the word means.**

## ⚠️ .the line vs `inventory` is settled NEXT DOOR — do not restate it here

the axis, the trap, the cost each pays, and the two failure modes are argued in full at
`term=itemization.inventory._.choice.reason.md` (`.inventory vs catalog — the line`). that file is
the record, and this one cites it.

⚠️ **a second copy of that argument would drift from the first**, which is the exact defect
`rule.forbid.domain-term-synonyms` guards and `rule.require.catalog-is-an-index` names in another
form. the one-line residue, for a reader who arrived here first:

> an inventory's entry is an **address**. a catalog's entry is an address **plus a preview**.
> both take a full census; they differ in what a reader pays to use them.

## .the coinage — the wisher's, verbatim

settled 2026-08-13, in the round that paved `inventory`:

> *"catalog is more of an inventory + minor demos; e.g., gives you a visual for the concept"*
>
> *"inventory is ref only"*
>
> *"catalog = ref w/ preview of each concept"*

⇒ **the third line is the definition.** the term was not derived by a driver and then approved —
the axis that parts the pair arrived in the wisher's own words, and the two clusters were written
to it. the seed is `.behavior/*/.seeds/inventory.of=seeds.case=S03-inventory-vs-catalog.md`.

⚠️ **`catalog` was the ELDER of the pair and stayed undeclared for eighteen days.** it is a declared
archetype in the librarian's taxonomy (`kno201.documents._.[catalog]`), it named six live artifacts
in this repo, and its contrast partner got a cluster while it did not. that is what a **census over
the glossary itself** catches and a read of any one term does not
(`rule.require.domain-term-itemization`).

## .why not the rejected synonyms

- **index** — names the **summary half only**. a catalog is the summary *plus* one entry per member
  (`rule.forbid.itemization-without-coordinates`: both files are owed, always). to call the whole
  artifact an index is to name a set by one of its two parts.
  ⚠️ **and the word does real work elsewhere in its true sense** —
  `rule.require.catalog-is-an-index` says a catalog's *summary* is an index. to make `index` the
  noun for the whole artifact would make that rule read *"a catalog is a catalog"*
- **registry** — implies an **authority that admits members**: an actor registers an entry, and the
  entry is in because it was granted entry. a catalog claims a **census** — every member is in
  because it exists, and a gate would make the census a policy statement rather than a fact.
  ⚠️ this is the same near-miss `inventory` rejects, and for the same reason; the two share the
  boundary, so they share its forbidden neighbours
- **directory** — a filesystem word, and **this repo dereferences by path everywhere**. a term that
  collides with the substrate its own artifacts live on is unusable in prose: *"the catalog's
  directory"* would read two ways in every sentence (`rule.forbid.ambiguous-labels`)
- **listing** — a gerund noun, forbidden outright by `rule.forbid.gerunds` (ehmpathy/mechanic). and
  it is vague on both axes at once: silent on the census, silent on the preview
- **manifest** — names a **declaration of contents for transport** — what is in the box, for
  whoever receives it. a catalog is read by someone who must decide *which* member they want, which
  is the opposite errand. and the word is already taken in this org's tools (`rhachet.repo.yml`,
  `keyrack.yml`), so reuse would overload

## .disputes

none raised against `catalog` itself.

⚠️ **the dispute that settled this pair was raised against `inventory`**, and it is recorded there:
`term=itemization.inventory._.choice.reason.md`, *dispute: catalog — raised 2026-08-13 — RESOLVED
(both stand; the line is per-entry content)*. its resolution binds this cluster equally — **`catalog`
⊃ `inventory` on the preview axis, and neither is forbidden.**

## .evidence

- **the coinage is on record verbatim**, in the wisher's own words, in the seed cited above — the
  strongest evidence a term choice can carry (`rule.require.persist-domain-term-evidence`)
- **the archetype predates the term cluster.** `kno201.documents._.[catalog]` declares catalog as
  one of four document archetypes — *"organizational: maps how instances or sub-concepts relate"* —
  beside article, demo, and lesson. this cluster does not coin the word; it settles the word's
  **boundary** and the axis that parts it from a near-neighbour the taxonomy did not have
- **the boundary is `itemization`, and it is the SAME ancestor `inventory` takes.** that is the
  claim: a catalog and an inventory are two shapes of one act — to itemize an enumerable set. a
  boundary that parted them would assert two acts and would be wrong
  (`rule.require.boundary-qualified-terms`)
- **live instances in this repo, six of them**, all under the coordinate contract:
  `domain.glyphs/catalog.of=glyph._.md` plus five `axis=` entries;
  `learner/briefs/catalog.of=externalization._.md`
- **the shape rule was earned by a measured failure**, not by taste:
  `rule.require.catalog-is-an-index.example=declastruct-aws-security-catalog.md` — ~2,950 lines of
  per-member narrative wrapped around a 28-row index. **the artifact got harder to use as it got
  more complete**, which is the signature of a catalog that lost its index
- **invariant:** a catalog owes **both** files — `catalog.of=$concept._.md` and one
  `catalog.of=$concept.$dimension=$position.md` per member. a summary alone is an index with no
  addresses; entries alone declare no axis and report no gaps
  (`rule.forbid.itemization-without-coordinates`)
- **invariant:** a catalog's summary carries **one row per member and no narrative about any one of
  them**. a `###` section about a single member is the accretion defect, and its repair is an
  **ejection** to that member's own file, never a trim (`rule.require.catalog-is-an-index`)
