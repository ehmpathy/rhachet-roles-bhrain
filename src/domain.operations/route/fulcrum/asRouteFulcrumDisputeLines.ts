import { asTreeBranchMarkers } from '@src/infra/cli/asTreeBranchMarkers';

import type {
  RouteFulcrumDisputeEntry,
  RouteFulcrumDisputeState,
} from './asRouteFulcrumDisputeState';

/**
 * .what = renders a route's dispute state as treestruct branches, for a human gate
 * .why = invariants 2 and 4: the drive halt, the `approved?` judge, and the approval refusal all
 *        show the SAME lines, from this one formatter (`rule.forbid.duplicate-format-tree-operations`)
 *
 * .note = each line opens with `├─` or `│`, so the caller prefixes its own indent and appends its
 *         own closer branch (the ask) after them. an empty state renders no lines at all
 */
export const asRouteFulcrumDisputeLines = (input: {
  state: RouteFulcrumDisputeState;
}): string[] => {
  const { owedHuman, ruled, unreadable, reflected, forged, reopened } =
    input.state;
  const forgedCases = new Set(forged.map((entry) => entry.frontmatter.case));
  const reopenedCases = new Set(
    reopened.map((entry) => entry.frontmatter.case),
  );

  // disputes that owe the human a verdict — each one holds approval
  const owedLines = owedHuman.length
    ? [
        `├─ ${owedHuman.length} ${owedHuman.length === 1 ? 'dispute owes' : 'disputes owe'} your verdict`,
        ...asEntryBranches({
          entries: owedHuman,
          asHead: (entry) =>
            `${entry.frontmatter.case} · ${entry.title} · ${asPercent({ confidence: entry.frontmatter.confidence })}`,
          asLeaves: (entry) => [
            `holds: ${asHoldsText({ entry })}`,
            `lean: ${entry.frontmatter.lean}`,
            ...(entry.raisedOn.length
              ? [`raised on: ${entry.raisedOn.join(' · ')}`]
              : []),
            ...(forgedCases.has(entry.frontmatter.case)
              ? [
                  `🟡 its yaml carries a verdict no human lever wrote, read as unruled`,
                ]
              : []),
            ...(reopenedCases.has(entry.frontmatter.case)
              ? [
                  `🟡 edited since a human ruled it ${entry.frontmatter.verdict?.ruled ?? ''}; read as unruled`,
                ]
              : []),
            `read: ${entry.path}`,
          ],
        }),
        `│`,
      ]
    : [];

  // disputes a human already ruled — informational; a conceded one names the repair it owes,
  // and the driver's next command, until an approval after it answers the repair
  const ruledLines = ruled.length
    ? [
        `├─ ${ruled.length} ruled`,
        ...asEntryBranches({
          entries: ruled,
          asHead: (entry) =>
            `${entry.frontmatter.case} · ${entry.title} · ${asRuledText({ entry })}`,
          asLeaves: (entry) =>
            entry.frontmatter.verdict?.ruled === 'conceded' && !entry.approvedOn
              ? [
                  `repair owed: ${asHoldsText({ entry })}`,
                  `next: the driver repairs it in the current diff, then runs rhx route.drive`,
                ]
              : [],
        }),
        `│`,
      ]
    : [];

  // entries the gate cannot read — never skipped, each one holds approval
  const unreadableLines = unreadable.length
    ? [
        `├─ ${unreadable.length} ${unreadable.length === 1 ? 'fulcrum is unreadable and owes' : 'fulcrums are unreadable and owe'} repair`,
        ...asLeafRows({
          rows: unreadable.map((entry) => `${entry.slug} · ${entry.path}`),
        }),
        `│`,
      ]
    : [];

  // disputes owed upstream — informational, never hold approval
  const reflectedLines = reflected.length
    ? [
        `├─ ${reflected.length} reflected upstream, informational`,
        ...asLeafRows({
          rows: reflected.map(
            (entry) =>
              `${entry.frontmatter.case} · ${entry.title} · ${asPercent({ confidence: entry.frontmatter.confidence })} · reflect: ${entry.frontmatter.reflect ?? '(none)'}`,
          ),
        }),
        `│`,
      ]
    : [];

  return [...owedLines, ...unreadableLines, ...ruledLines, ...reflectedLines];
};

/**
 * .what = renders a ruled entry's verdict: upheld, conceded and owed, or conceded and answered
 * .why = a conceded verdict whose repair an approval already answered must not read as a debt at
 *        every later gate, or the human learns to skip the line
 */
const asRuledText = (input: { entry: RouteFulcrumDisputeEntry }): string => {
  if (input.entry.frontmatter.verdict?.ruled !== 'conceded') return 'upheld';
  return input.entry.approvedOn
    ? `conceded, repair answered at ${input.entry.approvedOn} approval`
    : 'conceded';
};

/**
 * .what = renders the concerns a fulcrum holds, or says none were named
 * .why = an empty `holds` must read as a stated absence, never as a blank leaf
 */
const asHoldsText = (input: { entry: RouteFulcrumDisputeEntry }): string =>
  input.entry.frontmatter.holds.join(' · ') || '(none named)';

/**
 * .what = renders flat rows as leaves beneath a `├─` section head
 * .why = three sections list one row per entry; one render keeps their glyphs alike
 */
const asLeafRows = (input: { rows: string[] }): string[] =>
  input.rows.map(
    (row, index) =>
      `│  ${asTreeBranchMarkers({ isLast: index === input.rows.length - 1 }).elbow} ${row}`,
  );

/**
 * .what = renders a list of entries as `├─ head` branches, each with its leaves beneath
 * .why = an owed dispute carries several facts; one fact per leaf (`rule.require.stdout-is-treestruct`)
 */
const asEntryBranches = (input: {
  entries: RouteFulcrumDisputeEntry[];
  asHead: (entry: RouteFulcrumDisputeEntry) => string;
  asLeaves: (entry: RouteFulcrumDisputeEntry) => string[];
}): string[] =>
  input.entries.flatMap((entry, index) => {
    const { elbow, stem } = asTreeBranchMarkers({
      isLast: index === input.entries.length - 1,
    });
    const leaves = input.asLeaves(entry);
    return [
      `│  ${elbow} ${input.asHead(entry)}`,
      ...leaves.map(
        (leaf, leafIndex) =>
          `│  ${stem}${asTreeBranchMarkers({ isLast: leafIndex === leaves.length - 1 }).elbow} ${leaf}`,
      ),
    ];
  });

/**
 * .what = renders a 0–1 confidence as a whole percent
 * .why = a human reads `65%` at a glance where `0.65` asks a second look
 */
const asPercent = (input: { confidence: number }): string =>
  `${Math.round(input.confidence * 100)}%`;
