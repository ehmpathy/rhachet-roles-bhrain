/**
 * .what = generates the header stdout (brain info and scope filters)
 * .why = displays review configuration and scope at the top before metrics
 */
export const genReviewHeaderStdout = (input: {
  brain: string;
  focus: 'push' | 'pull';
  scope: {
    diffs: string | null;
    pathsWith: string[] | null;
    pathsWout: string[] | null;
    join: 'union' | 'intersect';
  };
}): string => {
  // build scope tree with only specified filters
  const scopeLines: string[] = [];
  if (input.scope.diffs) {
    scopeLines.push(`diffs: ${input.scope.diffs}`);
  }
  const hasPathsWith =
    input.scope.pathsWith && input.scope.pathsWith.length > 0;
  const hasPathsWout =
    input.scope.pathsWout && input.scope.pathsWout.length > 0;
  if (hasPathsWith) {
    // use "paths:" if no wout specified; "paths-with:" if both are used
    const label = hasPathsWout ? 'paths-with' : 'paths';
    scopeLines.push(`${label}: ${input.scope.pathsWith!.join(', ')}`);
  }
  if (hasPathsWout) {
    scopeLines.push(`paths-wout: ${input.scope.pathsWout!.join(', ')}`);
  }
  if (input.scope.diffs && hasPathsWith) {
    scopeLines.push(`join: ${input.scope.join}`);
  }

  // format scope lines with proper tree characters (no vertical bar since scope is last)
  const scopeTree = scopeLines
    .map((line, i) => {
      const prefix = i === scopeLines.length - 1 ? '└─' : '├─';
      return `      ${prefix} ${line}`;
    })
    .join('\n');

  return `🦉 let's review
   ├─ brain: ${input.brain}
   ├─ focus: ${input.focus}
   └─ scope
${scopeTree}`;
};

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
    estimate: string;
  };
  logDirRelative: string;
  preview: {
    ruleDirs: Array<{ path: string; tokensHuman: string; tokensScale: string }>;
    targetDirs: Array<{
      path: string;
      tokensHuman: string;
      tokensScale: string;
    }>;
  };
}): string => {
  // build files tree conditionally based on refs presence
  const filesTree =
    input.files.refsCount > 0
      ? `   │  ├─ rules: ${input.files.rulesCount}
   │  ├─ refs: ${input.files.refsCount}
   │  └─ targets: ${input.files.targetsCount}`
      : `   │  ├─ rules: ${input.files.rulesCount}
   │  └─ targets: ${input.files.targetsCount}`;

  // format dir entries with token info
  const formatDirEntry = (dir: {
    path: string;
    tokensHuman: string;
    tokensScale: string;
  }) => `${dir.path} (${dir.tokensHuman}, ${dir.tokensScale})`;

  const ruleDirsFormatted = input.preview.ruleDirs
    .map(formatDirEntry)
    .join(', ');
  const targetDirsFormatted = input.preview.targetDirs
    .map(formatDirEntry)
    .join(', ');

  return `
🔭 metrics.expected
   ├─ files
${filesTree}
   ├─ tokens
   │  ├─ estimate: ${input.tokens.estimate.toLocaleString()}
   │  └─ context: ${input.tokens.contextWindowPercent.toFixed(1)}%
   └─ cost
      └─ estimate: ${input.cost.estimate}

🪵 logs
   ├─ scope: ${input.logDirRelative}/input.scope.json
   ├─ metrics: ${input.logDirRelative}/metrics.expected.json
   └─ tokens: ${input.logDirRelative}/tokens.expected.md
      ├─ rules: ${ruleDirsFormatted}
      └─ targets: ${targetDirsFormatted}`.trim();
};
