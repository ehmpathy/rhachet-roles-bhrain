# domain.term: inventory

term.chosen   = inventory
term.kind     = noun
term.boundary = itemization
term.synonyms.forbidden:
- registry
- manifest
- enumeration
- list

## .what
an `inventory` is **the exhaustive enumeration of a concept's entries, by reference only** — one
address per entry, no preview.

```
inventory.of=$concept/$dimension=$position[.$dimension=$position]*.md
```

it is what `itemize` produces. `inventory` is the noun; `itemize` is the verb.

🟡 `catalog` is not a forbidden synonym — it is the near neighbor one axis away.

- a catalog is an inventory plus a preview of each entry
- the line is drawn in the reason file
  - ⇒ a real distinction, never a hierarchy of quality

## .the pairs

| verb | noun | each entry carries |
|---|---|---|
| **itemize** | **inventory** | a reference |
| **catalogize** | **catalog** | a reference **+ a preview** |

## .refs
where the term composes declared contracts:
- src/domain.roles/librarian/briefs/knowledge/kno601.inventories._.kind=article.md
- src/domain.roles/librarian/briefs/rule.require.inventory-for-enumerable-concepts.md
- src/domain.roles/librarian/briefs/rule.forbid.itemization-without-coordinates.md
- src/domain.roles/librarian/briefs/howto.curate-an-inventory.md
- .agent/repo=.this/role=any/briefs/domain.terms/          # this glossary IS an inventory
- src/domain.roles/learner/briefs/rule.require.domain-term-itemization.md   # its gap check

## .reason
see the ref-level cluster beside this choice:
- `term=itemization.inventory._.choice.reason.md` — etymology, and the inventory/catalog line
- `term=itemization.itemize._.choice.reason.md` — the verb it pairs with
