import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import { asIsoPriceHuman, type IsoPriceHuman } from 'iso-price';
import { asDurationInWords, type IsoDuration } from 'iso-time';
import * as path from 'path';
import { type BrainChoice, type ContextBrain, isBrainRepl } from 'rhachet';
import { z } from 'zod';

import { compileReviewPrompt } from '@src/domain.operations/review/compileReviewPrompt';
import { enumFilesFromDiffs } from '@src/domain.operations/review/enumFilesFromDiffs';
import { enumFilesFromGlob } from '@src/domain.operations/review/enumFilesFromGlob';
import { formatReviewOutput } from '@src/domain.operations/review/formatReviewOutput';
import {
  genReviewHeaderStdout,
  genReviewInputStdout,
} from '@src/domain.operations/review/genReviewInputStdout';
import { genReviewOutputStdout } from '@src/domain.operations/review/genReviewOutputStdout';
import { genTokenBreakdownMarkdown } from '@src/domain.operations/review/genTokenBreakdownMarkdown';
import { genTokenBreakdownReport } from '@src/domain.operations/review/genTokenBreakdownReport';
import { writeInputArtifacts } from '@src/domain.operations/review/writeInputArtifacts';
import { writeOutputArtifacts } from '@src/domain.operations/review/writeOutputArtifacts';

/**
 * .what = schema for review issue snippet
 * .why = enables code examples in review output
 */
const schemaOfReviewSnippet = z.object({
  lang: z.string(),
  code: z.string(),
});

/**
 * .what = schema for review issue
 * .why = enables structured output from brain.choice.ask
 */
const schemaOfReviewIssue = z.object({
  rule: z.string(),
  title: z.string(),
  description: z.string(),
  locations: z.array(z.string()),
  snippet: schemaOfReviewSnippet,
});

/**
 * .what = schema for review output
 * .why = enables structured output from brain.choice.ask
 */
const schemaOfReviewOutput = z.object({
  done: z.boolean(),
  blockers: z.array(schemaOfReviewIssue),
  nitpicks: z.array(schemaOfReviewIssue),
});

/**
 * .what = result of stepReview execution
 * .why = enables caller to inspect review outcome and artifacts
 */
export type StepReviewResult = {
  review: {
    formatted: string;
  };
  log: {
    dir: string;
  };
  output: {
    path: string;
  };
  metrics: {
    files: {
      rulesCount: number;
      refsCount: number;
      targetsCount: number;
    };
    expected: {
      tokens: {
        estimate: number;
        contextWindowPercent: number;
      };
      cost: {
        estimate: IsoPriceHuman;
      };
    };
    realized: {
      tokens: {
        input: number;
        inputCacheCreation: number;
        inputCacheRead: number;
        output: number;
      };
      cost: {
        input: IsoPriceHuman;
        cacheWrite: IsoPriceHuman;
        cacheRead: IsoPriceHuman;
        output: IsoPriceHuman;
        total: IsoPriceHuman;
      };
      time: IsoDuration;
    };
  };
};

/**
 * .what = generates ISO timestamp for log directory
 * .why = enables unique, sortable log directories
 */
const genLogTimestamp = (): string => {
  return new Date().toISOString().replace(/[:.]/g, '-');
};

/**
 * .what = simple spinner for CLI feedback
 * .why = shows progress during long operations
 */
const withSpinner = async <T>(input: {
  message: string;
  operation: () => Promise<T>;
}): Promise<T> => {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const startTime = Date.now();
  let i = 0;

  // print title once
  console.log(input.message);

  // render only the elapsed time branch line
  const render = (frame: string) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    process.stdout.write(`\r   └─ elapsed: ${elapsed}s ${frame}  `);
  };

  render(frames[0]!);
  const interval = setInterval(() => {
    i = (i + 1) % frames.length;
    render(frames[i]!);
  }, 100);

  try {
    const result = await input.operation();
    clearInterval(interval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    process.stdout.write(`\r   └─ elapsed: ${elapsed}s ✓\n\n`);
    return result;
  } catch (error) {
    clearInterval(interval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    process.stdout.write(`\r   └─ elapsed: ${elapsed}s ✗\n`);
    throw error;
  }
};

/**
 * .what = executes a code review against specified rules and targets
 * .why = core orchestration flow for reviewer role
 */
export const stepReview = async (
  input: {
    rules: string | string[];
    diffs?: string;
    paths?: string | string[];
    pathsWith?: string | string[];
    pathsWout?: string | string[];
    join?: 'union' | 'intersect';
    refs?: string | string[];
    output: string;
    focus: 'pull' | 'push';
    goal: 'exhaustive' | 'representative';
    cwd?: string;
  },
  context: {
    brain: ContextBrain<BrainChoice>;
  },
): Promise<StepReviewResult> => {
  const cwd = input.cwd ?? process.cwd();

  // validate that pull focus is only used with brains that have tool use
  const choiceIsRepl = isBrainRepl(context.brain.brain.choice);
  if (input.focus === 'pull' && !choiceIsRepl)
    throw new BadRequestError(
      `focus 'pull' requires a brain with tool use (BrainRepl). ` +
        `brain '${context.brain.brain.choice.slug}' is a BrainAtom without tool use. ` +
        `use focus 'push' instead, or choose a BrainRepl.`,
      { brain: context.brain.brain.choice.slug, focus: input.focus },
    );

  // validate that at least one of rules, diffs, or paths is specified
  const hasRules =
    input.rules && (Array.isArray(input.rules) ? input.rules.length > 0 : true);
  const hasDiffs = !!input.diffs;
  const hasPaths =
    input.paths && (Array.isArray(input.paths) ? input.paths.length > 0 : true);
  if (!hasRules && !hasDiffs && !hasPaths)
    throw new BadRequestError(
      'must specify at least one of --rules, --diffs, or --paths',
    );

  // ensure output parent directory exists (create if absent)
  const outputParent = path.dirname(input.output);
  const outputParentAbsolute = path.isAbsolute(outputParent)
    ? outputParent
    : path.join(cwd, outputParent);
  await fs.mkdir(outputParentAbsolute, { recursive: true });

  // create log directory early for debug (even if validation fails)
  const logDir = path.join(cwd, '.log', 'bhrain', 'review', genLogTimestamp());
  await fs.mkdir(logDir, { recursive: true });

  // enumerate rule files
  const ruleGlobs = Array.isArray(input.rules)
    ? input.rules
    : [input.rules].filter(Boolean);
  const ruleFiles = await enumFilesFromGlob({ glob: ruleGlobs, cwd });
  if (ruleGlobs.length > 0 && ruleFiles.length === 0) {
    console.error('');
    console.error('🦉 woah there');
    console.error('');
    console.error('✋ --rules glob found nada');
    console.error(
      `   ├─ rules: ${Array.isArray(input.rules) ? input.rules.join(', ') : input.rules}`,
    );
    console.error(
      `   └─ hint: verify the glob pattern matches files in your repo`,
    );
    console.error('');
    throw new BadRequestError('--rules glob was ineffective');
  }

  // enumerate target files from diffs
  const targetFilesFromDiffs = await (async () => {
    if (!input.diffs) return [];

    // validate range is a known value
    const validRanges = ['since-main', 'since-commit', 'since-staged'] as const;
    if (!validRanges.includes(input.diffs as (typeof validRanges)[number])) {
      console.error('');
      console.error('🦉 woah there');
      console.error('');
      console.error('✋ --diffs range not recognized');
      console.error(`   ├─ received: ${input.diffs}`);
      console.error(`   ├─ expected: since-main | since-commit | since-staged`);
      console.error(`   └─ hint: use one of the supported range values`);
      console.error('');
      throw new BadRequestError('validation failed');
    }

    return enumFilesFromDiffs({
      range: input.diffs as 'since-main' | 'since-commit' | 'since-staged',
      cwd,
    });
  })();

  // enumerate target files from paths
  // build positive globs from --paths (legacy) and --paths-with
  const pathGlobs = input.paths
    ? Array.isArray(input.paths)
      ? input.paths
      : [input.paths]
    : [];
  const pathsWithGlobs = input.pathsWith
    ? Array.isArray(input.pathsWith)
      ? input.pathsWith
      : [input.pathsWith]
    : [];
  const positivePathGlobs = [
    ...pathGlobs.filter((p) => !p.startsWith('!')),
    ...pathsWithGlobs,
  ];

  // build negative globs from --paths (legacy ! prefix) and --paths-wout
  const pathsWoutGlobs = input.pathsWout
    ? Array.isArray(input.pathsWout)
      ? input.pathsWout
      : [input.pathsWout]
    : [];
  const negativePathGlobs = [
    ...pathGlobs.filter((p) => p.startsWith('!')).map((p) => p.slice(1)),
    ...pathsWoutGlobs,
  ];

  const targetFilesFromPaths = await enumFilesFromGlob({
    glob: positivePathGlobs,
    cwd,
  });

  // join target files from diffs and paths (union or intersect), then apply exclusions
  const joinMode = input.join ?? 'intersect';
  const targetFilesJoined = (() => {
    // check which sources were requested vs which have results
    const diffsRequested = !!input.diffs;
    const pathsRequested = positivePathGlobs.length > 0;
    const hasDiffs = targetFilesFromDiffs.length > 0;
    const hasPaths = targetFilesFromPaths.length > 0;

    // single source: join mode doesn't apply
    if (!diffsRequested) return targetFilesFromPaths;
    if (!pathsRequested) return targetFilesFromDiffs;

    // both sources requested: apply join mode
    if (joinMode === 'intersect') {
      const pathsSet = new Set(targetFilesFromPaths);
      return targetFilesFromDiffs.filter((file) => pathsSet.has(file));
    }

    // union: combine both sources
    if (!hasDiffs) return targetFilesFromPaths;
    if (!hasPaths) return targetFilesFromDiffs;
    return [...new Set([...targetFilesFromDiffs, ...targetFilesFromPaths])];
  })();
  const targetFiles = targetFilesJoined
    .filter((file) => {
      for (const pattern of negativePathGlobs) {
        if (file === pattern || file.endsWith(`/${pattern}`)) return false;
        if (pattern.includes('*')) {
          const regex = new RegExp(
            '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
          );
          if (regex.test(file)) return false;
        }
      }
      return true;
    })
    .sort();

  // write scope debug file before validation (enables debug even on failure)
  const logDirRelative = path.relative(cwd, logDir);
  await fs.writeFile(
    path.join(logDir, 'input.scope.debug.json'),
    JSON.stringify(
      {
        args: {
          rules: input.rules,
          diffs: input.diffs,
          paths: input.paths,
          pathsWith: input.pathsWith,
          pathsWout: input.pathsWout,
          join: input.join ?? 'intersect',
          refs: input.refs,
        },
        resolution: {
          ruleFiles,
          targetFilesFromDiffs,
          targetFilesFromPaths,
          joinMode,
          targetFilesJoined,
          targetFiles,
        },
      },
      null,
      2,
    ),
    'utf-8',
  );

  // validate combined scope is non-empty
  if (targetFiles.length === 0) {
    console.error('');
    console.error('🦉 woah there');
    console.error('');
    console.error('✋ combined scope resolves to zero files');
    console.error(`   ├─ targets`);
    console.error(`   │  ├─ diffs: ${input.diffs ?? '(none)'}`);
    console.error(
      `   │  │  └─ files: ${input.diffs ? targetFilesFromDiffs.length : 'null'}`,
    );
    console.error(`   │  ├─ paths: ${input.paths ?? '(none)'}`);
    console.error(
      `   │  │  └─ files: ${input.paths ? targetFilesFromPaths.length : 'null'}`,
    );
    console.error(`   │  └─ joined via ${input.join ?? 'intersect'}`);
    console.error(`   │     └─ files: 0`);
    console.error(
      `   └─ hint: inspect ${logDirRelative}/input.scope.debug.json to see what was matched`,
    );
    console.error('');
    throw new BadRequestError('combined scope resolves to zero files');
  }

  // enumerate ref files (if specified)
  const refGlobs = input.refs
    ? Array.isArray(input.refs)
      ? input.refs
      : [input.refs]
    : [];
  const refFiles =
    refGlobs.length > 0 ? await enumFilesFromGlob({ glob: refGlobs, cwd }) : [];

  // validate refs exist (fail-fast on zero matches when refs was specified)
  if (refGlobs.length > 0 && refFiles.length === 0) {
    const explicitPaths = refGlobs.filter((g) => !g.includes('*'));
    console.error('');
    console.error('🦉 woah there');
    console.error('');
    if (explicitPaths.length > 0) {
      console.error(`✋ ref not found: ${explicitPaths[0]}`);
    } else {
      console.error(`✋ no refs matched glob: ${refGlobs.join(', ')}`);
    }
    console.error(
      `   └─ hint: verify the path exists and contains matched files`,
    );
    console.error('');
    throw new BadRequestError('validation failed');
  }

  // write final scope file (includes refFiles which were just resolved)
  await fs.writeFile(
    path.join(logDir, 'input.scope.json'),
    JSON.stringify({ ruleFiles, refFiles, targetFiles }, null, 2),
    'utf-8',
  );

  // read file contents for prompt compilation
  const readFileContent = async (file: string) => {
    try {
      return await fs.readFile(path.join(cwd, file), 'utf-8');
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new BadRequestError(`failed to read file: ${file}`, {
        file,
        fullPath: path.join(cwd, file),
        error: error.message,
      });
    }
  };
  const ruleContents = await Promise.all(
    ruleFiles.map(async (file) => ({
      path: file,
      content: await readFileContent(file),
    })),
  );
  const targetContents = await Promise.all(
    targetFiles.map(async (file) => ({
      path: file,
      content: await readFileContent(file),
    })),
  );
  const refContents = await Promise.all(
    refFiles.map(async (file) => ({
      path: file,
      content: await readFileContent(file),
    })),
  );

  // generate and write token breakdown reports
  const allContents = [...ruleContents, ...targetContents];
  const allBreakdown = genTokenBreakdownReport({ files: allContents });
  const rulesBreakdown = genTokenBreakdownReport({ files: ruleContents });
  const targetsBreakdown = genTokenBreakdownReport({ files: targetContents });
  await fs.writeFile(
    path.join(logDir, 'tokens.expected.json'),
    JSON.stringify(
      {
        all: allBreakdown,
        rules: rulesBreakdown,
        targets: targetsBreakdown,
      },
      null,
      2,
    ),
    'utf-8',
  );
  await fs.writeFile(
    path.join(logDir, 'tokens.expected.md'),
    genTokenBreakdownMarkdown({
      all: allBreakdown,
      rules: rulesBreakdown,
      targets: targetsBreakdown,
    }),
    'utf-8',
  );

  // compile review prompt with brain's context window and cost spec
  const brainSpec = context.brain.brain.choice.spec;
  const promptResult = (() => {
    try {
      return compileReviewPrompt({
        rules: ruleContents,
        refs: refContents,
        targets: targetContents,
        focus: input.focus,
        goal: input.goal,
        contextWindowSize: brainSpec.gain.size.context.tokens,
        costSpec: brainSpec.cost.cash,
      });
    } catch (error) {
      if (!(error instanceof BadRequestError)) throw error;
      if (!error.message.includes('context window')) throw error;

      // extract percentage and token count from error message
      // format: "prompt exceeds 75% of context window (244.3% of 256000 tokens). reduce scope..."
      const percentMatch = error.message.match(
        /\((\d+\.?\d*)% of (\d+) tokens\)/,
      );
      const percent = percentMatch?.[1] ?? '?';
      const tokens = percentMatch?.[2] ?? '?';

      // format input for display
      const rulesDisplay = Array.isArray(input.rules)
        ? input.rules.join(', ')
        : input.rules;
      const diffsDisplay = input.diffs ?? '(none)';
      const pathsDisplay = input.paths
        ? Array.isArray(input.paths)
          ? input.paths.join(', ')
          : input.paths
        : '(none)';

      // format token counts
      const formatTokens = (n: number) =>
        n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

      // context exceeded: emit formatted stderr and exit
      console.error('');
      console.error('🦉 woah there');
      console.error('');
      console.error('✋ prompt exceeds 75% of context window');
      console.error(`   ├─ ${percent}% of ${tokens} tokens`);
      console.error(`   └─ reduce scope or use --focus pull`);
      console.error('');
      console.error('🔍 lets see why...');
      console.error(`   ├─ rules: ${rulesDisplay}`);
      console.error(`   │  ├─ files: ${ruleFiles.length}`);
      console.error(`   │  └─ tokens: ${formatTokens(rulesBreakdown.total)}`);
      console.error(`   ├─ targets`);
      console.error(`   │  ├─ diffs: ${diffsDisplay}`);
      console.error(
        `   │  │  └─ files: ${input.diffs ? targetFilesFromDiffs.length : 'null'}`,
      );
      console.error(`   │  ├─ paths: ${pathsDisplay}`);
      console.error(
        `   │  │  └─ files: ${input.paths ? targetFilesFromPaths.length : 'null'}`,
      );
      console.error(`   │  └─ joined via ${joinMode}`);
      console.error(`   │     ├─ files: ${targetFiles.length}`);
      console.error(
        `   │     └─ tokens: ${formatTokens(targetsBreakdown.total)}`,
      );
      console.error(`   └─ hint`);
      console.error(
        `      ├─ inspect ${logDirRelative}/input.scope.debug.json to see what was matched`,
      );
      console.error(
        `      └─ inspect ${logDirRelative}/tokens.expected.md for token breakdown by file`,
      );
      console.error('');
      throw new BadRequestError('validation failed');
    }
  })();

  // write metrics.expected immediately after files are read
  await fs.writeFile(
    path.join(logDir, 'metrics.expected.json'),
    JSON.stringify(
      {
        files: {
          rulesCount: ruleFiles.length,
          refsCount: refFiles.length,
          targetsCount: targetFiles.length,
        },
        tokens: {
          estimate: promptResult.tokenEstimate,
          contextWindowPercent: promptResult.contextWindowPercent,
        },
        cost: {
          estimate: promptResult.costEstimate,
        },
      },
      null,
      2,
    ),
    'utf-8',
  );

  // write input artifacts
  await writeInputArtifacts({
    logDir,
    args: {
      rules: input.rules,
      diffs: input.diffs,
      paths: input.paths,
      join: joinMode,
      refs: input.refs,
      output: input.output,
      focus: input.focus,
      goal: input.goal,
    },
    scope: {
      ruleFiles,
      refFiles,
      targetFiles,
    },
    metrics: {
      tokenEstimate: promptResult.tokenEstimate,
      contextWindowPercent: promptResult.contextWindowPercent,
      costEstimate: promptResult.costEstimate,
    },
    prompt: promptResult.prompt,
  });

  // emit header with brain info and scope filters
  console.log(
    genReviewHeaderStdout({
      brain: context.brain.brain.choice.slug,
      focus: input.focus,
      scope: {
        diffs: input.diffs ?? null,
        pathsWith: positivePathGlobs.length > 0 ? positivePathGlobs : null,
        pathsWout: negativePathGlobs.length > 0 ? negativePathGlobs : null,
        join: joinMode,
      },
    }),
  );

  // compute top 3 dirs by token consumption for preview
  const getTopDirsByTokens = (
    breakdown: {
      entries: Array<{
        path: string;
        type: string;
        tokens: number;
        tokensHuman: string;
        tokensScale: string;
      }>;
    },
    limit: number,
  ): Array<{ path: string; tokensHuman: string; tokensScale: string }> => {
    // filter to top-level directories only (no slashes in path)
    const topLevelDirs = breakdown.entries.filter(
      (e) => e.type === 'DIRECTORY' && !e.path.includes('/'),
    );
    return topLevelDirs
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, limit)
      .map((e) => ({
        path: e.path,
        tokensHuman: e.tokensHuman,
        tokensScale: e.tokensScale,
      }));
  };

  // emit metrics.expected before invocation
  console.log('');
  console.log(
    genReviewInputStdout({
      files: {
        rulesCount: ruleFiles.length,
        refsCount: refFiles.length,
        targetsCount: targetFiles.length,
      },
      tokens: {
        estimate: promptResult.tokenEstimate,
        contextWindowPercent: promptResult.contextWindowPercent,
      },
      cost: {
        estimate: promptResult.costEstimate,
      },
      logDirRelative,
      preview: {
        ruleDirs: getTopDirsByTokens(rulesBreakdown, 3),
        targetDirs: getTopDirsByTokens(targetsBreakdown, 3),
      },
    }),
  );

  // invoke brain with spinner
  console.log('');
  const reviewIssues = await withSpinner({
    message: '🔍 what do we have here then?',
    operation: async () =>
      await context.brain.brain.choice.ask({
        role: { briefs: [] },
        prompt: promptResult.prompt,
        schema: { output: schemaOfReviewOutput },
      }),
  });

  // extract metrics from brain response
  const { metrics } = reviewIssues;
  const realizedTokens = {
    input: metrics.size.tokens.input,
    inputCacheCreation: metrics.size.tokens.cache.set,
    inputCacheRead: metrics.size.tokens.cache.get,
    output: metrics.size.tokens.output,
  };
  const realizedCosts = {
    input: metrics.cost.cash.deets.input,
    cacheWrite: metrics.cost.cash.deets.cache.set,
    cacheRead: metrics.cost.cash.deets.cache.get,
    output: metrics.cost.cash.deets.output,
    total: metrics.cost.cash.total,
  };

  // write metrics.realized after invocation
  await fs.writeFile(
    path.join(logDir, 'metrics.realized.json'),
    JSON.stringify(
      {
        tokens: realizedTokens,
        cost: {
          input: asIsoPriceHuman(realizedCosts.input),
          cacheWrite: asIsoPriceHuman(realizedCosts.cacheWrite),
          cacheRead: asIsoPriceHuman(realizedCosts.cacheRead),
          output: asIsoPriceHuman(realizedCosts.output),
          total: asIsoPriceHuman(realizedCosts.total),
        },
        time: metrics.cost.time,
      },
      null,
      2,
    ),
    'utf-8',
  );

  // format review output
  const formattedReview = formatReviewOutput({
    response: reviewIssues.output,
  });

  // write output artifacts
  await writeOutputArtifacts({
    logDir,
    response: reviewIssues.output,
    review: formattedReview,
  });

  // write final review to output path
  const outputAbsolute = path.isAbsolute(input.output)
    ? input.output
    : path.join(cwd, input.output);
  const reviewRelativePath = path.relative(cwd, outputAbsolute);
  const blockersCount = reviewIssues.output.blockers.length;
  const nitpicksCount = reviewIssues.output.nitpicks.length;

  // generate output header with summary info
  const outputHeader = (() => {
    const summaryIcon =
      blockersCount > 0 ? '🦉 needs your talons' : '✨ all clear';
    const lines = [
      summaryIcon,
      `   ├─ logs: ${logDirRelative}`,
      `   ├─ review: ${reviewRelativePath}`,
      `   └─ summary`,
      `      ├─ ${blockersCount} blockers${blockersCount > 0 ? ' 🔴' : ''}`,
      `      └─ ${nitpicksCount} nitpicks${nitpicksCount > 0 ? ' 🟠' : ''}`,
      '',
      '---',
      '',
    ];
    return lines.join('\n');
  })();

  await fs.writeFile(outputAbsolute, outputHeader + formattedReview, 'utf-8');

  // emit metrics.realized after invocation
  const totalTokens =
    realizedTokens.input +
    realizedTokens.inputCacheCreation +
    realizedTokens.inputCacheRead +
    realizedTokens.output;
  console.log(
    genReviewOutputStdout({
      tokens: {
        input: realizedTokens.input,
        cacheSet: realizedTokens.inputCacheCreation,
        cacheGet: realizedTokens.inputCacheRead,
        output: realizedTokens.output,
        total: totalTokens,
      },
      cost: {
        total: asIsoPriceHuman(realizedCosts.total),
      },
      time: {
        total: asDurationInWords(metrics.cost.time),
      },
      paths: {
        logsRelative: logDirRelative,
        reviewRelative: reviewRelativePath.startsWith('..')
          ? outputAbsolute
          : reviewRelativePath,
      },
      summary: {
        blockersCount,
        nitpicksCount,
      },
    }),
  );

  return {
    review: {
      formatted: formattedReview,
    },
    log: {
      dir: logDir,
    },
    output: {
      path: outputAbsolute,
    },
    metrics: {
      files: {
        rulesCount: ruleFiles.length,
        refsCount: refFiles.length,
        targetsCount: targetFiles.length,
      },
      expected: {
        tokens: {
          estimate: promptResult.tokenEstimate,
          contextWindowPercent: promptResult.contextWindowPercent,
        },
        cost: {
          estimate: promptResult.costEstimate,
        },
      },
      realized: {
        tokens: {
          input: realizedTokens.input,
          inputCacheCreation: realizedTokens.inputCacheCreation,
          inputCacheRead: realizedTokens.inputCacheRead,
          output: realizedTokens.output,
        },
        cost: {
          input: asIsoPriceHuman(realizedCosts.input),
          cacheWrite: asIsoPriceHuman(realizedCosts.cacheWrite),
          cacheRead: asIsoPriceHuman(realizedCosts.cacheRead),
          output: asIsoPriceHuman(realizedCosts.output),
          total: asIsoPriceHuman(realizedCosts.total),
        },
        time: metrics.cost.time,
      },
    },
  };
};
