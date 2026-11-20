import { getAllPassageReportsRaw } from '../passage/getAllPassageReportsRaw';
import { asFulcrumFrontmatterDefectLines } from './asFulcrumFrontmatterDefectLines';
import {
  asRouteFulcrumDisputeState,
  type RouteFulcrumDisputeEntry,
} from './asRouteFulcrumDisputeState';
import { getAllFulcrumVerdictRowsOrDefect } from './getAllFulcrumVerdictRowsOrDefect';
import { getAllRouteFulcrums, type RouteFulcrum } from './getAllRouteFulcrums';

/**
 * .what = lints every fulcrum of a route: unreadable frontmatter, or a verdict no human lever wrote
 * .why = invariant 5: the fulcrum file is the one home of a deferral, so a malformed entry or a
 *        hand-forged verdict must hold the stop the moment it lands — never surface first at the
 *        human gate, where the driver who wrote it has already left
 *
 * .note = returns null when every entry is clean, so the caller holds the stop only on a defect.
 *         one read feeds both halves, so the two can never disagree on what the files held
 */
export const getOneRouteFulcrumLintMessage = async (input: {
  route: string;
}): Promise<string | null> => {
  // read the route's fulcrums, ledger, and passage once
  const [fulcrums, ledger, reports] = await Promise.all([
    getAllRouteFulcrums({ route: input.route }),
    getAllFulcrumVerdictRowsOrDefect({ route: input.route }),
    getAllPassageReportsRaw({ route: input.route }),
  ]);
  const state = asRouteFulcrumDisputeState({
    fulcrums,
    rows: ledger.rows ?? [],
    reports,
  });
  const cases = new Set(fulcrums.map((fulcrum) => fulcrum.slug));

  // one block per unreadable entry (the first few, then a count), per orphaned dispute, then the
  // ledger or each forged verdict; a ledger that cannot be read proves no verdict, so it is
  // named once in place of forgeries
  const unreadable = fulcrums.filter(
    (fulcrum) => fulcrum.parse.kind !== 'valid',
  );
  const blocks = [
    ...unreadable
      .slice(0, LINT_UNREADABLE_SHOWN_MAX)
      .flatMap((fulcrum) => asFulcrumLintBlockUnreadable({ fulcrum })),
    ...(unreadable.length > LINT_UNREADABLE_SHOWN_MAX
      ? [
          asFulcrumLintBlockUnreadableRest({
            fulcrums: unreadable.slice(LINT_UNREADABLE_SHOWN_MAX),
          }),
        ]
      : []),
    ...state.unreadable
      .filter((entry) => !cases.has(entry.slug))
      .map((entry) => asFulcrumLintBlockOrphaned({ entry })),
    ...(ledger.defect !== null
      ? [asFulcrumLintBlockLedger({ refusal: ledger.defect })]
      : state.forged.map((entry) => asFulcrumLintBlockForged({ entry }))),
  ];

  // a clean route holds no stop
  if (!blocks.length) return null;
  return [
    '✋ ConstraintError: a fulcrum is unreadable or forged; repair each before the stop',
    ...blocks,
  ].join('\n');
};

/**
 * .what = how many unreadable entries the lint renders in full before it names the rest by path
 * .why = a route of legacy fulcrums would print a paste block per file; the first few teach the
 *        fix, and the rest are a list the driver works down
 */
const LINT_UNREADABLE_SHOWN_MAX = 3;

/**
 * .what = the lint block that names, by path, each unreadable entry beyond the ones shown in full
 * .why = every unreadable entry is named, never skipped; only its paste block is withheld
 */
const asFulcrumLintBlockUnreadableRest = (input: {
  fulcrums: RouteFulcrum[];
}): string =>
  [
    '',
    `🗿 route.fulcrum lint: ${input.fulcrums.length} more ${input.fulcrums.length === 1 ? 'entry has' : 'entries have'} unreadable frontmatter; each takes the block above`,
    ...input.fulcrums.map(
      (fulcrum, index) =>
        `   ${index === input.fulcrums.length - 1 ? '└─' : '├─'} ${fulcrum.path}`,
    ),
  ].join('\n');

/**
 * .what = the lint block for a verdict ledger that cannot be read
 * .why = the refusal already names the line and its fix; the block hangs it under one header
 */
const asFulcrumLintBlockLedger = (input: { refusal: string }): string => {
  const [headline, ...body] = input.refusal.split('\n');
  return [
    '',
    `🗿 route.fulcrum lint: the verdict ledger cannot be read`,
    `   └─ ${headline}`,
    // the refusal body already leads with its own 3-space trunk, so it nests under the headline
    ...body.map((line) => `   ${line}`),
  ].join('\n');
};

/**
 * .what = the lint block for a case a live dispute cites whose fulcrum file is gone
 * .why = a deleted or renamed entry must not orphan its dispute; the passage log still records it
 */
const asFulcrumLintBlockOrphaned = (input: {
  entry: { path: string; slug: string };
}): string =>
  [
    '',
    `🗿 route.fulcrum lint: ${input.entry.slug} is cited by a live dispute, and its file is gone`,
    `   ├─ cited: ${input.entry.path}`,
    `   └─ fix: restore the file, or rewind the stone whose dispute cites it`,
  ].join('\n');

/**
 * .what = the lint block for one entry whose name or frontmatter cannot be read, or none
 * .why = names the file, the fields it lacks or holds out of their closed sets, and the block to
 *        paste — the same fix the dispute-time refusal teaches
 */
const asFulcrumLintBlockUnreadable = (input: {
  fulcrum: RouteFulcrum;
}): string[] => {
  if (input.fulcrum.parse.kind === 'valid') return [];
  return [
    [
      '',
      `🗿 route.fulcrum lint: ${input.fulcrum.slug} has unreadable frontmatter`,
      ...asFulcrumFrontmatterDefectLines({
        path: input.fulcrum.path,
        parse: input.fulcrum.parse,
        dispute: null,
      }),
    ].join('\n'),
  ];
};

/**
 * .what = the lint block for one verdict the newest ledger row does not prove
 * .why = a hand edit reads as unruled at every gate; the block names how to undo it and the
 *        command only a human may run
 */
const asFulcrumLintBlockForged = (input: {
  entry: RouteFulcrumDisputeEntry;
}): string =>
  [
    '',
    `🗿 route.fulcrum lint: ${input.entry.frontmatter.case} carries a forged verdict`,
    `   ├─ file: ${input.entry.path}`,
    `   ├─ verdict carries no ledger row; only rhx route.fulcrum.rule writes it`,
    ...(input.entry.frontmatter.owed === 'human'
      ? [
          `   └─ fix: set \`verdict: null\` and \`status: open\`, then ask a human to run`,
          `      └─ rhx route.fulcrum.rule --case ${input.entry.frontmatter.case} --as <upheld|conceded>`,
        ]
      : [
          `   └─ fix: set \`verdict: null\`; a fulcrum that owes ${input.entry.frontmatter.owed} takes no human verdict`,
        ]),
  ].join('\n');
