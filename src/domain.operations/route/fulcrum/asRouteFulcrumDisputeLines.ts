import { asTreeBranchMarkers } from '@src/infra/cli/asTreeBranchMarkers';

import type {
  RouteFulcrumDisputeEntry,
  RouteFulcrumDisputeState,
} from './asRouteFulcrumDisputeState';
import { asRouteFulcrumVerdictCommand } from './asRouteFulcrumVerdictCommand';
import { getAllRouteFulcrumRepairsOwed } from './getAllRouteFulcrumRepairsOwed';

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
  const reopenedBy = new Map(
    reopened.map((entry) => [entry.frontmatter.case, entry.by]),
  );
  const repairOwedCases = new Set(
    getAllRouteFulcrumRepairsOwed({ state: input.state }).map(
      (entry) => entry.frontmatter.case,
    ),
  );

  // disputes that owe the human a verdict — each one holds approval
  const owedLines = owedHuman.length
    ? [
        `├─ ${owedHuman.length} ${owedHuman.length === 1 ? 'dispute owes' : 'disputes owe'} a human verdict`,
        // the gloss at the decision, so the human need not open --help to read the two words
        `│  ├─ verdict: upheld = the driver's call stands · conceded = the reviewer's concern stands`,
        ...asEntryBranches({
          entries: owedHuman,
          asHead: (entry) =>
            `${entry.frontmatter.case} · ${entry.title} · ${asPercent({ confidence: entry.frontmatter.confidence })}`,
          asLeaves: (entry) => [
            // the ground on the line, so a wrong dispute tagged dirty to dodge a reflection is read
            // as such by the human at the gate (vision case=7)
            `ground: ${entry.frontmatter.ground} · ${asPercent({ confidence: entry.frontmatter.confidence })}`,
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
            ...(reopenedBy.get(entry.frontmatter.case) === 'edit'
              ? [
                  `🟡 edited since a human ruled it ${entry.frontmatter.verdict?.ruled ?? ''}; read as unruled`,
                ]
              : []),
            ...(reopenedBy.get(entry.frontmatter.case) === 'dispute'
              ? [
                  `🟡 disputed again since a human ruled it ${entry.frontmatter.verdict?.ruled ?? ''}; the verdict covers only the disputes they saw`,
                ]
              : []),
            ...(entry.owedEditedSinceDispute
              ? [
                  `🟡 edited since the dispute to read as a reflection; the dispute pinned it to you`,
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
          asLeaves: (entry) => [
            // the date a human ruled, so a human at a later gate knows the verdict as their own
            `ruled on: ${entry.frontmatter.verdict?.at ?? 'unknown'}`,
            ...(repairOwedCases.has(entry.frontmatter.case)
              ? [
                  `repair owed: ${asHoldsText({ entry })}`,
                  // one next step, the same the passage refusal names: no command tells the driver
                  // a repair landed, so the human's approval after it is what closes the debt
                  `next: the driver repairs it in the current diff, then a human approves the stone after it`,
                  `🟡 leave the fulcrum file as is; an edit to it reopens the verdict`,
                ]
              : []),
          ],
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

  // disputes owed upstream — informational, never hold approval. a human may still rule one, so
  // each carries what a verdict reads and the lever that rules it
  const reflectedLines = reflected.length
    ? [
        `├─ ${reflected.length} reflected upstream, informational`,
        ...asEntryBranches({
          entries: reflected,
          asHead: (entry) =>
            `${entry.frontmatter.case} · ${entry.title} · ${asPercent({ confidence: entry.frontmatter.confidence })}`,
          asLeaves: (entry) => [
            `reflect: ${entry.frontmatter.reflect ?? '(none)'}`,
            `holds: ${asHoldsText({ entry })}`,
            `lean: ${entry.frontmatter.lean}`,
            `read: ${entry.path}`,
            `to rule it anyway: ${asRouteFulcrumVerdictCommand({ entry })}`,
          ],
        }),
        `│`,
      ]
    : [];

  return [...owedLines, ...unreadableLines, ...ruledLines, ...reflectedLines];
};

/**
 * .what = renders a ruled entry's verdict: upheld, conceded, or conceded and later approved over
 * .why = a conceded verdict a human approved over must not read as a debt at every later gate, or
 *        the human learns to skip the line. but no mechanism checks that the repair landed, so
 *        the line states only the fact on record — an approval followed — and never claims a repair
 */
const asRuledText = (input: { entry: RouteFulcrumDisputeEntry }): string => {
  if (input.entry.frontmatter.verdict?.ruled !== 'conceded') return 'upheld';
  return input.entry.approvedOn
    ? `conceded, approved over at ${input.entry.approvedOn}`
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
