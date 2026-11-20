import * as fs from 'fs/promises';
import { BadRequestError, MalfunctionError } from 'helpful-errors';
import { today } from 'iso-time';
import * as path from 'path';

import { getDecisionIsCallerHuman } from '../getDecisionIsCallerHuman';
import { getAllPassageReportsRaw } from '../passage/getAllPassageReportsRaw';
import { asFulcrumContentWithVerdict } from './asFulcrumContentWithVerdict';
import { asFulcrumFrontmatter } from './asFulcrumFrontmatter';
import { asFulcrumFrontmatterDefectLines } from './asFulcrumFrontmatterDefectLines';
import {
  asRouteFulcrumDisputeState,
  type RouteFulcrumDisputeEntry,
  type RouteFulcrumDisputeState,
} from './asRouteFulcrumDisputeState';
import { getAllFulcrumVerdictRows } from './getAllFulcrumVerdictRows';
import { getAllRouteFulcrums, type RouteFulcrum } from './getAllRouteFulcrums';
import { isFulcrumVerdictProven } from './isFulcrumVerdictProven';
import { setFulcrumVerdictRow } from './setFulcrumVerdictRow';

/**
 * .what = records a human's verdict on one disputed fulcrum: the yaml verdict plus a ledger row
 * .why = invariant 2: only a human rules a dispute. the ledger row is what proves the yaml verdict
 *        came from this lever, on the content the human read, so a hand edit of the yaml alone
 *        reads as forged and an edit after the verdict reads as reopened at every gate
 *
 * .note = `--case` names the file's case id; the frontmatter's must equal it, or the entry is
 *         unreadable and refused below
 * .note = a reflect-owed dispute may be ruled too: the 0.90 line is the driver's own grade, so a
 *         human who reads a "sure misread" as wrong must have a lever on it (vision R36, R39)
 */
export const setFulcrumVerdict = async (
  input: {
    route: string;
    case: string;
    ruled: 'upheld' | 'conceded';
  },
  context: {
    isTTY: boolean;
  },
): Promise<{
  outcome: 'ruled' | 'unchanged';
  case: string;
  path: string;
  on: string;
}> => {
  // refuse any caller but a human
  const { isHuman } = getDecisionIsCallerHuman({ isTTY: context.isTTY });
  if (!isHuman)
    throw new BadRequestError(
      [
        'only a human can rule on a dispute',
        `   └─ fix: ask a human to run this at their own terminal`,
        `      └─ rhx route.fulcrum.rule --case ${input.case} --as ${input.ruled}`,
      ].join('\n'),
      { case: input.case },
    );

  // find the fulcrum by its case id, and refuse one the gate cannot read
  const [fulcrums, rows, reports] = await Promise.all([
    getAllRouteFulcrums({ route: input.route }),
    getAllFulcrumVerdictRows({ route: input.route }),
    getAllPassageReportsRaw({ route: input.route }),
  ]);
  const fulcrum = getOneFulcrumByCase({ fulcrums, case: input.case });
  if (!fulcrum)
    throw new BadRequestError(
      [
        `no fulcrum found for case ${input.case}`,
        `   ├─ looked in: ${path.join(input.route, '.fulcrums')}`,
        `   └─ fix: name a case whose entry lives at .fulcrums/inventory.of=fulcrums.case=<id>-<slug>.md`,
      ].join('\n'),
      { route: input.route, case: input.case },
    );
  if (fulcrum.parse.kind !== 'valid')
    throw new BadRequestError(
      [
        `fulcrum ${input.case} has unreadable frontmatter; the driver repairs it before a verdict`,
        ...asFulcrumFrontmatterDefectLines({
          path: fulcrum.path,
          parse: fulcrum.parse,
          dispute: null,
        }),
      ].join('\n'),
      { path: fulcrum.path },
    );

  // refuse an entry that holds no dispute — read from the same state every gate reads, so the
  // lever accepts exactly the entries the gate asks a human to rule
  const state = asRouteFulcrumDisputeState({ fulcrums, rows, reports });
  const entry = getOneDisputeEntryRulable({ state, case: input.case });
  if (!entry)
    throw new BadRequestError(
      [
        `fulcrum ${input.case} holds no dispute a human can rule`,
        `   ├─ file: ${fulcrum.path}`,
        `   └─ fix: none owed here; a fulcrum no dispute cites, with owed: none, is a design call`,
      ].join('\n'),
      { path: fulcrum.path },
    );

  // the same verdict, already proven on this content, is a no-op
  const verdict = entry.frontmatter.verdict;
  if (
    verdict?.ruled === input.ruled &&
    isFulcrumVerdictProven({
      case: entry.frontmatter.case,
      ruled: input.ruled,
      seen: entry.seen,
      disputes: entry.disputes,
      rows,
    })
  )
    return {
      outcome: 'unchanged',
      case: entry.frontmatter.case,
      path: entry.path,
      on: verdict.at,
    };

  // the content to write, checked to still be the content the human was shown
  const filePath = path.join(input.route, entry.path);
  const on: string = today();
  const content = await fs.readFile(filePath, 'utf8');
  const contentNext = asFulcrumContentWithVerdict({
    content,
    ruled: input.ruled,
    on,
  });
  const parseFresh = asFulcrumFrontmatter({ content });
  if (
    !contentNext ||
    parseFresh.kind !== 'valid' ||
    parseFresh.seen !== entry.seen
  )
    throw new MalfunctionError(
      'fulcrum changed between its read and its verdict write',
      {
        path: entry.path,
        hint: 'rerun rhx route.fulcrum.rule; another writer touched the file',
      },
    );

  // findsert the ledger row that proves this lever wrote it, on this content
  // .why = the row lands BEFORE the yaml: a run cut off between the two leaves an entry that still
  //        reads unruled (owed, and a re-run completes it), never a yaml verdict with no row, which
  //        every gate would read as forged
  await setFulcrumVerdictRow({
    route: input.route,
    row: {
      case: entry.frontmatter.case,
      ruled: input.ruled,
      on,
      seen: entry.seen,
      // the disputes the human ruled over, and where the log stood: a later dispute or an earlier
      // approval cannot then be read as covered by this verdict
      held: entry.disputes,
      after: reports.length,
    },
  });

  // write the verdict atomically: a crash mid-write must never truncate the argument body
  const fileTemp = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(fileTemp, contentNext);
  await fs.rename(fileTemp, filePath);
  return {
    outcome: 'ruled',
    case: entry.frontmatter.case,
    path: entry.path,
    on,
  };
};

/**
 * .what = the fulcrum a `--case` names, by its file's case id
 * .why = the frontmatter `case` must equal the file's id (an entry where they differ is unreadable),
 *        so the file id is the one key; a human types what the gate printed
 */
const getOneFulcrumByCase = (input: {
  fulcrums: RouteFulcrum[];
  case: string;
}): RouteFulcrum | null =>
  input.fulcrums.find((entry) => entry.slug === input.case) ?? null;

/**
 * .what = the live dispute entry a human may rule for a case: owed, reflected, or already ruled
 * .why = an owed one awaits a verdict, a reflected one may be overturned, and a ruled one may be
 *        re-ruled; a design call (`owed: none`, cited by no dispute) holds naught to rule
 */
const getOneDisputeEntryRulable = (input: {
  state: RouteFulcrumDisputeState;
  case: string;
}): RouteFulcrumDisputeEntry | null =>
  [
    ...input.state.owedHuman,
    ...input.state.reflected,
    ...input.state.ruled,
  ].find((entry) => entry.frontmatter.case === input.case) ?? null;
