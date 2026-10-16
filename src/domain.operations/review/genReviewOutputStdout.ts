import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { MARK_OF_ABSENT } from '@src/domain.operations/review/meter/asFigureHuman';
import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asReviewOutcome } from './asReviewOutcome';

/**
 * .what = the owl pun stdout greets with, per outcome
 * .why = stdout greets, where the review file records; the words differ, the grade
 *        behind them is `asReviewOutcome`, which the file header reads too
 */
const PHRASE_OF_OUTCOME: Record<ReturnType<typeof asReviewOutcome>, string> = {
  blocked: '🦉 needs your talons',
  nitpicked: '🦉 just a few hoots',
  clear: '🦉 not even a vole',
};

/**
 * .what = generates the output metrics stdout (after brain invocation)
 * .why = displays realized metrics and review summary to user. the `🔍 review`
 *        anchor row parents the logs/review/summary tree so a base review reads
 *        with the same shape as the review.by aggregate's `🔍 review.by --role X`
 *        anchor (genReviewByStdout). one anchor form across both review contracts
 *        lets a reader place the tree by the same landmark.
 */
export const genReviewOutputStdout = (input: {
  /**
   * .note = each figure is null where the run's spend is unmeasured — it renders absent,
   *         never as a number. an input figure summed over the measured asks alone would
   *         read precise and low
   */
  tokens: {
    input: number | null;
    cacheSet: number | null;
    cacheGet: number | null;
    output: number | null;
    /**
     * null where any axis is unmeasured — a sum of the known axes alone would read low
     */
    total: number | null;
  };
  cost: {
    /**
     * null where the spend is unmeasured — it renders absent, never as a number
     */
    total: string | null;
  };
  time: {
    total: string;
  };
  paths: {
    logsRelative: string;
    reviewRelative: string;
  };
  summary: {
    blockersCount: number;
    nitpicksCount: number;
  };
}): string => {
  // format blocker line, its noun agreed with its count
  const blockerCounted = asCountedNoun({
    count: input.summary.blockersCount,
    one: 'blocker',
    many: 'blockers',
  });
  const blockerEmoji = input.summary.blockersCount > 0 ? ' 🔴' : '';

  // format nitpick line, its noun agreed with its count
  const nitpickCounted = asCountedNoun({
    count: input.summary.nitpicksCount,
    one: 'nitpick',
    many: 'nitpicks',
  });
  const nitpickEmoji = input.summary.nitpicksCount > 0 ? ' 🟠' : '';

  // grade the outcome; the review file header reads the same grade
  const outcome = asReviewOutcome(input.summary);
  const isAllGood = outcome === 'clear';

  // owl pun header based on outcome
  const owlHeader = PHRASE_OF_OUTCOME[outcome];

  // build summary section based on whether there are issues
  const summarySection = isAllGood
    ? `   └─ summary
      ├─ ${blockerCounted}
      ├─ ${nitpickCounted}
      └─ all good 👍`
    : `   └─ summary
      ├─ ${blockerCounted}${blockerEmoji}
      └─ ${nitpickCounted}${nitpickEmoji}`;

  return `
✨ metrics.realized
${asSpendLines({ tokens: input.tokens, cost: input.cost }).join('\n')}
   └─ time
      └─ total: ${input.time.total}

${owlHeader}

🔍 review
   ├─ logs: ${input.paths.logsRelative}
   ├─ review: ${input.paths.reviewRelative}
${summarySection}`.trim();
};

/**
 * .what = the one row that stands for the tokens and cost branches when no spend figure was measured
 * .why = a run whose spend is unmeasured is graded `unknown` by `rhx review._.cost`, which
 *        renders its figures absent. six absent rows that each repeat one caveat bury the
 *        one fact they carry, so the whole spend collapses to one row that states it once —
 *        and still never reads `$0` (rule.forbid.failhide)
 */
export const LINE_OF_SPEND_UNMEASURED =
  'spend: unmeasured 🟡 the brain reported no usage — unknown, not $0';

/**
 * .what = the key a branch closes with where some of its figures are absent
 * .why = a bare `—` must never be read as zero, so the branch says what it means — once,
 *        as its last row, rather than beside every absent figure
 */
export const LINE_OF_ABSENT_KEY = `${MARK_OF_ABSENT} = unmeasured, not zero`;

/**
 * .what = one branch of figures under the metrics tree, each absent figure a bare mark
 * .why = the caveat rides once per branch, as its final row, and only where a figure is absent
 */
const asFigureBranchLines = (input: {
  rows: { label: string; figure: string | null }[];
}): string[] => {
  // render each figure, or the bare mark where it is absent
  const lines = input.rows.map(
    (row) => `${row.label}: ${row.figure ?? MARK_OF_ABSENT}`,
  );

  // close the branch with the key, once, where any figure is absent
  const hasAbsent = input.rows.some((row) => row.figure === null);
  const linesKeyed = hasAbsent ? [...lines, LINE_OF_ABSENT_KEY] : lines;
  return linesKeyed.map(
    (line, index) =>
      `   │  ${index === linesKeyed.length - 1 ? '└─' : '├─'} ${line}`,
  );
};

/**
 * .what = the tokens and cost branches, or the one row that says none was measured
 * .why = a wholly unmeasured spend reads as one fact on one row; a partly measured one keeps
 *        each figure it has and marks each it lacks
 */
const asSpendLines = (input: {
  tokens: {
    input: number | null;
    cacheSet: number | null;
    cacheGet: number | null;
    output: number | null;
    total: number | null;
  };
  cost: { total: string | null };
}): string[] => {
  // collapse to one row where every figure is absent
  const figuresOfTokens = [
    input.tokens.input,
    input.tokens.cacheSet,
    input.tokens.cacheGet,
    input.tokens.output,
    input.tokens.total,
  ];
  const isSpendUnmeasured =
    figuresOfTokens.every((figure) => figure === null) &&
    input.cost.total === null;
  if (isSpendUnmeasured) return [`   ├─ ${LINE_OF_SPEND_UNMEASURED}`];

  // otherwise render each branch, its absent figures keyed once
  return [
    '   ├─ tokens',
    ...asFigureBranchLines({
      rows: [
        {
          label: 'input',
          figure: asTokenCountOrNull({ of: input.tokens.input }),
        },
        {
          label: 'cache.set',
          figure: asTokenCountOrNull({ of: input.tokens.cacheSet }),
        },
        {
          label: 'cache.get',
          figure: asTokenCountOrNull({ of: input.tokens.cacheGet }),
        },
        {
          label: 'output',
          figure: asTokenCountOrNull({ of: input.tokens.output }),
        },
        {
          label: 'total',
          figure: asTokenCountOrNull({ of: input.tokens.total }),
        },
      ],
    }),
    '   ├─ cost',
    ...asFigureBranchLines({
      rows: [{ label: 'total', figure: input.cost.total }],
    }),
  ];
};

/**
 * .what = a token count at full precision, or null where unmeasured
 * .why = the count renders with thousands separators; null passes through to render absent
 */
const asTokenCountOrNull = (input: { of: number | null }): string | null =>
  input.of === null ? null : asCountHuman({ of: input.of });
