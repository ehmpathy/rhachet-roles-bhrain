import * as fs from 'fs/promises';
import * as path from 'path';

import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';

import { FULCRUM_VERDICT_LEDGER_NAME } from './FULCRUM_VERDICT_LEDGER_NAME';

/**
 * .what = reads every verdict row the lever has written on a route, or the defect that names
 *         where the ledger broke
 * .why = a halt that only SHOWS the gate must render a corrupt ledger as a fact, and a lint must
 *        name it as a block. a discriminated result lets both read the fault as data, never catch
 *        it by its error class — so no other fault (the passage log, a permission error) can be
 *        mislabeled as the ledger's
 */
export const getAllFulcrumVerdictRowsOrDefect = async (input: {
  route: string;
}): Promise<
  { rows: FulcrumVerdictRow[]; defect: null } | { rows: null; defect: string }
> => {
  const ledger = path.join(
    input.route,
    '.fulcrums',
    FULCRUM_VERDICT_LEDGER_NAME,
  );
  const content = await fs
    .readFile(ledger, 'utf8')
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return '';
      throw error;
    });
  return asAllFulcrumVerdictRowsFromContent({ content, ledger });
};

/**
 * .what = parses a ledger's content into its verdict rows, blank lines skipped, or the first
 *         line that does not parse
 * .why = each row carries its line number, so the defect names where the ledger broke
 */
const asAllFulcrumVerdictRowsFromContent = (input: {
  content: string;
  ledger: string;
}):
  | { rows: FulcrumVerdictRow[]; defect: null }
  | { rows: null; defect: string } => {
  const parsed = input.content
    .split('\n')
    .flatMap((line, index) =>
      line.trim().length
        ? [{ line, lineNumber: index + 1, row: asFulcrumVerdictRow({ line }) }]
        : [],
    );
  const broken = parsed.find((entry) => entry.row === null);
  if (broken)
    return {
      rows: null,
      defect: [
        `fulcrum verdict ledger holds an unreadable row at line ${broken.lineNumber}`,
        `   ├─ ledger: ${input.ledger}`,
        `   ├─ line: ${broken.line}`,
        `   └─ fix: restore the line from git; only rhx route.fulcrum.rule writes this ledger`,
      ].join('\n'),
    };
  return {
    rows: parsed.flatMap((entry) => (entry.row ? [entry.row] : [])),
    defect: null,
  };
};

/**
 * .what = parses one ledger line into a verdict row, or null when it is not one
 * .why = a row of the wrong shape is never trusted as a proof; the ledger is a file a hand can edit
 */
const asFulcrumVerdictRow = (input: {
  line: string;
}): FulcrumVerdictRow | null => {
  // parse the line; a malformed one reads as no row
  const parsed: unknown = (() => {
    try {
      return JSON.parse(input.line);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return null;
    }
  })();
  if (typeof parsed !== 'object' || parsed === null) return null;

  // accept only the shape the lever writes
  const row: Record<string, unknown> = { ...parsed };
  if (
    typeof row.case !== 'string' ||
    (row.ruled !== 'upheld' && row.ruled !== 'conceded') ||
    typeof row.on !== 'string' ||
    typeof row.seen !== 'string'
  )
    return null;
  return { case: row.case, ruled: row.ruled, on: row.on, seen: row.seen };
};
