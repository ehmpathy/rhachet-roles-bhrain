---
case: F16
rework: dirty
ground: dirty
confidence: 0.70
status: open
owed: human
holds: [enroll-impl-arch-defects/i004/nitpick.1]
lean: rework, status, and holds stay typed, as the wish lists them; a derive from the log changes what a human reads in the file
verdict: null
---

# F16 — the frontmatter keeps `rework`, `status`, and `holds` typed

## .the fork

the reviewer reads three fields as state the passage log could derive: `rework` overlaps `ground`
and no gate reads it; `status` is read only for `superseded`; `holds` restates the `disputed` rows.

- A: keep all three typed, as the wish lists them
- B: drop them, and derive each from the log or from `ground`

## .taken, why

A. the wish names these fields in the frontmatter, and the fulcrum file is the one place a human
reads a deferral whole. `holds` is what the halt shows the human before any dispute row exists, and
the dispute path checks that a dispute cites a fulcrum that holds its concern. `owed` was the one
typed field with two readers, and that pair is now derived in one place. the other three have one
reader each, so they cannot disagree.

## .rework, why

dirty. B removes fields from every fulcrum on every route, and changes the paste block, the linter,
and the content hash a verdict binds to.

## .confidence, why low

"derive, never type twice" is this route's own law, and `holds` is a second copy of what the
dispute rows say. 70%.

## .where

`src/domain.operations/route/fulcrum/asFulcrumFrontmatter.ts` ·
`src/domain.operations/route/fulcrum/isFulcrumHoldsOfConcern.ts`.

## .verdict

open. owed to the human at the PR.
