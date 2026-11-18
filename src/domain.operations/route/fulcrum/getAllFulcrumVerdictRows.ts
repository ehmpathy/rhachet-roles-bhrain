import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

/**
 * .what = one human verdict on one fulcrum, as the human-only lever recorded it
 * .why = verdict provenance: a `verdict` in a fulcrum's yaml is trusted only when the lever wrote
 *        a matched row in this ledger. a hand edit of the yaml has no row, so it cannot lift the gate
 * .note = a date, never a timestamp (`rule.forbid.timestamps-in-route-artifacts`)
 */
export interface FulcrumVerdictRow {
  case: string;
  ruled: 'upheld' | 'conceded';
  on: string;
}

/**
 * .what = the ledger's name, inside the route's `.fulcrums/` dir
 * .why = the ledger sits beside the entries it proves, so it is tracked with them: a verdict
 *        committed on one clone stays proven on every other
 */
export const FULCRUM_VERDICT_LEDGER_NAME = 'verdicts.jsonl';

/**
 * .what = reads every verdict row the lever has written on a route, in the order written
 * .why = the gate and the linter test each yaml verdict against this ledger
 */
export const getAllFulcrumVerdictRows = async (input: {
  route: string;
}): Promise<FulcrumVerdictRow[]> => {
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
 * .what = parses a ledger's content into its verdict rows, blank lines skipped
 * .why = each row carries its line number, so a refusal can name where the ledger broke
 */
const asAllFulcrumVerdictRowsFromContent = (input: {
  content: string;
  ledger: string;
}): FulcrumVerdictRow[] =>
  input.content.split('\n').flatMap((line, index) =>
    line.trim().length
      ? [
          asFulcrumVerdictRow({
            line,
            lineNumber: index + 1,
            ledger: input.ledger,
          }),
        ]
      : [],
  );

/**
 * .what = parses one ledger line into a verdict row, or refuses with the file and line named
 * .why = every gate on the route reads this ledger; a bare SyntaxError would halt them all with
 *        no clue where. a row of the wrong shape is refused too, never trusted as a proof
 * .note = no metadata bag: the message already names the ledger, the line number, and the line
 */
const asFulcrumVerdictRow = (input: {
  line: string;
  lineNumber: number;
  ledger: string;
}): FulcrumVerdictRow => {
  // parse the line; a malformed one names its place
  const parsed: unknown = (() => {
    try {
      return JSON.parse(input.line);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return null;
    }
  })();

  // accept only the shape the lever writes
  if (!isFulcrumVerdictRowShape(parsed))
    throw new BadRequestError(
      [
        `fulcrum verdict ledger holds an unreadable row at line ${input.lineNumber}`,
        `   ├─ ledger: ${input.ledger}`,
        `   ├─ line: ${input.line}`,
        `   └─ fix: restore the line from git; only rhx route.fulcrum.rule writes this ledger`,
      ].join('\n'),
    );
  return { case: parsed.case, ruled: parsed.ruled, on: parsed.on };
};

/**
 * .what = narrows a parsed json value to a verdict row
 * .why = the ledger is a file a hand can edit; its shape is checked, never assumed
 */
const isFulcrumVerdictRowShape = (
  value: unknown,
): value is FulcrumVerdictRow => {
  if (typeof value !== 'object' || value === null) return false;
  const row: Record<string, unknown> = { ...value };
  return (
    typeof row.case === 'string' &&
    (row.ruled === 'upheld' || row.ruled === 'conceded') &&
    typeof row.on === 'string'
  );
};
