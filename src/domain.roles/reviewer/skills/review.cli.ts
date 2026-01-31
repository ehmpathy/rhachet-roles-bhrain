import {
  type BrainAtom,
  type BrainRepl,
  genContextBrain,
  getAvailableBrainsInWords,
} from 'rhachet';
import {
  getBrainAtomsByAnthropic,
  getBrainReplsByAnthropic,
} from 'rhachet-brains-anthropic';
import {
  getBrainAtomsByOpenAI,
  getBrainReplsByOpenAI,
} from 'rhachet-brains-openai';
import { getBrainAtomsByXAI } from 'rhachet-brains-xai';

import { stepReview } from '@src/domain.operations/review/stepReview';

/**
 * .what = default brain for review skill
 * .why = xai/grok/code-fast-1 is fast, cheap, and effective for code review
 */
const DEFAULT_BRAIN = 'xai/grok/code-fast-1';

/**
 * .what = loads all available brain atoms from installed packages
 * .why = enables enumeration of available brains for lookup
 */
const loadAllAtoms = (): BrainAtom[] => {
  return [
    ...getBrainAtomsByXAI(),
    ...getBrainAtomsByAnthropic(),
    ...getBrainAtomsByOpenAI(),
  ];
};

/**
 * .what = loads all available brain repls from installed packages
 * .why = enables enumeration of available brains for lookup
 */
const loadAllRepls = (): BrainRepl[] => {
  return [...getBrainReplsByAnthropic(), ...getBrainReplsByOpenAI()];
};

/**
 * .what = prints help message with available brains
 * .why = enables users to discover available brain options
 */
const printHelp = (input: { atoms: BrainAtom[]; repls: BrainRepl[] }): void => {
  const brainsInWords = getAvailableBrainsInWords({
    atoms: input.atoms,
    repls: input.repls,
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
  --diffs <range>     diff range: uptil-main, uptil-commit, uptil-staged
  --refs <globs>      glob pattern(s) for reference files (can repeat)
  --output <path>     output file path for the review (required)
  --mode <mode>       review mode: push or pull (default: push)
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
 * .what = parses cli args into options object
 * .why = simple arg parse without external dependencies
 */
const parseArgs = (
  argv: string[],
): {
  rules: string;
  diffs: string | undefined;
  paths: string | undefined;
  refs: string[] | undefined;
  output: string;
  mode: 'push' | 'pull';
  goal: 'exhaustive' | 'representative';
  brain: string;
} => {
  // skip node executable and entrypoint path
  const args = argv.slice(2);
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
    refs: options.refs as string[] | undefined,
    output: options.output as string,
    mode: (options.mode as 'push' | 'pull') ?? 'push',
    goal: (options.goal as 'exhaustive' | 'representative') ?? 'representative',
    brain: (options.brain as string) ?? DEFAULT_BRAIN,
  };
};

/**
 * .what = cli entrypoint for review skill
 * .why = enables shell invocation via review.sh
 *
 * .note = this is a SKILL entrypoint, not a public api
 *         brain packages are imported here because skill users have them installed
 */
export const review = async (): Promise<void> => {
  // load brains early for help display
  const atoms = loadAllAtoms();
  const repls = loadAllRepls();

  // handle --help flag
  if (hasHelpFlag(process.argv)) {
    printHelp({ atoms, repls });
    return;
  }

  // parse args and create brain context
  const options = parseArgs(process.argv);
  const brain = genContextBrain({
    atoms,
    repls,
    choice: options.brain,
  });

  // invoke stepReview
  await stepReview(
    {
      rules: options.rules,
      diffs: options.diffs,
      paths: options.paths,
      refs: options.refs,
      output: options.output,
      mode: options.mode,
      goal: options.goal,
    },
    { brain },
  );
};
