# rule.always.boot-an-oversized-subdomain-as-its-catalog

> **when an enbriefed subdomain is too large to boot whole, boot its CATALOG at `say` and keep
> every member out of the boot under `not`. each member stays reffable through a path the catalog
> lets a reader compute.**

a **subdomain** here = a set of briefs about one concept family, each member one file: the terms
of a glossary, the axes of a glyph register, the rules of one practice. it is **catalogable** when
its members are enumerable by name and their paths follow one formula.

```yaml
say:
  - briefs/domain.terms/catalog.of=term._.md     # one index: every name + the path formula
not:
  - briefs/domain.terms/term=*.md                # the members — read on demand, never booted
```

## .why — a ref list is not free, and it grows with the subdomain

a `ref` entry boots its **path**. so a subdomain left at `ref` charges one line per member to every
session, forever — and the charge rises each time a member lands. `ref` caps the cost of a body;
it does not cap the cost of a count.

| the subdomain boots as | each session pays | as the subdomain grows |
|---|---|---|
| every member at `say` | every body | unbounded, fast |
| every member at `ref` | one path per member | unbounded, slow — and invisible, since no one reads a path list |
| its catalog at `say`, members under `not` | one index | bounded by names, not bodies or paths |

⇒ the catalog does what the path list pretended to: it tells a reader the member **exists** and
**where** to read it, at a fraction of the cost, since the path is computed rather than printed.

**the `not` is load-critical.** a member left unlisted falls back into `<also>` and costs its
path anyway. a catalog at `say` with no `not` beside it pays twice.

## .the test

> **would a reader rather see every member's path, or one index that names them all?**

ask it of any boot entry that is a glob over one subdomain. one index → catalog it. a reader needs
every body at boot → the subdomain is not too large; it is the work, and it boots whole.

| when… | then… |
|---|---|
| a boot spec holds a glob over ~20+ files of one subdomain | the strongest cue. catalog it |
| `rhx cost` ranks `<briefs.ref>` or `<also>` near the top | the path list is the cost. find the subdomain behind it |
| a boot spec runs over its budget | read the ref list before you trim a cue — paths are the cheapest cut |
| a new subdomain begins to fill a directory | write its catalog at the second member, not the fiftieth |
| members are named by a coordinate (`term=$name`, `axis=$x`) | the path formula is free — state it once in the catalog |
| members carry prose names with no formula | name each path in the catalog row; still cheaper than a boot entry per file |

## .what the catalog owes

- **every member, by name** — grouped by its boundary root, so a reader scans a family, not a list
- **the path formula, once** — `term=$name._.choice._.md`, with one worked example
- **the census note** — the catalog is hand-kept; a member on disk absent from it is drift
- **pointers to the subdomain's own rules and readme** — by path, never inline

and it obeys `rule.require.catalog-is-an-index`: one row per member, no narrative about any one.

## .the measured case

2026-10-16, this repo's `role=any` boot: 148 glossary terms at `ref`, plus their gap census and
peers, cost ~5.3k tokens of paths on every boot — 18% of a 29.8k payload, and over the whole
5k budget rhachet seeded on its own. one `catalog.of=term._.md` at `say` (934 tokens) plus a `not`
over the members brought the payload to 23.9k, and every term stayed one computed path away.

## 🟡 .the boundary

| a violation | not a violation |
|---|---|
| a catalogable subdomain booted as a glob of paths | a small set — a handful of files — booted at `ref` |
| a catalog at `say` with its members still unlisted under `not` | a subdomain a reader needs whole at every boot, booted whole |
| a catalog whose rows carry each member's body | a catalog of names, grouped, with one path formula |

blocker: a catalog at `say` whose members are left out of `not` (they re-surface in `<also>`).
nitpick: a catalogable subdomain of ~20+ members booted as a list of paths · a catalog that prints
every path where one formula would compute it.

⇒ see also: `rule.require.catalog-is-an-index` (what the catalog may hold) ·
`rule.prefer.rules-that-refout` (the say/ref split for one rule; this is the same split for a set) ·
`rule.forbid.itemization-without-coordinates` (why the path is computable) ·
`rule.require.summary-at-the-cluster-root` (where the catalog is named).
