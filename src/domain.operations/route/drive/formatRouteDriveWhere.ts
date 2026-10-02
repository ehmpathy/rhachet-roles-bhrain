import { asRouteDisplayPath } from './asRouteDisplayPath';

/**
 * .what = the `where do we go?` bucket — the facts that locate a driver, as tree lines
 * .why = SIX surfaces render it (drive, exhausted, malfunction, blocked, mixed halt,
 *        budget exhausted) and each carried its own copy of the glyphs. a line added to
 *        five of six is a drift a reader finds only by a diff of two halts, which is the
 *        exact hazard `rule.forbid.duplicate-format-tree-operations` names and
 *        `rule.require.single-source-of-truth-for-render` closes
 *
 * 🔴 .note = the `brain` line is OMITTED where the slug is null, glyphs and all — so
 *           `stone` keeps the `└─` elbow and a route that never heard of `brain:` renders
 *           byte-identically to the build before the prescribed-brain feature (case=10's
 *           bound). the elbow moves to whichever line is last, which is what makes the
 *           omission invisible rather than a blank row
 *
 * .note = the brain is a LINE in this bucket, never a section of its own prepended onto
 *           every drive. "which brain prices this stone?" is the same KIND of question as
 *           "which route?" and "which stone?", so it belongs in the same bucket, in the
 *           same shape, read in the same glance
 *
 * .note = `effort` renders BENEATH `brain`, never beside it, because that is what it
 *           is — an effort level is model-scoped, so it is a property OF a brain rather
 *           than a second fact of the same rank. the guard nests it, the object nests it,
 *           and the tree that reports it nests it too. a peer row would be the one place
 *           in the stack that flattens a hierarchy every other layer carries
 *
 * .note = where an effort is listed, `brain` is a BARE parent and the choice drops to a
 *           `choice =` child, a peer of `effort =` (S15). choice and effort are two properties
 *           of one brain, so they sit at one rank; `brain = <choice>` over `effort =` would
 *           read the effort as a child of the choice. with no effort, `brain = <choice>` stays
 *           one line — a lone property needs no parent row
 *
 * .note = where the guard declared only an effort, `brain` holds one child, `effort =`.
 *         no choice was declared, so none is named
 *
 * .note = PURE, and it returns LINES rather than a string. every caller splices it into a
 *         larger tree it owns, so a joined string would make each one split it again
 *
 * .note = the elbow is COMPUTED off the row list rather than branched per shape. with a
 *         conditional row and a conditional child there are four renders, and an if-chain
 *         would spell each one out — so the `└─` would have to be moved by hand in every
 *         arm, which is exactly how a tree grows a stale elbow
 */
export const formatRouteDriveWhere = (input: {
  route: string;
  stone: string;
  brain: string | null;
  effort: string | null;
}): string[] => {
  // the brain row: `brain = <choice>` alone, or a bare `brain` parent where an effort is listed
  const brainRow = input.effort
    ? 'brain'
    : input.brain
      ? `brain = ${input.brain}`
      : null;
  const rows = [
    `route = ${asRouteDisplayPath({ route: input.route })}`,
    `stone = ${input.stone}`,
    ...(brainRow ? [brainRow] : []),
  ];

  // the brain's children, where an effort is listed: the choice (if declared), then the effort
  const children = input.effort
    ? [
        ...(input.brain ? [`choice = ${input.brain}`] : []),
        `effort = ${input.effort}`,
      ]
    : [];
  return [
    `   ├─ where do we go?`,
    ...rows.map(
      (row, index) => `   │  ${index === rows.length - 1 ? '└─' : '├─'} ${row}`,
    ),
    // the brain row is always LAST when it exists — so the continuation is three spaces,
    // never a `│`, and the last child owns the elbow
    ...children.map(
      (child, index) =>
        `   │     ${index === children.length - 1 ? '└─' : '├─'} ${child}`,
    ),
  ];
};
