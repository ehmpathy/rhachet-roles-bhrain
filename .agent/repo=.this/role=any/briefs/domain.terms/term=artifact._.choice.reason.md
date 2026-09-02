# domain.term.choice.reason: artifact

## .why it was paved — three clusters were blocked on one absent ancestor

`term=artifact.dream`, `term=artifact.withdraw`, and `term=artifact.tool` each carried
`boundary = UNSETTLED` under their prior flat names, and each recorded the **same** candidate: a
word that covers a dream, a brief, a yield, and a fulcrum alike. `term=artifact.tool` had already
named it, in its own forbidden-synonym list:

> `artifact` — broader — a route yield is an artifact and is not a tool

⇒ **three independent clusters blocked on one word is the strongest signal a term is owed**
(`im_an.obsessive_learner.for.domain.terms`). the 2026-08-31 progress record flagged two of the
three; the read of `term=artifact.tool` found the third.

## .etymology

from the ordinary sense — a **thing made**, kept because it was made. archaeology's word for what
a dig recovers: the pot outlives the potter and the meal alike.

that residue is the property the domain needs. an artifact here is what remains **after** the act
that produced it: the drive ends, the reviewer's context is discarded, the session is compacted —
and the yield, the fulcrum, and the brief are still on disk.

## .the enumeration that settled it

per `rule.require.enumerate-before-you-name`, the instances were listed **before** the word:

| # | the instance | where |
|---|---|---|
| 1 | a brief | `src/domain.roles/*/briefs/*.md` |
| 2 | a skill | `.agent/**/skills/*.sh` |
| 3 | a route yield | `$route/*.yield.md` |
| 4 | a fulcrum entry | `$route/.fulcrums/inventory.of=fulcrums.case=*.md` |
| 5 | a seed entry | `$route/.seeds/inventory.of=seeds.case=*.md` |
| 6 | a dream | `.dream/*.md` |
| 7 | a term cluster | `domain.terms/term=*._.choice.*` |
| 8 | a progress record | `.agent/.cache/**/progress.*.md` |
| 9 | a review articulation | `review/self/for.*.md`, `.given.by_peer`, `.taken.by_self` |
| 10 | a stone, a guard | `$route/*.stone`, `$route/*.guard` |

**ten instances across four kinds** — a document, an executable, a record, a marker. no narrower
word covers all four.

## .the two tests, both answered

`rule.require.enumerate-before-you-name` grades a candidate on two axes, and a word can fail in
either direction:

**too narrow?** no. every row above is covered, including rows 2 and 10 — a skill is no document
and a `.stone` is no record, so the two candidates that read most naturally (`document`, `record`)
each break on a row the list contains.

**too wide?** no, and this is the axis that needed the harder check. `artifact` **excludes** three
adjacent concepts the librarian's ontology already declares:

| the neighbour | why `artifact` excludes it |
|---|---|
| an **act** — a drive, a sweep, a review round | an act *produces* artifacts. row 3 is the yield, never the drive |
| a **concept** (`kno101.primitives.5`) | a pattern in reality. it outlives every artifact of it, and it sits on no disk |
| an **instance** (`kno101.primitives.3`) | a raw atom of data or experience, concept-neutral until arranged |

⇒ so it discriminates. it is the genus over rows 1–10 and it is **not** the genus over everything.

## .the rejected synonyms

| word | why not |
|---|---|
| `file` | names the **storage unit**, not the deliverable. a term cluster is three files and one artifact; the counts do not line up, which is the tell |
| `document` | 🔴 **the librarian already declares it** (`kno201.documents._.[catalog]`) as a materialization of a concept — an article, a catalog, a demo, a lesson. to borrow it here would overload a declared word onto a second concept (`rule.forbid.domain-term-ambiguity`), and a skill is an artifact that is no document |
| `output` | names the **relation to a producer**. an artifact outlives its producer, which is the property that earns the word |
| `deliverable` | implies a recipient who asked for it. most artifacts here are volunteered — a dream no one requested, a fulcrum no one asked to be told |
| `record` | narrower. a record **attests**; an artifact may also **do work**. rows 2 and 10 are no records |
| `asset` | finance register, and it implies a valuation this repo does not assign |

## .the three boundaries it closes

| the cluster | was | now |
|---|---|---|
| `tool` | `UNSETTLED` — *"shares the externalization family's one gap"* | `artifact.tool` |
| `dream` | `UNSETTLED` — *"no declared ancestor reaches a root yet"* | `artifact.dream` |
| `withdraw` | `UNSETTLED` — *"it spans dreams, briefs, and fulcrums alike"* | `artifact.withdraw` |

and two more, once the ancestor existed:

- **transitively, `skill`** — its own `.what` states *"a skill is a kind of tool, never the opposite
  of one"*, so `artifact.tool.skill` → `repo` now reaches a root
- **`seed`**, which had carried the same *"externalization family"* note by **adjacency** and is a
  noun, never a verb of that family. it is a file the repo keeps → `artifact.seed`

## .evidence

- **discovery**: the ten-row enumeration above, drawn from this repo's own tree on 2026-08-31
- **the distinction that earns the word**: `artifact` ≠ `tool`. a route yield is read once and
  never reused, so it is an artifact and is no tool — the exact line `term=artifact.tool` had already
  drawn from the other side
- **three clusters converged on it independently**, each recorded before this term existed

## .invariants

- an **act** recorded as an artifact = a category error. the drive is not the yield
- a term whose boundary is `artifact` where a **narrower** declared ancestor fits (`tool`,
  `route`, `glossary`) = too wide. reach for the narrowest ancestor that covers every instance
