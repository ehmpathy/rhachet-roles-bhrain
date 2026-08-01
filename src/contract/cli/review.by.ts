import { BadRequestError } from 'helpful-errors';

import { asReviewBodyStdout } from '@src/domain.operations/review.by/asReviewBodyStdout';
import { genReviewBodyStreamer } from '@src/domain.operations/review.by/genReviewBodyStreamer';
import { genReviewByRubricStreamer } from '@src/domain.operations/review.by/genReviewByRubricStreamer';
import { genReviewByStdout } from '@src/domain.operations/review.by/genReviewByStdout';
import { stepReviewBy } from '@src/domain.operations/review.by/stepReviewBy';
import {
  FIXED_FALLBACK_BRAIN,
  genReviewBrainSupply,
} from '@src/domain.operations/route/genReviewBrainSupply';

/**
 * .what = the review.by default brain when --brain is omitted
 * .why = the vision fixes review.by's default to fireworks/deepseek/v4-flash. we apply it
 *        explicitly here so the contract holds even if the review skill's own default ever
 *        changes — the default is honored by review.by, not by coincidence.
 */
const DEFAULT_REVIEW_BRAIN = 'fireworks/deepseek/v4-flash';

/**
 * .what = detects if node was invoked via `node -e "code"` (eval mode)
 * .why = in eval mode argv has no entrypoint path: [node, firstArg, ...]; in normal mode it
 *        does: [node, file.js, firstArg, ...]. we skip a different count when we slice argv.
 */
const isNodeEvalMode = (input: { argv: string[] }): boolean => {
  const { argv } = input;
  const secondArg = argv[1];
  if (!secondArg) return false;
  const looksLikeEntrypointPath =
    /\.(js|ts|mjs|cjs)$/.test(secondArg) || !secondArg.startsWith('--');
  return !looksLikeEntrypointPath;
};

/**
 * .what = parses cli args into options
 * .why = a small dependency-free parser; exported so the flag contract is testable without a
 *        full end-to-end run.
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
 * .what = the dispatch flags rhachet ALWAYS forwards into a skill's argv
 * .why = `rhx review.by --repo bhrain --role reviewer` forwards --repo/--role/--skill through to
 *        the skill (rhachet never eats them). so the base engine sees them on every invocation —
 *        directly, and when a role's own review.by wrapper calls the base. they are dispatch
 *        noise to this skill: --skill names this very skill, --repo names the package it came
 *        from. we tolerate (silently ignore) them so a wrapper→base `rhx` call is not rejected as
 *        an unknown flag — while a genuine typo like --rool still errors loud (case18). --role is
 *        NOT here: it is a real arg of this skill (the target role whose rubrics to run), parsed
 *        last-wins so a wrapper's explicit --role overrides the forwarded dispatch --role.
 */
const DISPATCH_FLAGS = ['skill', 'repo'] as const;

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
} => {
  const { argv } = input;
  const skipCount = isNodeEvalMode({ argv }) ? 1 : 2;
  const args = argv.slice(skipCount).filter((arg) => arg !== '--');

  // fold the arg list into { options, unknownFlags, valueAbsentFlags } without mutation. only
  // flag tokens (--foo) drive the fold; a flag's value is the NEXT token unless that token is
  // itself a flag. value tokens are non-flag, so they self-skip via the early return — no index
  // counter needed. unknown flags (e.g. --rool) collect so the caller can warn on a typo; a
  // KNOWN value-flag with no value collects too, so `--brain` alone is a loud error, not a
  // silent fall-back to the default (rule.require.errors-name-the-fix).
  const { options, unknownFlags, valueAbsentFlags } = args.reduce<{
    options: Record<string, string>;
    unknownFlags: string[];
    valueAbsentFlags: string[];
  }>(
    (acc, arg, index) => {
      if (!arg.startsWith('--')) return acc;
      const key = arg.slice(2);
      const isKnown = KNOWN_FLAGS.includes(key as (typeof KNOWN_FLAGS)[number]);
      const isDispatch = DISPATCH_FLAGS.includes(
        key as (typeof DISPATCH_FLAGS)[number],
      );
      const next = args[index + 1];
      const value =
        next !== undefined && !next.startsWith('--') ? next : undefined;
      // a forwarded dispatch flag (--skill/--repo) is tolerated: its value token self-skips (it
      // is non-flag, so the next fold step early-returns on it), and it is neither stored as an
      // option nor collected as unknown. this lets `rhx review.by --repo bhrain --role reviewer`
      // — and a wrapper's call to the base — parse cleanly.
      if (isDispatch) return acc;
      // help/h are the only valueless known flags; every other known flag expects a value
      const isValueFlag = isKnown && key !== 'help' && key !== 'h';
      return {
        // known flags store last-wins, so a wrapper's explicit --role overrides a forwarded
        // dispatch --role that rhachet placed earlier in argv
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
    unknownFlags,
    valueAbsentFlags,
  };
};

/**
 * .what = prints usage
 * .why = every command explains itself on demand (rule.require.help-on-demand).
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
  --diffs  <range>    diff scope: since-main, since-staged (forwarded)
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
 * .why = the ONLY place with console.log + process.exit. parses args, runs stepReviewBy, prints
 *        the treestruct, and exits by outcome: 0 (no blockers), 2 (any blockers), 1 (a thrown
 *        config/validation error). errors print to stderr before a nonzero exit
 *        (rule.forbid.stdout-on-exit-errors).
 */
export const reviewBy = async (): Promise<void> => {
  // help short-circuits before any work
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    return;
  }

  const options = parseReviewByArgs({ argv: process.argv });

  // an unrecognized flag (a typo like --rool) is a friction hazard if dropped in silence — name
  // it and point to --help, then exit 1 so the mistake is loud (rule.require.errors-name-the-fix)
  if (options.unknownFlags.length > 0) {
    console.error(`error: unknown flag(s): ${options.unknownFlags.join(', ')}`);
    console.error('run with --help for usage');
    process.exit(1);
  }

  // a known value-flag given with no value (e.g. `--brain` alone) would silently fall back to
  // the default — the human thinks they overrode it but did not. name it loud, exit 1
  // (rule.require.errors-name-the-fix, principle of least astonishment)
  if (options.valueAbsentFlags.length > 0) {
    console.error(
      `error: flag(s) expect a value: ${options.valueAbsentFlags.join(', ')}`,
    );
    console.error('run with --help for usage');
    process.exit(1);
  }

  // --role is required; an absent role is a usage error → exit 1
  if (options.role === undefined) {
    console.error('error: --role is required');
    console.error('run with --help for usage');
    process.exit(1);
  }

  // lazy sub-brain supplier for the review-tally fallback (same as the guard cli)
  const reviewBrainSupply = genReviewBrainSupply({
    choice: FIXED_FALLBACK_BRAIN,
    creds: { keyrack: { owner: 'ehmpath', env: 'prep' } },
  });

  // a single-scope run — `--for $one` — DISINTERMEDIATES: it resolves to exactly one review, so
  // review.by prints that base review's stdout verbatim instead of its own tree. the result looks
  // exactly like a plain `rhx review`, which is what a route guard peer slot wants — the guard
  // wraps a normal review, not review.by chrome nested in its tree. an aggregate run (no --for)
  // keeps the summary tree (+ the live streamer below). see rule.require.review-by-disintermediates.
  const disintermediate = options.for !== undefined;

  // live per-rubric feedback so a human is not left with a silent terminal while the slow LLM
  // reviews run (rule.require.status-feedback). each rubric streams as the SAME incremental
  // peer-style row route.stone.set renders (genReviewByRubricStreamer → formatGuardReviewerTree),
  // so review.by looks, while it runs, exactly like a route peer review.
  //
  // goes to STDOUT, not stderr: rhachet's skill runner streams a skill's stdout live but PIPES
  // its stderr into a buffer it discards on success (executeSkill stdio = [stdin, stdout, 'pipe'])
  // — so a stderr write would never reach the human. suppressed under a guard
  // (RHACHET_GUARD_CONTEXT=1): the guard renders its OWN peer tree + parses the child's settled
  // stdout for counts, so review.by stays quiet there and the guard-parseable summary is untouched.
  // also suppressed for a disintermediated run: the base review's own stdout is the whole output,
  // so the review.by peer tree would be the very chrome disintermediation removes.
  const underGuard = process.env.RHACHET_GUARD_CONTEXT === '1';
  const streamer =
    underGuard || disintermediate
      ? null
      : genReviewByRubricStreamer({ out: process.stdout });
  const onRubricProgress = streamer?.onProgress;

  // a human `--for` run streams the child review's stdout live, so the disintermediated review
  // arrives progressively — the SAME live output a direct `rhx review` gives — instead of a silent
  // wait then a dump (rule.require.status-feedback). the stream goes through genReviewBodyStreamer,
  // which strips the inner `rhx review` dispatch banner off the front as it flows, so what the human
  // watches live is byte-identical to the disintermediated body the buffered path would stamp (no
  // doubled banner). suppressed under a guard: the guard captures the settled stdout for its OWN
  // tree, so a live tee there would corrupt the peer capture. the tee goes to STDOUT (not stderr)
  // because rhachet's skill runner discards a skill's stderr on success.
  const streamChildReview = disintermediate && !underGuard;
  const bodyStreamer = streamChildReview
    ? genReviewBodyStreamer({ write: (text) => process.stdout.write(text) })
    : null;
  const onStdoutChunk = bodyStreamer?.onChunk;

  // print a live-stream header so the streamed peer rows attach to an anchor — mirrors how
  // route.stone.set prints its owl header before the peer tree streams (route.ts). the real
  // vibe artifact is loaded from rubrics.yml inside stepReviewBy; the transient stream uses the
  // default 🔍 (the settled tree below carries any vibe override).
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
        brain: options.brain ?? DEFAULT_REVIEW_BRAIN,
        output: options.output ?? null,
      },
      { ...reviewBrainSupply, onRubricProgress, onStdoutChunk },
    );

    // the live streams are finished; stop the rubric spinner + flush a body-streamer lead shorter
    // than one line, before any settled output prints
    streamer?.done();
    bodyStreamer?.done();

    // a single-scope (`--for`) run disintermediates to a plain review — never the review.by tree.
    // two delivery paths, one disintermediated result — and both emit the SAME banner-stripped body:
    // - streamed (a human run): the child review already streamed live above THROUGH the body
    //   streamer, which stripped the inner banner as it flowed. so the human watched exactly the
    //   disintermediated body, closed on its own settled owl tree — the same output a direct
    //   `rhx review` gives. that live stream IS the forward; no further output is emitted here.
    // - buffered (a guard / non-tty run): no live stream happened, so stamp the settled body now via
    //   asReviewBodyStdout, which strips the inner `rhx review` dispatch banner. a guard-dispatched
    //   review.by --for then shows one banner (its own `…skill=review.by` stamp) + the review body —
    //   not a doubled banner. the clean drop-in a guard peer slot captures and tallies.
    // both paths strip through the SAME asReviewBodyStdout, so a human's live stream and a guard's
    // stamp are byte-identical — one body, two deliveries.
    // an aggregate run (no --for) renders the canonical review.by treestruct instead.
    if (disintermediate) {
      if (!streamChildReview)
        process.stdout.write(
          asReviewBodyStdout({ stdout: result.results[0]!.stdout }),
        );
    } else {
      if (streamer) console.log('');
      console.log(genReviewByStdout({ result }));
    }

    // exit by worst outcome: 2 when any rubric found blockers (constraint), else 1 when any
    // rubric malfunctioned (server-side failure surfaced, never a fake 0/0 pass), else 0
    const anyMalfunction = result.results.some(
      (rubric) => rubric.verdict.outcome === 'malfunctioned',
    );
    if (result.blockersTotal > 0) process.exit(2);
    if (anyMalfunction) process.exit(1);
    process.exit(0);
  } catch (error) {
    // only the caller-fixable config/validation errors are handled here (role/yml absent,
    // duplicate slug, bad --for, malformed yaml). the blackbox criteria fix every error case
    // to exit 1, so a BadRequestError prints to stderr + exits 1. any OTHER error is an
    // unexpected defect — rethrow it so its full stack surfaces (rule.forbid.failhide).
    if (error instanceof BadRequestError) {
      console.error(`\n✋ ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
};
