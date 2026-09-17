import { execSync } from 'child_process';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';
import {
  genContextBrain,
  getAvailableBrains,
  getAvailableBrainsInWords,
} from 'rhachet/brains';

import { emitReviewSkip } from '@src/domain.operations/review/emitReviewSkip';
import { genDefaultReviewOutputPath } from '@src/domain.operations/review/genDefaultReviewOutputPath';
import { getReviewOptionalSkipDecision } from '@src/domain.operations/review/getReviewOptionalSkipDecision';
import {
  getSuppliesUnsupported,
  SUPPLIES_OPTIONAL_SUPPORTED,
} from '@src/domain.operations/review/getSuppliesOptionalSupported';
import { stepReview } from '@src/domain.operations/review/stepReview';

/**
 * .what = default brain for review skill
 * .why = fireworks/deepseek/v4-flash is better, cheaper, and faster for code review
 */
const DEFAULT_BRAIN = 'fireworks/deepseek/v4-flash';

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
  --paths <globs>     glob pattern(s) for target files (deprecated: use --paths-with)
  --paths-with <glob>   include files that match this glob (can repeat)
  --paths-wout <glob>   exclude files that match this glob (can repeat)
                        alias: --paths-without
  --diffs <range>     diff range: since-main, since-commit, since-staged (default: since-main)
  --join <mode>       how to join --paths-with and --diffs: intersect or union (default: intersect)
  --refs <globs>      glob pattern(s) for reference files (can repeat)
  --optional <supply> mark a supply as optional; when its glob matches zero files, skip the
                      review (emit 0 blockers / 0 nitpicks, exit 0) instead of a fail-loud error.
                      supported: rules (can repeat)
  --conversation <files>  comma-separated prior peer-review dialogue files (.given + .taken) to thread as context (opt-in; guard expands $conversation)
  --output <path>     output file path (default: .review/$branch/$isotime.output.md)
  --focus <mode>      review focus: push or pull (default: push)
  --goal <goal>       review goal: exhaustive or representative (default: exhaustive)
  --brain <slug>      brain to use for review (default: ${DEFAULT_BRAIN})
  --open <opener>     open output file with specified program (e.g., nvim, codium, code)
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
 * .what = the flags that may be given more than once, each occurrence accumulated
 * .why = a caller who passes several globs must not silently lose all but the last.
 *        a last-wins path glob is the worst failure shape there is: the bind reads
 *        as applied, the review runs unbounded, and no error is raised.
 *
 * .note = --paths-with and --paths-wout are a symmetric pair, so both repeat. one
 *         that repeats beside one that does not is a footgun a caller meets once.
 */
const FLAGS_REPEATABLE = new Set([
  'refs',
  'optional',
  'paths-with',
  'paths-wout',
]);

/**
 * .what = maps a flag alias onto its canonical name
 * .why = --paths-wout is canonical (it pairs by shape with --paths-with), and
 *        --paths-without is the plain english a caller reaches for first. both
 *        resolve to one key, so no downstream reader knows which was typed.
 */
const FLAGS_ALIASED: Record<string, string> = {
  'paths-without': 'paths-wout',
};

/**
 * .what = resolves a flag name to its canonical form
 * .why = keeps the parse loop narrative: one lookup, no inline alias branch
 */
const asCanonicalReviewFlag = (input: { flag: string }): string =>
  FLAGS_ALIASED[input.flag] ?? input.flag;

/**
 * .what = every `--key` this parser recognizes, in its CANONICAL form
 * .why = an unrecognized flag used to land in `options[key]` and simply never be read
 *        downstream — no error, no warn. a misspelled `--paths-wout` (the incident this
 *        allowlist exists to close) ran the lane unbounded with no signal at all: the
 *        overflow that followed read as a lane genuinely too wide, never as a dropped
 *        bind (r002 blocker.1, i005; `rule.forbid.failhide`).
 *
 * .note = `help` is included so `--help` never reads as unknown — `hasHelpFlag` checks
 *         it separately, but `parseReviewArgs` still walks every arg before that check
 *         runs, and an unknown flag is recorded there.
 *
 * 🔴 `skill`, `repo`, and `mode` are the outer `rhachet run --skill review --repo <x>
 *    --mode hard` DISPATCHER's own flags — every guard-authored `$rhx review …` call
 *    across this repo opens with them. `rhachet run` forwards its full argv verbatim
 *    into `process.argv` rather than removing the flags it already consumed to
 *    resolve which skill to boot, so `review()` sees them too. they are recognized
 *    here and read by naught downstream — the allowlist's job is to catch a TYPO in a
 *    flag `review()` itself acts on, never to re-litigate the dispatcher's own
 *    contract (the i007 malfunction this note documents: every guard-run reviewer on
 *    this route refused with "unrecognized flag(s): --skill, --repo, --mode" the
 *    round this allowlist first shipped without them).
 */
const FLAGS_KNOWN = new Set([
  'rules',
  'paths',
  'paths-with',
  'paths-wout',
  'diffs',
  'join',
  'refs',
  'optional',
  'conversation',
  'output',
  'focus',
  'goal',
  'brain',
  'open',
  'help',
  'skill',
  'repo',
  'mode',
]);

/**
 * .what = parses cli args into options object
 * .why = simple arg parser without external dependencies; exported so the flag
 *        contract (e.g. --conversation comma-split → array) is testable without
 *        an expensive end-to-end brain round-trip
 */
export const parseReviewArgs = (
  argv: string[],
): {
  rules: string;
  diffs: string | undefined;
  paths: string | undefined;
  pathsWith: string[] | undefined;
  pathsWout: string[] | undefined;
  join: 'union' | 'intersect';
  refs: string[] | undefined;
  optional: string[] | undefined;
  conversation: string[] | undefined;
  output: string | undefined;
  focus: 'push' | 'pull';
  goal: 'exhaustive' | 'representative';
  brain: string;
  open: string | undefined;
  unknownFlags: string[];
} => {
  // skip node binary (always argv[0]) and entrypoint path (only in normal mode)
  const skipCount = isNodeEvalMode(argv) ? 1 : 2;
  const args = argv.slice(skipCount).filter((arg) => arg !== '--');
  const options: Record<string, string | string[]> = {};
  const unknownFlags: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg.startsWith('--')) {
      const key = asCanonicalReviewFlag({ flag: arg.slice(2) });
      const value = args[i + 1];

      // an unrecognized flag is recorded, never dropped in silence — the caller reads
      // it back from `unknownFlags` and fails loud, the arg itself is what states it
      if (!FLAGS_KNOWN.has(key)) unknownFlags.push(arg);

      // a repeatable flag accumulates each occurrence. presence is recorded (as [])
      // even when the value is absent or another flag, so review() can fail loud on
      // a bare `--optional` (no supply named)
      if (FLAGS_REPEATABLE.has(key)) {
        if (!options[key]) options[key] = [];
        if (value && !value.startsWith('--')) {
          (options[key] as string[]).push(value);
          i++;
        }
      } else if (value && !value.startsWith('--')) {
        // .note = --conversation is a normal single-value flag: the guard expands
        //         $conversation to ONE comma-joined token, split into files below
        options[key] = value;
        i++;
      }
    }
  }

  return {
    rules: options.rules as string,
    diffs: options.diffs as string | undefined,
    paths: options.paths as string | undefined,
    pathsWith: options['paths-with'] as string[] | undefined,
    pathsWout: options['paths-wout'] as string[] | undefined,
    join: (options.join as 'union' | 'intersect') ?? 'intersect',
    refs: options.refs as string[] | undefined,
    optional: options.optional as string[] | undefined,
    conversation: options.conversation
      ? (options.conversation as string).split(',')
      : undefined,
    output: options.output as string | undefined,
    focus: (options.focus as 'push' | 'pull') ?? 'push',
    // .why = exhaustive is the default, for TWO reasons:
    //
    //        1. ECONOMY. a review's commonest caller is a route GUARD, where each round costs
    //           budget. a sample reports 3 of 9 instances, the driver repairs 3, the lane re-runs,
    //           and the same class returns — three rounds to converge on one class. the same
    //           corpus reported once converges in one.
    //
    //        2. GENERALIZATION. the driver architects the repair from what it sees. 3 of 9 reads
    //           as three local edits; all 9 reveals the CLASS, and a driver who sees the class
    //           fixes the cause rather than the instances. a sample hides the shape of the defect.
    //
    // .note = it does NOT ask for more blockers. exhaustive is coverage, never severity —
    //         rule.forbid.overzealous-blockers still grades each point, and the exhaustive prompt
    //         collects many locations under ONE violation rather than many violations.
    goal: (options.goal as 'exhaustive' | 'representative') ?? 'exhaustive',
    brain: (options.brain as string) ?? DEFAULT_BRAIN,
    open: options.open as string | undefined,
    unknownFlags,
  };
};

/**
 * .what = cli entrypoint for review skill
 * .why = enables shell invocation via package-level import
 */
export const review = async (): Promise<void> => {
  // parse args first for fast validation
  const options = parseReviewArgs(process.argv);

  // handle --help flag
  if (hasHelpFlag(process.argv)) {
    await printHelp();
    return;
  }

  // an unrecognized flag used to land in `options[key]` and never be read again —
  // no error, no warn. the review then ran with the bind never applied, and the
  // overflow that followed read as a lane genuinely too wide, never as a typo
  // (rule.forbid.failhide). fail loud, before any brain cost is paid.
  if (options.unknownFlags.length > 0) {
    console.error(
      `error: unrecognized flag(s): ${options.unknownFlags.join(', ')}`,
    );
    console.error('run with --help for the full flag list');
    process.exit(2);
  }

  // validate required args before expensive brain discovery
  const hasRules =
    options.rules &&
    (Array.isArray(options.rules) ? options.rules.length > 0 : true);
  const hasDiffs = !!options.diffs;
  const hasPaths =
    options.paths &&
    (Array.isArray(options.paths) ? options.paths.length > 0 : true);
  const hasPathsWith =
    options.pathsWith &&
    (Array.isArray(options.pathsWith) ? options.pathsWith.length > 0 : true);
  if (!hasRules && !hasDiffs && !hasPaths && !hasPathsWith) {
    console.error(
      'error: must specify at least one of --rules, --diffs, --paths, or --paths-with',
    );
    console.error('run with --help for usage');
    process.exit(2);
  }

  // a bare --paths-with or --paths-wout (present, no glob) must not silently apply as
  // "no exclusion" — the exact accepted-but-ignored-flag class the FLAGS_KNOWN allowlist
  // exists to close. mirrors the --optional bare-flag check below (rule.forbid.failhide)
  if (options.pathsWith?.length === 0) {
    console.error('error: --paths-with requires a glob pattern');
    console.error('run with --help for usage');
    process.exit(2);
  }
  if (options.pathsWout?.length === 0) {
    console.error('error: --paths-wout requires a glob pattern');
    console.error('run with --help for usage');
    process.exit(2);
  }

  // validate --optional supply names (fail loud: never silently disable strictness)
  // .note = only 'rules' is supported today; 'refs' is a deliberate future extension, so it
  //         is rejected loudly rather than silently accepted as a no-op (see Q7 + edgecases)
  if (options.optional !== undefined) {
    // a bare `--optional` (no supply named) must not quietly disable the strict default
    if (options.optional.length === 0) {
      console.error(
        'error: --optional requires a supply name (supported: rules)',
      );
      console.error('run with --help for usage');
      process.exit(2);
    }
    // reject any unknown or not-yet-supported supply name
    const unsupported = getSuppliesUnsupported({ supplies: options.optional });
    if (unsupported.length > 0) {
      console.error(
        `error: --optional does not support: ${unsupported.join(', ')} (supported: ${SUPPLIES_OPTIONAL_SUPPORTED.join(', ')})`,
      );
      console.error('run with --help for usage');
      process.exit(2);
    }
  }

  // determine output path (generate default if not specified)
  const cwd = process.cwd();
  const outputPath = options.output ?? genDefaultReviewOutputPath({ cwd });

  // fast --optional skip pre-check, BEFORE expensive brain discovery
  // .why = the vision requires an empty-rules skip to pay ZERO brain cost; genContextBrain
  //        below walks the filesystem for brain packages, so the emptiness check must run
  //        first (mirrors the "validate required args before expensive brain discovery"
  //        pre-check above). the skip invokes no brain, so it is deterministic and zero-cost.
  const skipDecision = await getReviewOptionalSkipDecision({
    rules: options.rules,
    optional: options.optional,
    cwd,
  });
  if (skipDecision.skip) {
    await emitReviewSkip({
      supply: 'rules',
      ruleGlobs: skipDecision.ruleGlobs,
      output: outputPath,
      cwd,
    });
    process.exit(0);
  }

  // create brain context via discovery with credentials
  // .note = uses env: 'prep' because review is used to prepare code, not test it
  // .note = keyrack auto-unlocks locked keys internally when the brain fetches its
  //         own creds (rhachet >=1.43 get-or-unlock), so no upfront unlock is needed
  const brain = await genContextBrain({
    choice: options.brain,
    creds: { keyrack: { owner: 'ehmpath', env: 'prep' } },
  });

  // invoke stepReview with validation error handler
  try {
    await stepReview(
      {
        rules: options.rules,
        diffs:
          options.diffs ??
          (!hasPaths && !hasPathsWith ? 'since-main' : undefined),
        paths: options.paths,
        pathsWith: options.pathsWith,
        pathsWout: options.pathsWout,
        join: options.join,
        refs: options.refs,
        optional: options.optional,
        conversation: options.conversation,
        output: outputPath,
        focus: options.focus,
        goal: options.goal,
      },
      { brain },
    );

    // open output file if --open specified
    if (options.open) {
      const outputAbsolute = path.isAbsolute(outputPath)
        ? outputPath
        : path.join(cwd, outputPath);
      const command = `${options.open} "${outputAbsolute}"`;
      try {
        execSync(command, { stdio: 'inherit' });
      } catch (error) {
        if (error instanceof Error) {
          console.error(
            `opener '${options.open}' unavailable or failed: ${error.message}`,
          );
        }
      }
    }
  } catch (error) {
    if (error instanceof BadRequestError) {
      console.error(`\n✋ ${error.message}`);
      process.exit(2);
    }
    throw error;
  }
};
