import { getAllPassageReportsRaw } from '../passage/getAllPassageReportsRaw';
import {
  FULCRUM_FRONTMATTER_FIELDS_REQUIRED,
  type FulcrumFrontmatterParse,
} from './asFulcrumFrontmatter';
import { asFulcrumFrontmatterDefectLines } from './asFulcrumFrontmatterDefectLines';
import {
  asRouteFulcrumDisputeState,
  type RouteFulcrumDisputeEntry,
} from './asRouteFulcrumDisputeState';
import { getAllFulcrumVerdictRows } from './getAllFulcrumVerdictRows';
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
  const [fulcrums, rows, reports] = await Promise.all([
    getAllRouteFulcrums({ route: input.route }),
    getAllFulcrumVerdictRows({ route: input.route }),
    getAllPassageReportsRaw({ route: input.route }),
  ]);
  const state = asRouteFulcrumDisputeState({ fulcrums, rows, reports });

  // one block per unreadable entry, then one per forged verdict
  const blocks = [
    ...fulcrums.flatMap((fulcrum) => asFulcrumLintBlockUnreadable({ fulcrum })),
    ...state.forged.map((entry) => asFulcrumLintBlockForged({ entry })),
  ];

  // a clean route holds no stop
  if (!blocks.length) return null;
  return [
    '✋ ConstraintError: a fulcrum is unreadable or forged; repair each before the stop',
    ...blocks,
  ].join('\n');
};

/**
 * .what = the lint block for one entry whose name or frontmatter cannot be read, or none
 * .why = names the file, the fields it lacks or holds out of their closed sets, and the block to
 *        paste — the same fix the dispute-time refusal teaches
 */
const asFulcrumLintBlockUnreadable = (input: {
  fulcrum: RouteFulcrum;
}): string[] => {
  const defects = asFulcrumParseDefects({ parse: input.fulcrum.parse });
  if (!defects) return [];
  return [
    [
      '',
      `🗿 route.fulcrum lint: ${input.fulcrum.slug} has unreadable frontmatter`,
      ...asFulcrumFrontmatterDefectLines({
        path: input.fulcrum.path,
        slug: input.fulcrum.slug,
        ...defects,
      }),
    ].join('\n'),
  ];
};

/**
 * .what = the fields a failed parse lacks and holds malformed, or null for a valid parse
 * .why = an absent block lacks every field; an invalid one names its own
 */
const asFulcrumParseDefects = (input: {
  parse: FulcrumFrontmatterParse;
}): { absent: string[]; malformed: string[] } | null => {
  if (input.parse.kind === 'valid') return null;
  if (input.parse.kind === 'absent')
    return { absent: [...FULCRUM_FRONTMATTER_FIELDS_REQUIRED], malformed: [] };
  return { absent: input.parse.absent, malformed: input.parse.malformed };
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
          `      └─ rhx route.fulcrum.rule --case ${input.entry.frontmatter.case} --as upheld|conceded`,
        ]
      : [
          `   └─ fix: set \`verdict: null\`; a fulcrum that owes ${input.entry.frontmatter.owed} takes no human verdict`,
        ]),
  ].join('\n');
