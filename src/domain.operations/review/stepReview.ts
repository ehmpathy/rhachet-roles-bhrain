import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import { asIsoPriceHuman, type IsoPriceHuman } from 'iso-price';
import type { IsoDuration } from 'iso-time';
import * as path from 'path';
import { BrainRepl } from 'rhachet';
import { z } from 'zod';

import {
  DEFAULT_BRAIN,
  genContextBrainChoice,
} from '@src/_topublish/rhachet/genContextBrainChoice';
import { compileReviewPrompt } from '@src/domain.operations/review/compileReviewPrompt';
import { enumFilesFromDiffs } from '@src/domain.operations/review/enumFilesFromDiffs';
import { enumFilesFromGlob } from '@src/domain.operations/review/enumFilesFromGlob';
import { formatReviewOutput } from '@src/domain.operations/review/formatReviewOutput';
import { genReviewInputStdout } from '@src/domain.operations/review/genReviewInputStdout';
import { genReviewOutputStdout } from '@src/domain.operations/review/genReviewOutputStdout';
import { genTokenBreakdownMarkdown } from '@src/domain.operations/review/genTokenBreakdownMarkdown';
import { genTokenBreakdownReport } from '@src/domain.operations/review/genTokenBreakdownReport';
import { writeInputArtifacts } from '@src/domain.operations/review/writeInputArtifacts';
import { writeOutputArtifacts } from '@src/domain.operations/review/writeOutputArtifacts';

/**
 * .what = schema for review issue
 * .why = enables structured output from brain.choice.ask
 */
const schemaOfReviewIssue = z.object({
  rule: z.string(),
  title: z.string(),
  description: z.string(),
  locations: z.array(z.string()),
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
        estimate: number;
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
export const stepReview = async (input: {
  rules: string | string[];
  diffs?: string;
  paths?: string | string[];
  refs?: string | string[];
  output: string;
  mode: 'pull' | 'push';
  goal: 'exhaustive' | 'representative';
  brain?: string;
  cwd?: string;
}): Promise<StepReviewResult> => {
  const cwd = input.cwd ?? process.cwd();

  // resolve brain choice from brain registry
  const brainSlug = input.brain ?? DEFAULT_BRAIN;
  const contextBrain = await genContextBrainChoice({ brain: brainSlug });

  // validate that pull mode is only used with brains that have tool use
  const choiceIsRepl = contextBrain.brain.choice instanceof BrainRepl;
  if (input.mode === 'pull' && !choiceIsRepl)
    throw new BadRequestError(
      `mode 'pull' requires a brain with tool use (BrainRepl). ` +
        `brain '${brainSlug}' is a BrainAtom without tool use. ` +
        `use mode 'push' instead, or choose a BrainRepl.`,
      { brain: brainSlug, mode: input.mode },
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

  // validate output parent directory exists
  const outputParent = path.dirname(input.output);
  const outputParentAbsolute = path.isAbsolute(outputParent)
    ? outputParent
    : path.join(cwd, outputParent);
  try {
    await fs.access(outputParentAbsolute);
  } catch {
    throw new BadRequestError('output path parent directory does not exist', {
      outputParent: outputParentAbsolute,
    });
  }

  // enumerate rule files
  const ruleGlobs = Array.isArray(input.rules)
    ? input.rules
    : [input.rules].filter(Boolean);
  const ruleFiles = await enumFilesFromGlob({ glob: ruleGlobs, cwd });
  if (ruleGlobs.length > 0 && ruleFiles.length === 0)
    throw new BadRequestError(
      '--rules glob was ineffective; matched zero files',
      {
        rules: input.rules,
      },
    );

  // enumerate target files from diffs
  const targetFilesFromDiffs = input.diffs
    ? await enumFilesFromDiffs({
        range: input.diffs as 'uptil-main' | 'uptil-commit' | 'uptil-staged',
        cwd,
      })
    : [];

  // enumerate target files from paths
  const pathGlobs = input.paths
    ? Array.isArray(input.paths)
      ? input.paths
      : [input.paths]
    : [];
  const positivePathGlobs = pathGlobs.filter((p) => !p.startsWith('!'));
  const negativePathGlobs = pathGlobs
    .filter((p) => p.startsWith('!'))
    .map((p) => p.slice(1));
  const targetFilesFromPaths = await enumFilesFromGlob({
    glob: positivePathGlobs,
    cwd,
  });

  // union target files from diffs and paths, then apply global exclusions
  const targetFilesUnion = [
    ...new Set([...targetFilesFromDiffs, ...targetFilesFromPaths]),
  ];
  const targetFiles = targetFilesUnion
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

  // validate combined scope is non-empty
  if (targetFiles.length === 0)
    throw new BadRequestError('combined scope resolves to zero files', {
      diffs: input.diffs,
      paths: input.paths,
      diffsMatched: targetFilesFromDiffs.length,
      pathsMatched: targetFilesFromPaths.length,
    });

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
    if (explicitPaths.length > 0) {
      throw new BadRequestError(`ref not found: ${explicitPaths[0]}`, {
        refs: input.refs,
      });
    }
    throw new BadRequestError(
      `no refs matched glob: ${refGlobs.join(', ')}\n\nhint: verify the path exists and contains matched files`,
      { globs: refGlobs },
    );
  }

  // create log directory early for debug
  const logDir = path.join(cwd, '.log', 'bhrain', 'review', genLogTimestamp());
  await fs.mkdir(logDir, { recursive: true });

  // write scope immediately for debug
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

  // compile review prompt with brain's context window
  const contextWindowSize =
    contextBrain.brain.choice.spec.gain.size.context.tokens;
  const promptResult = compileReviewPrompt({
    rules: ruleContents,
    refs: refContents,
    targets: targetContents,
    mode: input.mode,
    goal: input.goal,
    contextWindowSize,
  });

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
      refs: input.refs,
      output: input.output,
      mode: input.mode,
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

  // emit metrics.expected before invocation
  const logDirRelative = path.relative(cwd, logDir);
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
    }),
  );

  // invoke brain with spinner
  console.log('');
  const reviewIssues = await withSpinner({
    message: "🦉 let's review!",
    operation: () =>
      contextBrain.brain.choice.ask({
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
  await fs.writeFile(outputAbsolute, formattedReview, 'utf-8');

  // emit metrics.realized after invocation
  const totalTokens =
    realizedTokens.input +
    realizedTokens.inputCacheCreation +
    realizedTokens.inputCacheRead +
    realizedTokens.output;
  const reviewRelative = path.relative(cwd, outputAbsolute);
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
        total: String(metrics.cost.time),
      },
      paths: {
        logsRelative: logDirRelative,
        reviewRelative: reviewRelative.startsWith('..')
          ? outputAbsolute
          : reviewRelative,
      },
      summary: {
        blockersCount: reviewIssues.output.blockers.length,
        nitpicksCount: reviewIssues.output.nitpicks.length,
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
