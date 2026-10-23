import { BadRequestError } from 'helpful-errors';

import { BRAIN_DEFAULT_OF_REVIEW } from '@src/domain.operations/brain/BRAIN_DEFAULT_OF_REVIEW';
import { genReviewBrainSupply } from '@src/domain.operations/brain/genReviewBrainSupply';
import { getInvocationArgs } from '@src/domain.operations/cli/getInvocationArgs';
import { isProgressSilenced } from '@src/domain.operations/isProgressSilenced';
import { asFlagListForDisplay } from '@src/domain.operations/review/grove/asFlagListForDisplay';
import { asReviewBodyStdout } from '@src/domain.operations/review.by/asReviewBodyStdout';
import { asReviewByMalfunctionLines } from '@src/domain.operations/review.by/asReviewByMalfunctionLines';
import { genReviewBodyStreamer } from '@src/domain.operations/review.by/genReviewBodyStreamer';
import { genReviewByRubricStreamer } from '@src/domain.operations/review.by/genReviewByRubricStreamer';
import { genReviewByStdout } from '@src/domain.operations/review.by/genReviewByStdout';
import { stepReviewBy } from '@src/domain.operations/review.by/stepReviewBy';
import { asConstraintRefusalText } from '@src/utils/asConstraintRefusalText';
import { asCountedNoun } from '@src/utils/asCountedNoun';
import { isCallerConstraintError } from '@src/utils/isCallerConstraintError';

import { asArgvSpaced } from './asArgvSpaced';
import { asConstraintErrorHeader } from './asConstraintErrorHeader';
import { FLAGS_OF_DISPATCHER } from './FLAGS_OF_DISPATCHER';

/**
 * .what = parses cli args into options
 * .why = dependency-free parser; exported so the flag contract is testable
 *        without a full end-to-end run
 */
const KNOWN_FLAGS = [
  'role',
  'for',
  'paths',
  'diffs',
  'mode',
  'brain',
  'output',
  'help',
  'h',
] as const;

/**
 * .what = the dispatcher's flags that review.by does not itself read
 * .why = a dispatcher flag rides into the argv of a wrapper→base call; it is noise
 *        here, tolerated so the call is not refused as unknown, while a real typo
 *        like --rool still errors loud. a dispatcher flag review.by reads (--mode)
 *        is a known flag instead, so it is left out. derived from the one shared
 *        set, so a new dispatcher flag cannot drift past this list
 */
const DISPATCH_FLAGS: readonly string[] = [...FLAGS_OF_DISPATCHER].filter(
  (flag) => !(KNOWN_FLAGS as readonly string[]).includes(flag),
);

/**
 * .what = the one short flag review.by reads
 * .why = any other single-dash token (`-j`) is a typo, refused by name rather than dropped
 */
const SHORT_FLAGS_KNOWN = ['-h'] as const;

/**
 * .what = the flags that may repeat, last-wins
 * .why = a forwarded --role must be overridable by an explicit one, so it alone may
 *        repeat. a repeated --for, --brain, or --paths would run only the last value,
 *        and the human who asked for two would get one with no word
 */
const FLAGS_LAST_WINS = ['role'] as const;

/**
 * .what = whether a token is the value a prior `--flag` consumes
 * .why = the stray and short-flag checks must agree with the value read on what a value
 *        is, or `--for -x` would be refused twice
 */
const isArgValueOfFlag = (input: {
  args: string[];
  index: number;
}): boolean => {
  const prev = input.args[input.index - 1];
  const arg = input.args[input.index];
  return (
    prev !== undefined &&
    prev.startsWith('--') &&
    prev !== '--help' &&
    arg !== undefined &&
    arg !== '' &&
    !arg.startsWith('--')
  );
};

/**
 * .what = whether a token is loose: no flag reads it, and it is no known short flag
 * .why = a loose token is either a typo of a short flag or a stray positional, and both
 *        are refused by name. an empty token is absence, never a stray
 */
const isArgLoose = (input: { args: string[]; index: number }): boolean => {
  const arg = input.args[input.index] ?? '';
  if (arg === '' || arg.startsWith('--')) return false;
  if (isArgValueOfFlag(input)) return false;
  return !(SHORT_FLAGS_KNOWN as readonly string[]).includes(arg);
};

/**
 * .what = the loose tokens of an argv, split into unknown short flags and stray args
 * .why = the two are refused under different headlines, so the parser reads them apart
 */
const getAllArgsLoose = (input: {
  args: string[];
}): { shortFlagsUnknown: string[]; strayArgs: string[] } => {
  const tokensLoose = input.args.filter((_, index) =>
    isArgLoose({ args: input.args, index }),
  );
  return {
    shortFlagsUnknown: tokensLoose.filter((arg) => arg.startsWith('-')),
    strayArgs: tokensLoose.filter((arg) => !arg.startsWith('-')),
  };
};

/**
 * .what = each single-value `--flag` typed more than once, named once
 * .why = a repeated --for, --brain, or --paths would run only its last value; the
 *        last-wins --role and the tolerated dispatch flags are exempt
 */
const getAllFlagsRepeated = (input: { args: string[] }): string[] => {
  const keysOfFlags = input.args
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => arg.slice(2))
    .filter(
      (key) =>
        !(FLAGS_LAST_WINS as readonly string[]).includes(key) &&
        !DISPATCH_FLAGS.includes(key),
    );
  const keysRepeated = keysOfFlags.filter(
    (key, index) => keysOfFlags.indexOf(key) !== index,
  );
  return [...new Set(keysRepeated)].map((key) => `--${key}`);
};

export const parseReviewByArgs = (input: {
  argv: string[];
}): {
  role: string | undefined;
  for: string | undefined;
  paths: string | undefined;
  diffs: string | undefined;
  mode: string | undefined;
  brain: string | undefined;
  output: string | undefined;
  unknownFlags: string[];
  valueAbsentFlags: string[];
  repeatedFlags: string[];
  strayArgs: string[];
} => {
  // the caller args, eval-mode offset and `--` handled in one shared place. the
  // `--flag=value` form is rewritten to `--flag value`, the same way `review` and
  // `review._.cost` read it
  const args = asArgvSpaced({ args: getInvocationArgs(input.argv) });

  // a token no flag reads, and a single-dash flag other than -h, are refused by name
  const { shortFlagsUnknown, strayArgs } = getAllArgsLoose({ args });

  // a single-value flag typed twice, except the last-wins --role and the dispatch flags
  const repeatedFlags = getAllFlagsRepeated({ args });

  // fold the arg list into { options, unknownFlags, valueAbsentFlags } without mutation.
  // a flag's value is the next token unless that token is itself a flag; value tokens
  // are non-flag, so they self-skip via the early return. unknown flags (e.g. --rool)
  // collect so the caller can warn; a known value-flag with no value collects too, so
  // `--brain` alone is a loud error, not a silent fall-back (rule.require.errors-name-the-fix)
  const { options, unknownFlags, valueAbsentFlags } = args.reduce<{
    options: Record<string, string>;
    unknownFlags: string[];
    valueAbsentFlags: string[];
  }>(
    (acc, arg, index) => {
      if (!arg.startsWith('--')) return acc;
      const key = arg.slice(2);
      const isKnown = KNOWN_FLAGS.includes(key as (typeof KNOWN_FLAGS)[number]);
      const isDispatch = DISPATCH_FLAGS.includes(key);
      // an empty token (`--output ""`, or an unset `--output "$DIR"`) is no value: it would
      // slip past `output ?? default` and write into the cwd, so it joins valueAbsentFlags
      const next = args[index + 1];
      const value =
        next !== undefined && next !== '' && !next.startsWith('--')
          ? next
          : undefined;
      // a dispatch flag (--skill/--repo) is tolerated: its value token self-skips (non-flag,
      // so the next fold step early-returns on it), stored as neither option nor unknown.
      // lets `rhx review.by --repo bhrain --role reviewer` — and a wrapper's call to the
      // base — parse cleanly.
      if (isDispatch) return acc;
      // help/h are the only valueless known flags; every other known flag expects a value
      const isValueFlag = isKnown && key !== 'help' && key !== 'h';
      return {
        // known flags store last-wins, so an explicit --role overrides a forwarded one
        options:
          value !== undefined ? { ...acc.options, [key]: value } : acc.options,
        unknownFlags: isKnown ? acc.unknownFlags : [...acc.unknownFlags, arg],
        valueAbsentFlags:
          isValueFlag && value === undefined
            ? [...acc.valueAbsentFlags, arg]
            : acc.valueAbsentFlags,
      };
    },
    { options: {}, unknownFlags: [], valueAbsentFlags: [] },
  );

  return {
    role: options.role,
    for: options.for,
    paths: options.paths,
    diffs: options.diffs,
    mode: options.mode,
    brain: options.brain,
    output: options.output,
    unknownFlags: [...unknownFlags, ...shortFlagsUnknown],
    valueAbsentFlags,
    repeatedFlags,
    strayArgs,
  };
};

/**
 * .what = prints usage
 * .why = every command explains itself on demand (rule.require.help-on-demand)
 */
const printHelp = (): void => {
  console.log(
    `
review.by - run a role's standard review set (its rubrics)

usage:
  review.by --role <role> [--for <rubric>] [options]

options:
  --role   <role>     role slug whose rubrics.yml to run (required)
  --for    <rubric>   run a single rubric by slug (default: all)
  --paths  <globs>    target file globs (forwarded to review as --paths-with)
  --diffs  <range>    diff scope: since-main, since-commit, since-staged (forwarded)
  --mode   <mode>     review focus: push or pull (forwarded to review as --focus)
  --brain  <slug>     brain override for evals (forwarded)
  --output <dir>      output dir (default: .reviews/by=$role/)
  --help              show this help

example:
  review.by --role mechanic --paths 'src/**/*.ts'
  review.by --role mechanic --for mech-failhides
`.trim(),
  );
};

/**
 * .what = cli entrypoint for the review.by skill
 * .why = the only place with console.log + process.exit. parses args, runs
 *        stepReviewBy, prints the treestruct, exits by outcome: 0 (no
 *        blockers), 2 (blockers), 1 (thrown config/validation error). errors
 *        print to stderr before a nonzero exit (rule.forbid.stdout-on-exit-errors)
 */
export const reviewBy = async (): Promise<void> => {
  // help short-circuits before any work
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    return;
  }

  const options = parseReviewByArgs({ argv: process.argv });

  // every usage refusal opens `✋ ConstraintError:` but exits 1, never 2 — exit 2
  // already means "the rubric found blockers", a verdict, so a usage error on 2
  // would read as a review result (rule.require.qualified-error-headers)

  // an unrecognized flag (a typo like --rool) dropped silently is friction — name
  // it and point to --help, exit 1 (rule.require.errors-name-the-fix)
  if (options.unknownFlags.length > 0) {
    console.error(
      `✋ ConstraintError: ${asCountedNoun({ count: options.unknownFlags.length, one: 'unknown flag', many: 'unknown flags' })}: ${asFlagListForDisplay({ flags: options.unknownFlags })}`,
    );
    console.error('run with --help for usage');
    process.exit(1);
  }

  // a known value-flag given with no value (e.g. `--brain` alone) would silently fall
  // back to the default — the human thinks they overrode it but did not. name it loud,
  // exit 1 (rule.require.errors-name-the-fix, principle of least astonishment)
  if (options.valueAbsentFlags.length > 0) {
    console.error(
      `✋ ConstraintError: ${asCountedNoun({ count: options.valueAbsentFlags.length, one: 'flag', many: 'flags' })} given with no value: ${asFlagListForDisplay({ flags: options.valueAbsentFlags })}`,
    );
    console.error('run with --help for usage');
    process.exit(1);
  }

  // a single-value flag typed twice would run only its last value — a human who asked
  // for two rubrics would get one with no word. name it loud, exit 1
  if (options.repeatedFlags.length > 0) {
    console.error(
      `✋ ConstraintError: ${asCountedNoun({ count: options.repeatedFlags.length, one: 'flag', many: 'flags' })} given more than once: ${asFlagListForDisplay({ flags: options.repeatedFlags })}`,
    );
    console.error(
      'each flag but --role takes one value; run with --help for usage',
    );
    process.exit(1);
  }

  // a token no flag reads would be dropped, and the run would review the default scope
  // the human did not ask for — at real cost. name it loud, exit 1
  if (options.strayArgs.length > 0) {
    console.error(
      `✋ ConstraintError: ${asCountedNoun({ count: options.strayArgs.length, one: 'argument', many: 'arguments' })} no flag reads: ${options.strayArgs.join(', ')}`,
    );
    console.error(
      'review.by takes no positional; quote each glob (--paths "src/**/*.ts") so the shell does not expand it',
    );
    process.exit(1);
  }

  // --role is required; an absent role is a usage error → exit 1
  if (options.role === undefined) {
    console.error('✋ ConstraintError: --role is required');
    console.error('run with --help for usage');
    process.exit(1);
  }

  // lazy sub-brain supplier for the review-tally fallback (same as the guard cli)
  const reviewBrainSupply = genReviewBrainSupply();

  // a single-scope run (`--for $one`) disintermediates: it resolves to exactly one
  // review, so review.by prints that base review's stdout verbatim instead of its own
  // tree — reads exactly like a plain `rhx review`, which is what a route guard peer
  // slot wants (not review.by chrome nested in its tree). an aggregate run (no --for)
  // keeps the summary tree plus the live streamer below (rule.require.review-by-disintermediates)
  const disintermediate = options.for !== undefined;

  // live per-rubric feedback so a human is not left with a silent terminal while slow
  // LLM reviews run (rule.require.status-feedback). each rubric streams as the same
  // incremental peer-style row route.stone.set renders, so review.by reads, while it
  // runs, exactly like a route peer review.
  //
  // writes to stdout: rhachet's skill runner streams a skill's stdout live but pipes
  // stderr into a buffer discarded on success. suppressed where the caller silenced this
  // process's progress (`isProgressSilenced`): a buffered capture renders its own tree and
  // parses the settled stdout for counts. the question is "may I draw progress?", never
  // "am I a review's child?" — a streamed capture marks its child a subprocess and leaves
  // it free to stream. also suppressed for a disintermediated run, since the base review's
  // own stdout is the whole output.
  const silenced = isProgressSilenced({ env: process.env });
  const streamer =
    silenced || disintermediate
      ? null
      : genReviewByRubricStreamer({ out: process.stdout });
  const onRubricProgress = streamer?.onProgress;

  // a human `--for` run streams the child review's stdout live, so the disintermediated
  // review arrives progressively — the same live output a direct `rhx review` gives —
  // instead of a silent wait then a dump (rule.require.status-feedback). the stream
  // strips the inner `rhx review` dispatch banner as it flows, so the live output is
  // byte-identical to what the buffered path would stamp (no doubled banner).
  // suppressed where progress is silenced, since that caller captures settled stdout.
  const streamChildReview = disintermediate && !silenced;
  const bodyStreamer = streamChildReview
    ? genReviewBodyStreamer({ write: (text) => process.stdout.write(text) })
    : null;
  const onStdoutChunk = bodyStreamer?.onChunk;

  // a live-stream header anchors the streamed peer rows, matching how route.stone.set
  // prints its owl header before its peer tree streams. rubrics.yml's own vibe applies
  // to the settled tree below; this transient stream uses the default 🔍.
  if (streamer) {
    process.stdout.write(`🔍 review.by --role ${options.role}\n`);
  }

  try {
    const result = await stepReviewBy(
      {
        role: options.role,
        cwd: process.cwd(),
        // the cli boundary may parse a flag as absent; convert to explicit null for the
        // internal orchestrator contract (rule.forbid.undefined-inputs)
        for: options.for ?? null,
        paths: options.paths ?? null,
        diffs: options.diffs ?? null,
        mode: options.mode ?? null,
        // honor the vision's fixed default brain explicitly when --brain is omitted
        // the same review default `rhx review` reads, declared once in `brain/`
        brain: options.brain ?? BRAIN_DEFAULT_OF_REVIEW,
        output: options.output ?? null,
      },
      { ...reviewBrainSupply, onRubricProgress, onStdoutChunk },
    );

    // live streams are finished; stop the rubric spinner and flush any body-streamer
    // lead before settled output prints
    streamer?.done();
    bodyStreamer?.done();

    // a single-scope (`--for`) run disintermediates to a plain review, never the
    // review.by tree. two delivery paths emit the same banner-stripped body:
    // - streamed (a human run): the child review already streamed live above through
    //   the body streamer, which stripped the inner banner as it flowed — the human
    //   watched exactly the disintermediated body. no further output is emitted here.
    // - buffered (a guard / non-tty run): stamp the settled body now via
    //   asReviewBodyStdout, which strips the inner `rhx review` dispatch banner, so a
    //   guard-dispatched review.by --for shows one banner plus the review body.
    // both paths strip through the same asReviewBodyStdout, so a human's live stream
    // and a guard's stamp are byte-identical.
    // an aggregate run (no --for) renders the canonical review.by treestruct instead.
    const isBodyBuffered = disintermediate && !streamChildReview;
    if (isBodyBuffered)
      process.stdout.write(
        asReviewBodyStdout({ stdout: result.results[0]!.stdout }),
      );
    if (!disintermediate) {
      if (streamer) console.log('');
      console.log(genReviewByStdout({ result }));
    }

    // a malfunctioned rubric's stdout is often empty — the child review faulted before
    // it wrote a verdict, so the caller would get a bare nonzero exit. echo each
    // fault's reason plus the child's own stderr, so the cause travels with the
    // failure instead of a silent "it broke" (rule.forbid.failhide,
    // rule.require.errors-name-the-fix), to stderr since it precedes a nonzero exit
    // (rule.forbid.stdout-on-exit-errors). the echo comes BEFORE the exit by worst
    // outcome, so a run that both found blockers and faulted still names the fault
    const malfunctionLines = asReviewByMalfunctionLines({ result });
    if (malfunctionLines.length > 0)
      console.error(`\n${malfunctionLines.join('\n')}`);

    // exit by worst outcome: 2 when any rubric found blockers, else 1 when any rubric
    // malfunctioned (surfaced, never a fake 0/0 pass), else 0
    if (result.blockersTotal > 0) process.exit(2);
    if (malfunctionLines.length > 0) process.exit(1);
    process.exit(0);
  } catch (error) {
    // only caller-fixable config/validation errors are handled here (role/yml absent,
    // duplicate slug, bad --for, malformed yaml) — each exits 1, also one thrown from a
    // dependency's helpful-errors copy (e.g. keyrack's absent-key refusal). any other error
    // is an unexpected defect; rethrow so its full stack surfaces (rule.forbid.failhide)
    if (error instanceof BadRequestError) {
      console.error(`\n${asConstraintErrorHeader({ error })}`);
      process.exit(1);
    }
    if (isCallerConstraintError(error)) {
      console.error(`\n${asConstraintRefusalText({ message: error.message })}`);
      process.exit(1);
    }
    throw error;
  }
};
