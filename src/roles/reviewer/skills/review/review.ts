import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { compileReviewPrompt } from '@src/domain.operations/review/compileReviewPrompt';
import { enumFilesFromDiffs } from '@src/domain.operations/review/enumFilesFromDiffs';
import { enumFilesFromGlob } from '@src/domain.operations/review/enumFilesFromGlob';
import { formatReviewOutput } from '@src/domain.operations/review/formatReviewOutput';
import { genTokenBreakdownMarkdown } from '@src/domain.operations/review/genTokenBreakdownMarkdown';
import { genTokenBreakdownReport } from '@src/domain.operations/review/genTokenBreakdownReport';
import { invokeClaudeCode } from '@src/domain.operations/review/invokeClaudeCode';
import { writeInputArtifacts } from '@src/domain.operations/review/writeInputArtifacts';
import { writeOutputArtifacts } from '@src/domain.operations/review/writeOutputArtifacts';

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
        input: number;
        cacheWrite: number;
        cacheRead: number;
        output: number;
        total: number;
      };
    };
  };
};

/**
 * .what = generates ISO timestamp for log directory naming
 * .why = enables unique, sortable log directories
 */
const genLogTimestamp = (): string => {
  return new Date().toISOString().replace(/[:.]/g, '-');
};

/**
 * .what = simple spinner for CLI feedback
 * .why = shows progress during long-running operations
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
  output: string;
  mode: 'soft' | 'hard';
  cwd?: string;
}): Promise<StepReviewResult> => {
  const cwd = input.cwd ?? process.cwd();

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

  // create log directory early for debugging
  const logDir = path.join(cwd, '.log', 'bhrain', 'review', genLogTimestamp());
  await fs.mkdir(logDir, { recursive: true });

  // write scope immediately for debugging
  await fs.writeFile(
    path.join(logDir, 'input.scope.json'),
    JSON.stringify({ ruleFiles, targetFiles }, null, 2),
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

  // compile review prompt
  const promptResult = compileReviewPrompt({
    rules: ruleContents,
    targets: targetContents,
    mode: input.mode,
  });

  // write metrics.expected immediately after files are read
  await fs.writeFile(
    path.join(logDir, 'metrics.expected.json'),
    JSON.stringify(
      {
        files: {
          rulesCount: ruleFiles.length,
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
      output: input.output,
      mode: input.mode,
    },
    scope: {
      ruleFiles,
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
    `
🔭 metrics.expected
   ├─ files
   │  ├─ rules: ${ruleFiles.length}
   │  └─ targets: ${targetFiles.length}
   ├─ tokens
   │  ├─ estimate: ${promptResult.tokenEstimate}
   │  └─ context: ${promptResult.contextWindowPercent.toFixed(1)}%
   └─ cost
      └─ estimate: $${promptResult.costEstimate.toFixed(4)}

🪵 logs
   ├─ scope: ${logDirRelative}/input.scope.json
   ├─ metrics: ${logDirRelative}/metrics.expected.json
   └─ tokens: ${logDirRelative}/tokens.expected.md
`.trim(),
  );

  // invoke claude-code with spinner
  console.log('');
  const brainResult = await withSpinner({
    message: "🐢 let's review!",
    operation: () => invokeClaudeCode({ prompt: promptResult.prompt, cwd }),
  });

  // calculate realized costs per token type
  const realizedCosts = (() => {
    const input = (brainResult.usage.inputTokens / 1_000_000) * 3;
    const cacheWrite =
      (brainResult.usage.inputTokensCacheCreation / 1_000_000) * 3.75;
    const cacheRead =
      (brainResult.usage.inputTokensCacheRead / 1_000_000) * 0.3;
    const output = (brainResult.usage.outputTokens / 1_000_000) * 15;
    const total =
      Math.round((input + cacheWrite + cacheRead + output) * 10000) / 10000;
    return { input, cacheWrite, cacheRead, output, total };
  })();

  // write metrics.realized after invocation
  await fs.writeFile(
    path.join(logDir, 'metrics.realized.json'),
    JSON.stringify(
      {
        tokens: {
          input: brainResult.usage.inputTokens,
          inputCacheCreation: brainResult.usage.inputTokensCacheCreation,
          inputCacheRead: brainResult.usage.inputTokensCacheRead,
          output: brainResult.usage.outputTokens,
        },
        cost: {
          input: realizedCosts.input,
          cacheWrite: realizedCosts.cacheWrite,
          cacheRead: realizedCosts.cacheRead,
          output: realizedCosts.output,
          total: realizedCosts.total,
        },
      },
      null,
      2,
    ),
    'utf-8',
  );

  // parse issues from review text
  const reviewIssues = (() => {
    // extract JSON from the review text (may be wrapped in markdown code blocks)
    const jsonMatch = brainResult.review.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = jsonMatch?.[1]?.trim() ?? brainResult.review.trim();

    try {
      return JSON.parse(jsonText) as {
        issues: Array<{
          type: 'blocker' | 'nitpick';
          message: string;
          file?: string;
          line?: number;
        }>;
      };
    } catch (error) {
      throw new BadRequestError(
        'failed to parse review issues from claude response',
        {
          review: brainResult.review,
          jsonText,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  })();

  // format review output
  const formattedReview = formatReviewOutput({
    response: reviewIssues,
  });

  // write output artifacts
  await writeOutputArtifacts({
    logDir,
    response: brainResult.response,
    review: formattedReview,
  });

  // write final review to output path
  const outputAbsolute = path.isAbsolute(input.output)
    ? input.output
    : path.join(cwd, input.output);
  await fs.writeFile(outputAbsolute, formattedReview, 'utf-8');

  // emit metrics.realized after invocation
  console.log(
    `
✨ metrics.realized
   ├─ tokens
   │  ├─ input: ${brainResult.usage.inputTokens}
   │  ├─ cache.write: ${brainResult.usage.inputTokensCacheCreation}
   │  ├─ cache.read: ${brainResult.usage.inputTokensCacheRead}
   │  └─ output: ${brainResult.usage.outputTokens}
   └─ cost
      ├─ input: $${realizedCosts.input.toFixed(4)}
      ├─ cache.write: $${realizedCosts.cacheWrite.toFixed(4)}
      ├─ cache.read: $${realizedCosts.cacheRead.toFixed(4)}
      ├─ output: $${realizedCosts.output.toFixed(4)}
      └─ total: $${realizedCosts.total.toFixed(4)}

🌊 output
   ├─ logs: ${path.relative(cwd, logDir)}
   └─ review: ${path.relative(cwd, outputAbsolute).startsWith('..') ? outputAbsolute : path.relative(cwd, outputAbsolute)}
`.trim(),
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
          input: brainResult.usage.inputTokens,
          inputCacheCreation: brainResult.usage.inputTokensCacheCreation,
          inputCacheRead: brainResult.usage.inputTokensCacheRead,
          output: brainResult.usage.outputTokens,
        },
        cost: {
          input: realizedCosts.input,
          cacheWrite: realizedCosts.cacheWrite,
          cacheRead: realizedCosts.cacheRead,
          output: realizedCosts.output,
          total: realizedCosts.total,
        },
      },
    },
  };
};

/**
 * .what = CLI entrypoint when run directly
 * .why = enables ./review.sh to invoke this module
 */
if (require.main === module) {
  // parse command line arguments
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    if (key && value) parsed[key] = value;
  }

  // default output path if not provided
  const output =
    parsed.output ??
    path.join(
      process.cwd(),
      '.review',
      'bhrain',
      `v${genLogTimestamp()}`,
      '[feedback].[given].by_robot.md',
    );

  // validate mode is provided
  if (!parsed.mode || (parsed.mode !== 'soft' && parsed.mode !== 'hard')) {
    console.error('⛈️ error: --mode must be "soft" or "hard"');
    process.exit(1);
  }
  const mode = parsed.mode as 'soft' | 'hard';

  // default rules to .agent/**/briefs/**/rule.*.md
  const rules = parsed.rules
    ? parsed.rules.split(',').map((r) => r.trim())
    : ['.agent/**/briefs/**/rule.*.md'];

  // default diffs to uptil-main
  const diffs =
    (parsed.diffs as 'uptil-main' | 'uptil-commit' | 'uptil-staged') ??
    'uptil-main';

  // parse paths if provided
  const paths = parsed.paths
    ? parsed.paths.split(',').map((p) => p.trim())
    : undefined;

  // execute review
  void (async () => {
    try {
      // ensure output directory exists
      await fs.mkdir(path.dirname(output), { recursive: true });

      // run the review
      await stepReview({
        rules,
        diffs,
        paths,
        output,
        mode,
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        console.error(`\n⛈️ error: ${error.message}`);
        process.exit(1);
      }
      console.error('⛈️ unexpected error:', error);
      process.exit(1);
    }
  })();
}
