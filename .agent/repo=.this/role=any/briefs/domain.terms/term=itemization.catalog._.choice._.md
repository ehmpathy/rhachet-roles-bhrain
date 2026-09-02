# domain.term: catalog

term.chosen   = catalog
term.kind     = noun
term.boundary = itemization  # the same ancestor its contrast partner takes. a catalog and an
                             # inventory are two shapes of ONE act — to itemize an enumerable set
term.synonyms.forbidden:
- index        # forbidden AS A NAME for the artifact — it names the SUMMARY half only, and a
               # catalog is the summary plus one entry per member. ✅ lawful as a PREDICATE about
               # the summary's shape: `rule.require.catalog-is-an-index` says the summary is an
               # index (one row per member, no narrative), which is a claim, never a rename
- registry     # implies an authority that admits members; a catalog claims a census, never a gate
- directory    # a filesystem word, and this repo dereferences by path everywhere — it collides
- listing      # a gerund noun (`rule.forbid.gerunds`)
- manifest     # names a declaration of contents for transport, not a curated set

## .what

a **catalog** is an **inventory plus a preview of each entry** — the same census claim, with each
member's shape carried at the summary so a reader grasps the set without a dereference.

```
catalog.of=$concept._.md                     # the SUMMARY — the axes, one ROW PER MEMBER, the gaps
catalog.of=$concept.$dimension=$position.md  # one entry per member
```

⚠️ **both files are owed, always** — the same contract an inventory takes
(`rule.forbid.itemization-without-coordinates`). the kind decides what each entry **carries**; the
coordinates decide where each entry **sits**.

## .the one axis that parts it from `inventory`

| | inventory | catalog |
|---|---|---|
| each entry is | an **address** — a coordinate, no preview | an address **plus a preview** |
| the reader | dereferences the one they want | grasps the set at a glance |
| it costs | fixed per entry, so it scales without bound | grows with the set |
| its tier | `ref` | `ref`, and its summary earns `say` when the set is read often |

⇒ **the choice is a BUDGET call, never a rigor one.** both take a full census; they differ in what
a reader pays to use them. an inventory that carries previews is a catalog that has not admitted
it, and it will grow past the budget its name promised.

⚠️ **and a catalog is an INDEX — one row per member, no narrative about any one of them.** the
moment a `###` section about a single member lands in it, the index it advertises has become a
preamble to a logbook (`rule.require.catalog-is-an-index`, librarian).

## .refs

where the term composes declared contracts:
- src/domain.roles/librarian/briefs/rule.require.catalog-is-an-index.md          # the shape rule
- src/domain.roles/librarian/briefs/rule.require.inventory-for-enumerable-concepts.md  # the choice
- src/domain.roles/learner/briefs/catalog.of=externalization._.md                # the en- family
- .agent/repo=.this/role=any/briefs/domain.glyphs/catalog.of=glyph._.md          # the glyph register
- src/domain.roles/librarian/briefs/knowledge/kno201.documents._.[catalog].md    # the archetype

## .reason

see the ref-level cluster beside this choice:
- `term=itemization.catalog._.choice.reason.md` — the etymology, the wisher's coinage, and why it
  is a peer of `inventory` rather than a synonym
