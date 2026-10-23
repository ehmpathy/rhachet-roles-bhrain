import type { TokenCategory } from '@src/domain.objects/Reflector/TokenBlock';
import type { TokenSpendRepaidRow } from '@src/domain.objects/Reflector/TokenSpendReport';

import { asTokenRepaidRank } from './asTokenRepaidRank';

/**
 * .what = one compression target: a repaid row, its share of the whole, and a fixed hint
 */
export interface TokenProposalTarget {
  row: TokenSpendRepaidRow;
  share: number;
  hint: string | null;
}

/**
 * .what = the fixed hint per category — what a cut usually looks like
 * .why = the tool cannot know which brief was never cited, so the hint is a line per
 *        category, never a claim about this transcript
 */
const HINT_BY_CATEGORY: Record<TokenCategory, string | null> = {
  'boot.instructions': 'move briefs from say to ref',
  'tool.result': 'a summary on stdout, the log on disk',
  'hook.output': 'shorten the hook payload',
  'system.reminder': null,
  'human.words': null,
  'assistant.own': 'terser replies, fewer re-reads',
  unattributed: null,
};

/**
 * .what = the fixed hint per tool, for a tool result whose cut differs from the default
 * .why = a Read is cut by a narrower range, a Grep by a narrower pattern; the category hint
 *        (a summary on stdout) fits a command's output and misleads for these
 */
const HINT_BY_TOOL: Record<string, string> = {
  Read: 'read by range',
  Grep: 'narrow the pattern or the path',
  Glob: 'narrow the pattern',
};

/**
 * .what = the hint for one row: its tool's hint when it has one, else its category's
 * .why = one category can hold rows whose cuts differ, and the label names which
 */
const asHintOfRow = (input: { row: TokenSpendRepaidRow }): string | null => {
  const tool = input.row.label.split(' · ')[0] ?? '';
  const toolHint =
    input.row.category === 'tool.result' ? HINT_BY_TOOL[tool] : undefined;
  return toolHint ?? HINT_BY_CATEGORY[input.row.category];
};

/**
 * .what = the repaid rows ranked as compression targets
 * .why = once each target's repaid cost is on screen, the compression is a sort, not a
 *        debate. price ranks when every row is priced (it alone knows a read from a
 *        write); tokens rank when any row is not, and the report says which
 *
 * .note = a share is an upper bound — the most a cut of that target could save
 */
export const asTokenProposal = (input: {
  repaid: TokenSpendRepaidRow[];
  limit: number;
}): { rankedBy: 'price' | 'tokens'; targets: TokenProposalTarget[] } => {
  // cuts target what a human can act on; the harness floor is no target
  const candidates = input.repaid.filter(
    (row) => row.category !== 'unattributed',
  );

  // the measure of a row, and the whole it is a share of
  const { rankedBy, measure } = asTokenRepaidRank({ repaid: input.repaid });
  const whole = asMeasureSum({ rows: input.repaid, measure });

  return {
    rankedBy,
    targets: asTopRows({ rows: candidates, measure, limit: input.limit }).map(
      (row) => asTarget({ row, measure, whole }),
    ),
  };
};

/**
 * .what = the sum of a measure over rows
 * .why = every share in the proposal is of this one whole
 */
const asMeasureSum = (input: {
  rows: TokenSpendRepaidRow[];
  measure: (row: TokenSpendRepaidRow) => number;
}): number => input.rows.reduce((sum, row) => sum + input.measure(row), 0);

/**
 * .what = the `limit` rows with the largest measure, largest first
 */
const asTopRows = (input: {
  rows: TokenSpendRepaidRow[];
  measure: (row: TokenSpendRepaidRow) => number;
  limit: number;
}): TokenSpendRepaidRow[] =>
  [...input.rows]
    .sort((a, b) => input.measure(b) - input.measure(a))
    .slice(0, input.limit);

/**
 * .what = one row as a target: its share of the whole, and its hint
 */
const asTarget = (input: {
  row: TokenSpendRepaidRow;
  measure: (row: TokenSpendRepaidRow) => number;
  whole: number;
}): TokenProposalTarget => ({
  row: input.row,
  share: input.whole === 0 ? 0 : input.measure(input.row) / input.whole,
  hint: asHintOfRow({ row: input.row }),
});
