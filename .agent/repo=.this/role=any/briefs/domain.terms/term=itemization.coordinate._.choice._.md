# domain.term: coordinate

term.chosen   = coordinate
term.kind     = noun
term.boundary = itemization
term.synonyms.forbidden:
- label
- tag
- slug
- prefix
- qualifier

## .what

a **coordinate** is one `$key=$value` pair in a name, where the **key names an axis** and the
**value names a position on that axis**.

```
from=QUEUED          # axis = from · position = QUEUED
role=learner         # axis = role · position = learner
of=fulcrum           # axis = of   · position = fulcrum
```

⇒ **coordinates turn a name into an ADDRESS.** an address is *computed*; a prose name is
*searched*. that difference is the whole reason the convention exists.

## .the contrast that defines it — a coordinate vs a label

a **label** carries a value with no axis. it reads to a human and dereferences for nobody.

```
👎  queued.md          # a label — queued on WHICH axis? from? into? status?
👍  from=QUEUED.md     # a coordinate — the axis is in the name
```

the label is not merely terser. it has **lost the axis**, and with it four properties:

| property | a coordinate | a label |
|---|---|---|
| the path is **computable** | yes — know the axis + position, know the filename | no — you must scan and judge |
| the axis is **self-declared** | `status=QUEUED` says which axis `QUEUED` sits on | `queued` does not |
| a slice is **globbable** | `from=QUEUED.*` returns a whole row | there is no row to return |
| absence is **checkable** | generate the expected names, diff against disk | you cannot diff against a guess |

## .coordinate vs dimension vs position

three words, one structure. keep them distinct:

| word | what it names | in `from=QUEUED` |
|---|---|---|
| **dimension** (the axis) | the key | `from` |
| **position** | the value on that axis | `QUEUED` |
| **coordinate** | the **pair** | `from=QUEUED` |

**coordinates** (plural) = every pair in one name, which together form the address.

## .where it is already the convention

this is not a new form. it is what this repo already does, in every tree:

```
.agent/repo=bhrain/role=learner/            # repo= and role=
domain.terms/term=route.stone._.choice.example=$id.md   # term= and example=
inventory.of=$concept/from=QUEUED.into=CLAIMED.md # of=, from=, into=
$topic.kind=seed.by_human.md                # kind=
catalog.of=fulcrum.md                       # of=
```

## .refs
where the term composes declared contracts:
- src/domain.roles/librarian/briefs/rule.forbid.itemization-without-coordinates.md  # the rule named for it
- src/domain.roles/librarian/briefs/rule.require.summary-at-the-cluster-root.md     # the `._.` half of the name
- src/domain.roles/librarian/briefs/rule.require.catalog-is-an-index.md             # the catalog form
- src/domain.roles/librarian/briefs/rule.forbid.brackets-in-filenames.md            # `kind=` over `[…]`
- src/domain.roles/librarian/briefs/rule.require.rules-are-clusters.md              # `example=$id`
- src/domain.roles/learner/briefs/rule.require.boundary-qualified-terms.md          # the term-name axis
- .agent/repo=.this/role=any/briefs/domain.terms/                                   # `term=` itself

## .reason
see the ref-level cluster beside this choice:
- `term=itemization.coordinate._.choice.reason.md` — etymology, why not `label`/`tag`, and the axis argument
- `term=itemization.inventory._.choice.reason.md` — where the path contract was first specified
