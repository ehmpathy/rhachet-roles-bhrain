# rule.require.rules-are-clusters

## .what

**a rule is a cluster, not a file that accretes.**

```
rule.forbid.$topic.md                 # the CLASS — lean, always the entry point
rule.forbid.$topic.example=$id.md     # ONE file per occurrence — opt-in, on demand
```

the rule keeps **exactly one** worked case — the sharpest one — so a reader who opens it grasps
the mechanism without a second fetch. every **other** occurrence, and the full record of the
worked one (the sweep, the injections, the residual), lives in an example file beside it.

## .why

a rule that absorbs every occurrence **stops to be a rule and becomes a logbook.** the reader who
opened it wanted the mechanism and the fix; they now scroll past four dated incidents to reach
them.

and the pressure is the same one `rule.require.catalog-is-an-index` measures: each occurrence is a
**true** fact about the class, so each addition is locally correct. the artifact degrades through
a sequence of good edits, and it degrades **fastest** for the rules that fire most — the ones a
reader most needs to stay lean.

⇒ the grain model is shared, and it is stated once in `rule.require.catalog-is-an-index`. this rule
applies it to a rule file: **the class stays; the occurrences eject.**

## .one file per occurrence, never one file per rule

```
👍  rule.forbid.$topic.example=R9-U1.md
👍  rule.forbid.$topic.example=R10-U1.md

👎  rule.forbid.$topic.example=occurrences.md
```

**the id in the filename is what makes a record citable.** a reviewer who wants to point at one
incident can hand over a path; a reader who wants one incident opens one file. an
`example=occurrences.md` collapses both properties and is the accretion pattern in a new coat.

⇒ this is the coordinate discipline `rule.forbid.itemization-without-coordinates` names, applied to
an occurrence set: `example=$id` is the address.

## .the `.see also` convention — the opt-in must be discoverable

an example file nobody can find is an ejection that lost the record. so the rule points **down** at
its examples from its entry point:

```md
## .see also

- `rule.forbid.$topic.example=R9-U1.md`   — the 2026-08-09 sweep, 14 injections, 1 residual
- `rule.forbid.$topic.example=R10-U1.md`  — the recurrence after the R9 fix
```

one line per example, each of which states **what makes that occurrence worth an open**. a bare
path is a list; a path plus the fact that sets it apart is an index.

## .the test

> **"does this paragraph describe the mechanism, or one time the mechanism fired?"**

- the mechanism → **the rule**
- one time it fired → `example=$id.md`
- and if the rule has **no** worked case at all → 🔴 keep the sharpest one; a rule with no example
  is an assertion (`rule.always.scope-onetime-lessons-to-the-behavior`, learner)

## .enforcement

- a second worked case added to a rule file, rather than ejected to `example=$id.md` = **blocker**
- several occurrences collapsed into one `example=occurrences.md` = **blocker** — the id in the
  filename is the citation
- an example file with no `.see also` pointer from its rule = **nitpick** — the opt-in must be
  reachable from the entry point
- a rule with **zero** worked cases = **nitpick** — it reads as an assertion

## .see also

- `rule.require.catalog-is-an-index` — the shared three-grain model, and the catalog half
- `rule.forbid.itemization-without-coordinates` — why `example=$id` is an address, not a label
- `template.domain-term` (learner) — the precedent: `._.choice._` / `.reason` / `.example=` is this
  exact cluster, already in use for terms
