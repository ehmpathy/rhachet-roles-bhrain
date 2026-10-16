import type { AttributionGrade } from '@src/domain.objects/Reviewer/AttributionGrade';
import type { ReviewRunMetricsExpected } from '@src/domain.objects/Reviewer/ReviewRunMetricsExpected';
import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { asPercentHuman } from '@src/domain.operations/review/asPercentHuman';
import { asScopeFlagHuman } from '@src/domain.operations/review/asScopeFlagHuman';

/**
 * .what = the last rows of the tokens branch — the context share, then each caveat
 * .why = a caveat renders ONLY where it holds, so a clean prompt costs no line; and
 *        the `└─` must land on whichever row is genuinely last, which is why they
 *        are rendered together
 */
const asContextAndCaveatLines = (input: {
  contextWindowPercent: number;
  attribution: AttributionGrade;
  warnings: string[];
  logDirRelative: string;
}): string => {
  // the unattributed caveat names its next step: the run breadth reads this very
  // log dir once the review settles, and shows which section the scaffold swallowed
  // (rule.require.errors-name-the-fix)
  const rows = [
    `context: ${asPercentHuman({ of: input.contextWindowPercent })}`,
    ...input.warnings.map((caveat) => `🟡 ${caveat}`),
    ...(input.attribution === 'unattributed'
      ? [
          `🟡 UNATTRIBUTED — scaffold may hide an input with no row of its own`,
          `inspect once it settles: rhx review._.cost --of run --at ${input.logDirRelative}`,
        ]
      : []),
  ];
  return rows
    .map((row, i) => `   │  ${i === rows.length - 1 ? '└─' : '├─'} ${row}`)
    .join('\n');
};

/**
 * .what = generates the input metrics stdout (before brain invocation)
 * .why = displays expected metrics to user before review begins
 */
export const genReviewInputStdout = (input: {
  files: ReviewRunMetricsExpected['files'];
  tokens: ReviewRunMetricsExpected['tokens'];
  cost: {
    estimate: string;
  };
  logDirRelative: string;
  /**
   * whether this prompt's own census could vouch for its rows. read here,
   * live, since an input with no row of its own is the costliest cell the
   * census guards
   */
  attribution: AttributionGrade;
  /**
   * the prompt compiler's own caveats — a prompt past 60% of the window,
   * where review quality degrades. required, so the one signal that a review
   * is degraded always reaches a human (rule.forbid.failhide)
   */
  warnings: string[];
  preview: {
    ruleDirs: Array<{ path: string; tokensHuman: string; tokensScale: string }>;
    targetDirs: Array<{
      path: string;
      tokensHuman: string;
      tokensScale: string;
    }>;
  };
}): string => {
  // build files tree; refs and conversation render only when present. each count
  // reads in the same grouped form as the token estimate beside it
  const filesTree = [
    `   │  ├─ rules: ${asCountHuman({ of: input.files.rulesCount })}`,
    ...(input.files.refsCount > 0
      ? [`   │  ├─ refs: ${asCountHuman({ of: input.files.refsCount })}`]
      : []),
    ...(input.files.conversationCount > 0
      ? [
          `   │  ├─ conversation: ${asCountHuman({ of: input.files.conversationCount })}`,
        ]
      : []),
    `   │  └─ targets: ${asCountHuman({ of: input.files.targetsCount })}`,
  ].join('\n');

  // format dir entries with token info
  const formatDirEntry = (dir: {
    path: string;
    tokensHuman: string;
    tokensScale: string;
  }) => `${dir.path} (${dir.tokensHuman}, ${dir.tokensScale})`;

  // an empty preview renders `(none)` — a blank after a label reads as a failed render
  const ruleDirsFormatted = asScopeFlagHuman({
    of: input.preview.ruleDirs.map(formatDirEntry),
  });
  const targetDirsFormatted = asScopeFlagHuman({
    of: input.preview.targetDirs.map(formatDirEntry),
  });

  return `
🔭 metrics.expected
   ├─ files
${filesTree}
   ├─ tokens
   │  ├─ estimate: ${asCountHuman({ of: input.tokens.estimate })}
${asContextAndCaveatLines({ contextWindowPercent: input.tokens.contextWindowPercent, attribution: input.attribution, warnings: input.warnings, logDirRelative: input.logDirRelative })}
   └─ cost
      └─ estimate: ${input.cost.estimate}

🪵 logs
   ├─ scope: ${input.logDirRelative}/input.scope.json
   ├─ metrics: ${input.logDirRelative}/metrics.expected.json
   └─ tokens: ${input.logDirRelative}/tokens.expected.md
      ├─ rules: ${ruleDirsFormatted}
      └─ targets: ${targetDirsFormatted}`.trim();
};
