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
  const { owedHuman, ruled, unreadable, reflected, forged } = input.state;
  const forgedCases = new Set(forged.map((entry) => entry.frontmatter.case));

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
            `read: ${entry.path}`,
          ],
        }),
        `│`,
      ]
    : [];

  // disputes a human already ruled — informational; a conceded one names the repair it owes
  const ruledLines = ruled.length
    ? [
        `├─ ${ruled.length} ruled`,
        ...asLeafRows({
          rows: ruled.map((entry) =>
            entry.frontmatter.verdict?.ruled === 'conceded'
              ? `${entry.frontmatter.case} · ${entry.title} · conceded, repair owed: ${asHoldsText({ entry })}`
              : `${entry.frontmatter.case} · ${entry.title} · upheld`,
          ),
        }),
        `│`,
      ]
    : [];

  // entries the gate cannot read — never skipped, each one holds approval
  const unreadableLines = unreadable.length
    ? [
        `├─ ${unreadable.length} ${unreadable.length === 1 ? 'fulcrum is' : 'fulcrums are'} unreadable, owe repair`,
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
