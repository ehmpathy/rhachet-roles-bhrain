# rule.require.summary-at-the-cluster-root

## .what

> **when one subject splits into many subscopes, the summary is `$subject._.md` and each subscope
> is `$subject.$more.md`.**

```
$subject._.md          # the SUMMARY — what the whole subject is, and what its parts are
$subject.$zoom.md      # one zoom, one part, one facet
```

`._.` marks a **cluster root**: the file that stands for the whole, as a peer of its own parts.

## .why — the root must sort first, and it must be addressable

a subject that has split into parts needs a file that answers *"what is this, and what are its
pieces?"* — and that file has a hard requirement most names cannot meet: **it must be findable
without a read of every peer.**

`._.` delivers three properties at once:

| property | how `._.` gives it |
|---|---|
| **it sorts first** | `_` precedes every letter, so the root heads its own cluster in any directory read |
| **it is computable** | know the subject, know the summary's path — `$subject._.md`, with no search |
| **it is globbable** | `*._.md` returns every cluster root in a tree; `$subject.*` returns the whole cluster |

⇒ and the alternative names all fail one of the three. `$subject.readme.md` and
`$subject.overview.md` sort into the middle of their own parts and read as one more part.
`.readme.md` in a directory works only when the cluster **has** a directory — which most do not.

## 🟡 .the summary is a peer of its parts, never a parent of them

this is the property that makes the convention work in a **flat** tree, and it is the one most
often lost:

```
👍  term=route.stone._.choice._.md          # the root, a peer
    term=route.stone._.choice.reason.md
    term=route.stone._.choice.example=x.md

👎  term=stone/
      _.md                            # a directory, when the cluster did not need one
      reason.md
```

a directory is a real cost: it hides the cluster from a flat glob of its neighbors, and it forces
a `mkdir` before the second file can exist. **reach for a directory only when the cluster is large
enough that its parts crowd their neighbors out of a directory read.**

## .where it is already the convention

this is not a new form. it is what this repo already does:

```
term=route.stone._.choice._.md                     # the term-choice cluster root
kno601.inventories._.kind=article.md         # the article's root, beside its facets
kno201.documents._.kind=catalog.md
inventory.of=fulcrums._.md                   # the itemization summary
review/self/for.1.vision._.r4.$slug.md       # the guard computes this exact path
```

## .the cues — when → then

| when… | then… |
|---|---|
| a subject grows a **second** file | 🔴 that is the split. the first file becomes `$subject._.md` |
| you write `$subject.readme.md` or `$subject.overview.md` | rename it — the root has a name, and it sorts first |
| you write `$subject.md` beside `$subject.$zoom.md` | the bare name reads as one more zoom. mark the root |
| you reach for a **directory** for two files | do not — a flat cluster with a `._.` root costs less and globs better |
| you write an **itemization** | the summary is its cluster root (`rule.forbid.itemization-without-coordinates`) |

## .the test

> **"if a reader knew only the subject, could they compute the path to its summary?"**

- yes, it is `$subject._.md` → the root is marked
- no, they would have to read the directory and judge → the root is unmarked

## .what the summary carries

it describes the **whole**, and it indexes the parts. it does **not** narrate any one of them — a
root that grows a section about one member is no longer a root
(`rule.require.catalog-is-an-index`):

- what the subject is, in the shortest form that stands alone
- the axes along which it splits, when it splits along axes
- one line per part, with the fact that sets that part apart
- the gaps — the parts that are owed and absent

⇒ that last line is why a summary is worth its own file. **a set of parts cannot report its own
absences.** only a root that declares the axes can say which cells are empty
(`rule.require.inventory-for-enumerable-concepts`).

## .enforcement

- a subject split into parts with no `._.md` root = **blocker** — the whole has no address
- a root named `$subject.readme.md`, `$subject.overview.md`, or bare `$subject.md` beside its own
  parts = **blocker** — it sorts into the middle of the cluster and reads as one more part
- a directory created for a cluster of two or three files = **nitpick** — a flat cluster globs
  better and costs less
- a `._.md` root that carries narrative about one part = **blocker** — eject it to that part's file
- a single file with no parts = **false positive** — the convention fires on the split, never before

## .see also

- `rule.prefer.decompose-a-subject-via-suffixes` — the WHETHER to this rule's NAME: prefer to eject
  a sub-claim into a suffixed peer, so a zoom-in is dereferenced rather than costed at every boot
- `rule.forbid.itemization-without-coordinates` — the itemization case, which composes this root
  with the `$dimension=$position` contract
- `rule.require.catalog-is-an-index` — what a root may hold, and what it must eject
- `rule.require.rules-are-clusters` — the same shape, for a rule and its occurrences
- `template.domain-term` (learner) — the extant worked instance: `term=$x._.choice._.md`
