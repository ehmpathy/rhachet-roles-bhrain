/**
 * .what = generates the output metrics stdout (after brain invocation)
 * .why = displays realized metrics and review summary to user
 */
export const genReviewOutputStdout = (input: {
  tokens: {
    input: number;
    cacheSet: number;
    cacheGet: number;
    output: number;
    total: number;
  };
  cost: {
    total: string;
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
  // format blocker line
  const blockerLabel =
    input.summary.blockersCount === 1 ? 'blocker' : 'blockers';
  const blockerEmoji = input.summary.blockersCount > 0 ? ' 🔴' : '';

  // format nitpick line
  const nitpickLabel =
    input.summary.nitpicksCount === 1 ? 'nitpick' : 'nitpicks';
  const nitpickEmoji = input.summary.nitpicksCount > 0 ? ' 🟠' : '';

  // determine outcome category
  const hasBlockers = input.summary.blockersCount > 0;
  const hasOnlyNitpicks =
    input.summary.blockersCount === 0 && input.summary.nitpicksCount > 0;
  const isAllGood =
    input.summary.blockersCount === 0 && input.summary.nitpicksCount === 0;

  // owl pun header based on outcome
  const owlHeader = hasBlockers
    ? '🦉 needs your talons'
    : hasOnlyNitpicks
      ? '🦉 just a few hoots'
      : '🦉 not even a vole';

  // build summary section based on whether there are issues
  const summarySection = isAllGood
    ? `   └─ summary
      ├─ ${input.summary.blockersCount} ${blockerLabel}
      ├─ ${input.summary.nitpicksCount} ${nitpickLabel}
      └─ all good 👍`
    : `   └─ summary
      ├─ ${input.summary.blockersCount} ${blockerLabel}${blockerEmoji}
      └─ ${input.summary.nitpicksCount} ${nitpickLabel}${nitpickEmoji}`;

  return `
✨ metrics.realized
   ├─ tokens
   │  ├─ input: ${input.tokens.input.toLocaleString()}
   │  ├─ cache.set: ${input.tokens.cacheSet.toLocaleString()}
   │  ├─ cache.get: ${input.tokens.cacheGet.toLocaleString()}
   │  ├─ output: ${input.tokens.output.toLocaleString()}
   │  └─ total: ${input.tokens.total.toLocaleString()}
   ├─ cost
   │  └─ total: ${input.cost.total}
   └─ time
      └─ total: ${input.time.total}

${owlHeader}
   ├─ logs: ${input.paths.logsRelative}
   ├─ review: ${input.paths.reviewRelative}
${summarySection}`.trim();
};
