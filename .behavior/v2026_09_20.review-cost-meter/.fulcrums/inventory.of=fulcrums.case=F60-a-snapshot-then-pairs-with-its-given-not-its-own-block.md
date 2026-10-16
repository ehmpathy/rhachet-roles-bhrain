# F60 — a snapshot `then` pairs with its given's assertions, not its own block

## .the fork

`rule.forbid.failhide` (code.test) names *"`expect(result).toMatchSnapshot()` alone"* a failhide,
and `rule.require.snapshots` asks for a snapshot **and** explicit assertions. the grain of
"alone" is unsaid.

| option | grain | what it asks |
|---|---|---|
| **A — the given** | a subject | every snapshotted subject is also asserted explicitly, in a `then` beside it |
| B — the block | a `then` | every `then` that snaps also asserts, inside that same block |

## .taken — A, and why

- **a failhide is a test that passes without verification.** a given whose render is asserted
  on its figures, glyphs, and order in adjacent `then`s, and snapped in one more, is verified;
  no path through it passes unchecked. the dedicated snapshot `then` is the observability half
  the snapshots lesson calls for, named so a reviewer sees *what* is pinned
- **A is the repo's long-held shape, measured.** a scan of every test this branch adds or
  touches finds 327 `then` blocks whose only `expect` is the snapshot — among them the extant
  route suites (`setStoneAsRewound` *"stdout matches snapshot"*). the pattern predates this
  wish; a B verdict would indict the whole test corpus, not this diff
- **B duplicates, and a duplicate drifts.** to satisfy it, each snapshot block would repeat an
  assertion its neighbour already makes. two copies of one assertion is the declare-once defect
- the one gap A still owes is a snapshotted subject with **no** explicit assertion anywhere in
  its given. i031 named one: `reviewPromptCacheAnatomy` snapped the section offsets and the
  prefix margins with no assertion on either. both tabulation blocks now assert the layout
  order and the margin beside the snapshot. a block-by-block audit of the other 14 files the
  lane listed read 65 snapshot-only blocks and found every subject asserted by a peer `then`;
  the loosest, `getOnePromptComposition` `[case6]`, gained a rules assertion regardless

## .rework

clean — any snapshot `then` can gain an assertion later, one line each, with no ripple.

## .confidence

75%. the 25% is that the rule's author meant block grain; if so, the repair is mechanical and
repo-wide, and it belongs in a sweep of its own rather than inside this wish.

## .where

the `mech-failhides-tests-review-ops` lane, i013, blocker.1 (13 files named). re-raised at
round `2cf94e4e` (r016) over 23 files; a full read of those 23 found 94 givens that hold all 137
snapshot calls, and 0 whose snapped subject lacks an explicit assertion in its given. disputed
again under this row. re-raised at round `d92a187c` (i004 r016) over the same 23 files, with the
eight repaired blocks dropped and the remedy row's one-line form cited as the grain — disputed
under this row a third time; the grain stays the council's call.

## .verdict

🟡 BEST-GUESSED 2026-09-27 — option A. disputed on that lane.
