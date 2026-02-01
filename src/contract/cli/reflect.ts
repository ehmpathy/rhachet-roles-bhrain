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

import { stepReflect } from '@src/domain.operations/reflect/stepReflect';

/**
 * .what = default brain for reflect skill
 * .why = anthropic/claude/sonnet-4 is effective for rule extraction and synthesis
 */
const DEFAULT_BRAIN = 'anthropic/claude/sonnet-4';

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
reflect - extract rules from feedback and propose to target

usage:
  reflect.sh [options]

options:
  --source <path>     source directory with feedback files (required)
  --target <path>     target directory for rules (required)
  --mode <mode>       reflect mode: push or pull (default: pull)
  --force             create target directory if it does not exist
  --brain <slug>      brain to use for reflection (default: ${DEFAULT_BRAIN})
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
 *        we skip different counts to slice argv correctly
 */
const isNodeEvalMode = (argv: string[]): boolean => {
  // in eval mode, argv[1] is the first user arg (e.g., --source), not an entrypoint path
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
  source: string;
  target: string;
  mode: 'push' | 'pull';
  force: boolean;
  brain: string;
} => {
  // skip node binary (always argv[0]) and entrypoint path (only in normal mode)
  const skipCount = isNodeEvalMode(argv) ? 1 : 2;
  const args = argv.slice(skipCount).filter((arg) => arg !== '--');
  const options: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg.startsWith('--')) {
      const key = arg.slice(2);

      // handle boolean flags
      if (key === 'force') {
        options[key] = true;
        continue;
      }

      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++;
      }
    }
  }

  return {
    source: options.source as string,
    target: options.target as string,
    mode: (options.mode as 'push' | 'pull') ?? 'pull',
    force: (options.force as boolean) ?? false,
    brain: (options.brain as string) ?? DEFAULT_BRAIN,
  };
};

/**
 * .what = cli entrypoint for reflect skill
 * .why = enables shell invocation via package-level import
 *
 * .note = this is a SKILL entrypoint, not a public api
 *         brain packages are imported here because skill users have them installed
 */
export const reflect = async (): Promise<void> => {
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

  // invoke stepReflect
  await stepReflect(
    {
      source: options.source,
      target: options.target,
      mode: options.mode,
      force: options.force,
    },
    { brain },
  );
};
