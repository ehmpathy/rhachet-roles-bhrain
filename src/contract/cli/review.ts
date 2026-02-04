import {
  genContextBrain,
  getAvailableBrains,
  getAvailableBrainsInWords,
} from 'rhachet/brains';

import { genDefaultReviewOutputPath } from '@src/domain.operations/review/genDefaultReviewOutputPath';
import { stepReview } from '@src/domain.operations/review/stepReview';

/**
 * .what = default brain for review skill
 * .why = xai/grok/code-fast-1 is fast, cheap, and effective for code review
 */
const DEFAULT_BRAIN = 'xai/grok/code-fast-1';

/**
 * .what = prints help message with available brains
 * .why = enables users to discover available brain options
 */
const printHelp = async (): Promise<void> => {
  const { atoms, repls } = await getAvailableBrains();
  const brainsInWords = getAvailableBrainsInWords({
    atoms,
    repls,
    choice: '',
  });

  console.log(
    `
review - code review against rules

usage:
  review.sh [options]

options:
  --rules <globs>     glob pattern(s) for rule files (required)
  --paths <globs>     glob pattern(s) for target files
  --diffs <range>     diff range: uptil-main, uptil-commit, uptil-staged (default: uptil-main)
  --join <mode>       how to join --paths and --diffs: union or intersect (default: union)
  --refs <globs>      glob pattern(s) for reference files (can repeat)
  --output <path>     output file path (default: .review/$branch/$isotime.output.md)
  --focus <mode>      review focus: push or pull (default: push)
  --goal <goal>       review goal: exhaustive or representative (default: representative)
  --brain <slug>      brain to use for review (default: ${DEFAULT_BRAIN})
  --help              show this help message

${brainsInWords}
`.trim(),
  );
};

/**
 * .what = checks if help flag is present in args
 * .why = enables early exit for help display
 */
const hasHelpFlag = (argv: string[]): boolean => {
  return argv.includes('--help') || argv.includes('-h');
};

/**
 * .what = detects if node was invoked via `node -e "code"` (eval mode)
 * .why = in eval mode, argv has no entrypoint path: [node, firstArg, ...]
 *        in normal mode, argv has entrypoint path: [node, file.js, firstArg, ...]
 *        we need to skip different counts when slicing argv
 */
const isNodeEvalMode = (argv: string[]): boolean => {
  // in eval mode, argv[1] is the first user arg (e.g., --rules), not an entrypoint path
  // entrypoint paths end with .js, .ts, .mjs, etc. and don't start with --
  const secondArg = argv[1];
  if (!secondArg) return false;
  const looksLikeEntrypointPath =
    /\.(js|ts|mjs|cjs)$/.test(secondArg) || !secondArg.startsWith('--');
  return !looksLikeEntrypointPath;
};

/**
 * .what = parses cli args into options object
 * .why = simple arg parser without external dependencies
 */
const parseArgs = (
  argv: string[],
): {
  rules: string;
  diffs: string | undefined;
  paths: string | undefined;
  join: 'union' | 'intersect';
  refs: string[] | undefined;
  output: string | undefined;
  focus: 'push' | 'pull';
  goal: 'exhaustive' | 'representative';
  brain: string;
} => {
  // skip node binary (always argv[0]) and entrypoint path (only in normal mode)
  const skipCount = isNodeEvalMode(argv) ? 1 : 2;
  const args = argv.slice(skipCount).filter((arg) => arg !== '--');
  const options: Record<string, string | string[]> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];

      // handle --refs which can be specified multiple times
      if (key === 'refs') {
        if (!options.refs) options.refs = [];
        if (value && !value.startsWith('--')) {
          (options.refs as string[]).push(value);
          i++;
        }
      } else if (value && !value.startsWith('--')) {
        options[key] = value;
        i++;
      }
    }
  }

  return {
    rules: options.rules as string,
    diffs: options.diffs as string | undefined,
    paths: options.paths as string | undefined,
    join: (options.join as 'union' | 'intersect') ?? 'union',
    refs: options.refs as string[] | undefined,
    output: options.output as string | undefined,
    focus: (options.focus as 'push' | 'pull') ?? 'push',
    goal: (options.goal as 'exhaustive' | 'representative') ?? 'representative',
    brain: (options.brain as string) ?? DEFAULT_BRAIN,
  };
};

/**
 * .what = cli entrypoint for review skill
 * .why = enables shell invocation via package-level import
 */
export const review = async (): Promise<void> => {
  // parse args first for fast validation
  const options = parseArgs(process.argv);

  // handle --help flag
  if (hasHelpFlag(process.argv)) {
    await printHelp();
    return;
  }

  // validate required args before expensive brain discovery
  const hasRules =
    options.rules &&
    (Array.isArray(options.rules) ? options.rules.length > 0 : true);
  const hasDiffs = !!options.diffs;
  const hasPaths =
    options.paths &&
    (Array.isArray(options.paths) ? options.paths.length > 0 : true);
  if (!hasRules && !hasDiffs && !hasPaths) {
    console.error(
      'error: must specify at least one of --rules, --diffs, or --paths',
    );
    console.error('run with --help for usage');
    process.exit(1);
  }

  // resolve output path (generate default if not specified)
  const cwd = process.cwd();
  const outputResolved = options.output ?? genDefaultReviewOutputPath({ cwd });

  // create brain context via discovery (expensive)
  const brain = await genContextBrain({ choice: options.brain });

  // invoke stepReview
  await stepReview(
    {
      rules: options.rules,
      diffs: options.diffs ?? (!hasPaths ? 'uptil-main' : undefined),
      paths: options.paths,
      join: options.join,
      refs: options.refs,
      output: outputResolved,
      focus: options.focus,
      goal: options.goal,
    },
    { brain },
  );
};
