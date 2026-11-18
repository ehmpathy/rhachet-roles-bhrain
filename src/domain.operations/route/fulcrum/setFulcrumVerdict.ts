import * as fs from 'fs/promises';
import { BadRequestError, MalfunctionError } from 'helpful-errors';
import { today } from 'iso-time';
import * as path from 'path';

import { getDecisionIsCallerHuman } from '../getDecisionIsCallerHuman';
import {
  asFulcrumFrontmatter,
  type FulcrumFrontmatter,
  type FulcrumVerdict,
} from './asFulcrumFrontmatter';
import { asFulcrumFrontmatterDefectLines } from './asFulcrumFrontmatterDefectLines';
import {
  type FulcrumVerdictRow,
  getAllFulcrumVerdictRows,
} from './getAllFulcrumVerdictRows';
import { getAllRouteFulcrums, type RouteFulcrum } from './getAllRouteFulcrums';
import { isFulcrumVerdictProven } from './isFulcrumVerdictProven';
import { setFulcrumVerdictRow } from './setFulcrumVerdictRow';

// .note = js-yaml ships no types; required as the rest of src does (asReviewRubricsConfig.ts)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require('js-yaml');

const FRONTMATTER_BLOCK_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/;

/**
 * .what = records a human's verdict on one disputed fulcrum: the yaml verdict plus a ledger row
 * .why = invariant 2: only a human rules a dispute. the ledger row is what proves the yaml verdict
 *        came from this lever, so a hand edit of the yaml alone reads as forged at every gate
 *
 * .note = `--case` may name the file's case id or the frontmatter's; the ledger row always keys
 *         on the frontmatter's, the one id every reader proves against
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
  const fulcrums = await getAllRouteFulcrums({ route: input.route });
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

  // refuse an entry that owes no human verdict
  const frontmatter = fulcrum.parse.frontmatter;
  if (frontmatter.owed !== 'human')
    throw new BadRequestError(
      [
        `fulcrum ${frontmatter.case} owes ${frontmatter.owed}, not a human verdict`,
        `   ├─ file: ${fulcrum.path}`,
        frontmatter.owed === 'reflect'
          ? `   └─ fix: none owed here; its reflection is tracked upstream at ${frontmatter.reflect}`
          : `   └─ fix: none owed here; a fulcrum with owed: none holds no dispute`,
      ].join('\n'),
      { path: fulcrum.path, owed: frontmatter.owed },
    );

  // the same verdict, already proven by the newest ledger row, is a no-op
  const rows = await getAllFulcrumVerdictRows({ route: input.route });
  const verdictOnRecord = getOneFulcrumVerdictOnRecord({
    frontmatter,
    ruled: input.ruled,
    rows,
  });
  if (verdictOnRecord)
    return {
      outcome: 'unchanged',
      case: frontmatter.case,
      path: fulcrum.path,
      on: verdictOnRecord.at,
    };

  // findsert the ledger row that proves this lever wrote it, keyed on the canonical case
  // .why = the row lands BEFORE the yaml: a run cut off between the two leaves an entry that still
  //        reads unruled (owed, and a re-run completes it), never a yaml verdict with no row, which
  //        every gate would read as forged
  const on: string = today();
  await setFulcrumVerdictRow({
    route: input.route,
    row: { case: frontmatter.case, ruled: input.ruled, on },
  });

  // rewrite the frontmatter with the verdict, body intact
  const filePath = path.join(input.route, fulcrum.path);
  const content = await fs.readFile(filePath, 'utf8');
  await fs.writeFile(
    filePath,
    asContentWithVerdict({ content, ruled: input.ruled, on }),
  );
  return { outcome: 'ruled', case: frontmatter.case, path: fulcrum.path, on };
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
 * .what = the entry's verdict when it already equals the asked one and the ledger proves it, or null
 * .why = a repeat of a verdict on record writes naught — neither the yaml nor a second ledger row
 */
const getOneFulcrumVerdictOnRecord = (input: {
  frontmatter: FulcrumFrontmatter;
  ruled: 'upheld' | 'conceded';
  rows: FulcrumVerdictRow[];
}): FulcrumVerdict | null => {
  const verdict = input.frontmatter.verdict;
  if (verdict?.ruled !== input.ruled) return null;
  const proven = isFulcrumVerdictProven({
    case: input.frontmatter.case,
    ruled: input.ruled,
    rows: input.rows,
  });
  return proven ? verdict : null;
};

/**
 * .what = swaps a fulcrum's frontmatter for one with `status: ruled` and the human verdict
 * .why = keeps the orchestrator above a narrative; the body below the block stays byte-identical
 */
const asContentWithVerdict = (input: {
  content: string;
  ruled: 'upheld' | 'conceded';
  on: string;
}): string => {
  // the caller parsed this block as valid; a file that lost it, or broke it, since is a race,
  // never a skip — and never a raw yaml fault, so the fresh content is parsed again first
  const match = input.content.match(FRONTMATTER_BLOCK_PATTERN);
  if (
    !match?.[1] ||
    asFulcrumFrontmatter({ content: input.content }).kind !== 'valid'
  )
    throw new MalfunctionError(
      'fulcrum frontmatter vanished or broke between its parse and its verdict write',
      { hint: 'rerun rhx route.fulcrum.rule; another writer touched the file' },
    );

  // the block already parsed valid, so it loads as a map of fields
  const loaded: unknown = yaml.load(match[1]);
  const raw: Record<string, unknown> =
    typeof loaded === 'object' && loaded !== null ? { ...loaded } : {};
  const block = yaml.dump(
    {
      ...raw,
      status: 'ruled',
      verdict: { by: 'human', at: input.on, ruled: input.ruled },
    },
    { lineWidth: -1 },
  );
  const body = input.content.slice(match[0].length);
  return `---\n${block}---\n${body}`;
};
