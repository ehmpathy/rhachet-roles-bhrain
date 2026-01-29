/**
 * .what = generates the input metrics stdout (before brain invocation)
 * .why = displays expected metrics to user before review begins
 */
export const genReviewInputStdout = (input: {
  files: {
    rulesCount: number;
    refsCount: number;
    targetsCount: number;
  };
  tokens: {
    estimate: number;
    contextWindowPercent: number;
  };
  cost: {
    estimate: number;
  };
  logDirRelative: string;
}): string => {
  // build files tree conditionally based on refs presence
  const filesTree =
    input.files.refsCount > 0
      ? `   │  ├─ rules: ${input.files.rulesCount}
   │  ├─ refs: ${input.files.refsCount}
   │  └─ targets: ${input.files.targetsCount}`
      : `   │  ├─ rules: ${input.files.rulesCount}
   │  └─ targets: ${input.files.targetsCount}`;

  return `
🔭 metrics.expected
   ├─ files
${filesTree}
   ├─ tokens
   │  ├─ estimate: ${input.tokens.estimate}
   │  └─ context: ${input.tokens.contextWindowPercent.toFixed(1)}%
   └─ cost
      └─ estimate: $${input.cost.estimate.toFixed(4)}

🪵 logs
   ├─ scope: ${input.logDirRelative}/input.scope.json
   ├─ metrics: ${input.logDirRelative}/metrics.expected.json
   └─ tokens: ${input.logDirRelative}/tokens.expected.md`.trim();
};
