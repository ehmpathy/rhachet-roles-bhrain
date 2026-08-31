# domain.term.choice.reason: coordinate

## .etymology

**coordinate** — from latin *co-* (together) + *ordinare* (to order), by way of descartes: a value
that fixes a position **relative to a named axis**. the word has carried the axis in it since it
was coined, which is the whole property this repo needs.

a point on a plane is `(x=3, y=4)`. drop the axis names and `(3, 4)` still reads — until a third
axis appears, or the order is forgotten, and then it reads wrong with no way to tell.

⇒ **that failure mode is exactly a prose filename.** `queued.md` is `(3)`. `from=QUEUED.md` is
`(x=3)`.

## .why not the rejected synonyms

- **label** — a label carries a value with **no axis**. that is precisely what the term must
  exclude, so it is the sharpest of the four rejections. `queued` is a label; `from=QUEUED` is a
  coordinate. see the contrast table in the choice file
- **tag** — worse than a label: tags are conventionally an **unordered set** on one item, where
  coordinates are one value per named axis. a tag set cannot be diffed against a generated
  expectation, so the gap check this repo relies on would not exist
- **slug** — names a **url-safe rendering** of a string, not a key/value pair. it says something
  about the characters and says no thing about the structure
- **prefix** — names a **position in a string**, not a relation to an axis. `from=` happens to sit
  at the front of `from=QUEUED`, and would still be a coordinate if it sat at the back
- **qualifier** — the closest near-miss, and it fails on directionality. a qualifier **narrows**;
  a coordinate **locates**. `rule.require.boundary-qualified-terms` uses "qualified" correctly for
  what it does — narrow a term's scope — which is a second reason not to overload the word here

## .the axis argument, stated once

the whole term earns its place on one claim:

> **a coordinate turns a name into an ADDRESS. an address is computed; a prose name is searched.**

four properties follow, and every one is lost the moment the axis leaves the name:

| property | with the axis | without it |
|---|---|---|
| the path is computable | know axis + position, know the filename | scan and judge |
| the axis is self-declared | `status=QUEUED` says which axis | `queued` does not |
| a slice is globbable | `*.from=QUEUED.*` returns a row | there is no row |
| absence is checkable | generate the expected names, diff against disk | you cannot diff against a guess |

⇒ the fourth is the one that makes a **census** possible, and a census is what
`rule.require.inventory-for-enumerable-concepts` claims. so the coordinate is not a naming
preference the itemization rules happen to use — **it is the mechanism those rules rest on.**

## .the three-word split, and why all three are needed

`dimension` / `position` / `coordinate` name one structure at three grains, and briefs drift the
moment any of them is dropped:

- with only **coordinate**, a rule cannot say *"the axis is implied; make it explicit"*
- with only **dimension**, a rule cannot say *"the pair is the address"*
- the plural **coordinates** names the whole address — every pair in one name

`dimension` and `position` are extant vocabulary in the librarian's inventory briefs; this cluster
declares the pair they compose.

## .disputes

none.

## .evidence

- **the term was load-bearing and undeclared.** `rule.forbid.itemization-without-coordinates` is
  **named** for this word, shows its form (`$key=$value`), and never says what a coordinate IS —
  so the rule's own name dereferenced to no declaration. recorded as owed in
  `.agent/.cache/repo=bhrain/role=learner/skill=learn.domain.terms/progress.2026-08-28.md`, then
  paved when the wisher asked *"whats 'coordinates'?"* — which is the same gap, found from the
  outside
- **the convention predates the term by a wide margin.** `repo=`, `role=`, `term=`, `of=`,
  `kind=`, `from=`, `into=`, `example=`, and `case=` were all in use across the repo before any
  cluster defined the form they share. **the pavement was laid and never named**
- **a tool already enforces it.** the route guard computes a review artifact's path from its
  coordinates and **rejects a file written to the wrong one** — it looks precisely at the computed
  path. that is the dereference contract enforced by a machine, and it is the sharpest evidence
  that coordinates are a contract rather than a style
- **invariant:** a coordinate's key names an axis that is **declared somewhere** — in an
  itemization's `._.md` summary, or in a rule. a `$key=$value` pair whose key names no declared
  axis is a label with an equals sign in it
