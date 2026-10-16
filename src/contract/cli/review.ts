import { execSync } from 'child_process';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';
import type { BrainChoice, ContextBrain } from 'rhachet';
import { getAvailableBrains, getAvailableBrainsInWords } from 'rhachet/brains';

import { FLAGS_OF_DISPATCHER } from '@src/contract/cli/FLAGS_OF_DISPATCHER';
import { BRAIN_DEFAULT_OF_REVIEW } from '@src/domain.operations/brain/BRAIN_DEFAULT_OF_REVIEW';
import { genReviewBrain } from '@src/domain.operations/brain/genReviewBrain';
import { getInvocationArgs } from '@src/domain.operations/cli/getInvocationArgs';
import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import { asErrorMessage } from '@src/domain.operations/review/asErrorMessage';
import { asReviewChoice } from '@src/domain.operations/review/asReviewChoice';
import { emitReviewSkip } from '@src/domain.operations/review/emitReviewSkip';
import { genDefaultReviewOutputPath } from '@src/domain.operations/review/genDefaultReviewOutputPath';
import { getAllReviewFlagChoiceRefusals } from '@src/domain.operations/review/getAllReviewFlagChoiceRefusals';
import { getOneReviewModeRepeatRefusal } from '@src/domain.operations/review/getOneReviewModeRepeatRefusal';
import { getReviewOptionalSkipDecision } from '@src/domain.operations/review/getReviewOptionalSkipDecision';
import {
  getSuppliesUnsupported,
  SUPPLIES_OPTIONAL_SUPPORTED,
} from '@src/domain.operations/review/getSuppliesOptionalSupported';
import { asFlagListForDisplay } from '@src/domain.operations/review/grove/asFlagListForDisplay';
import { isErrorOfSpawnFailure } from '@src/domain.operations/review/isErrorOfSpawnFailure';
import { getOneReviewPartitionsFault } from '@src/domain.operations/review/partition/getOneReviewPartitionsFault';
import { HINT_OF_PLAN_WITHOUT_SPLIT } from '@src/domain.operations/review/partition/HINT_OF_PLAN_WITHOUT_SPLIT';
import {
  asReviewPrimeMeetFromEnv,
  ENV_OF_REVIEW_PRIME_MEET,
} from '@src/domain.operations/review/prime/asReviewPrimeMeetFromEnv';
import { ReviewRefusalEmittedError } from '@src/domain.operations/review/ReviewRefusalEmittedError';
import { stepReview } from '@src/domain.operations/review/stepReview';
import { getAllPartitionFlagsOfReviewRun } from '@src/domain.operations/route/guard/partition/getAllPartitionFlagsOfReviewRun';
import { asConstraintRefusalText } from '@src/utils/asConstraintRefusalText';
import { asCountedNoun } from '@src/utils/asCountedNoun';
import { isCallerConstraintError } from '@src/utils/isCallerConstraintError';

import { asArgvSpaced } from './asArgvSpaced';
import { asConstraintErrorHeader } from './asConstraintErrorHeader';
import { asConstraintErrorHeadline } from './asConstraintErrorHeadline';
import { asHelpfulMessageParts } from './asHelpfulMessageParts';
import { asOpenerFailureNote } from './asOpenerFailureNote';
import { asRefusalHintLines } from './asRefusalHintLines';

/**
 * .what = default brain for review skill
 * .why = the review default, read from `brain/` where its decision is declared,
 *        never re-typed here (rule.forbid.magic-values)
 */
const DEFAULT_BRAIN = BRAIN_DEFAULT_OF_REVIEW;

/**
 * .what = prints help message with available brains
 * .why = enables humans to discover available brain options
 */
const printHelp = async (): Promise<void> => {
  const { atoms, repls } = await getAvailableBrains();
  const brainsInWords = getAvailableBrainsInWords({
    atoms,
    repls,
    choice: '',
  });

  console.log(asReviewHelpText({ brainsInWords }));
};

/**
 * .what = the `--help` text of `rhx review`, with the brain list spliced in
 * .why = a pure render, so a clamp can hold it against FLAGS_KNOWN with no brain discovery
 */
export const asReviewHelpText = (input: { brainsInWords: string }): string =>
  `
review - code review against rules

usage:
  review.sh [options]

options:
  --rules <globs>     glob pattern(s) for rule files (required, can repeat)
  --paths <globs>     glob pattern(s) for target files (deprecated: use --paths-with)
  --paths-with <glob>   include files that match this glob (can repeat)
  --paths-wout <glob>   exclude files that match this glob (can repeat)
                        alias: --paths-without
  --polluters <mode>  drop or keep the polluters in scope (default: drop)
                      dropped by default: every route artifact except
                      .fulcrums/*._.md, .seeds/**, and *.yield.md; every caught
                      dream; every dependency lockfile. a --paths-with glob that
                      names only route artifacts keeps what it names
  --diffs <range>     diff range: since-main, since-commit, since-staged (default: since-main)
  --join <mode>       how to join --paths-with and --diffs: intersect or union (default: intersect)
  --refs <globs>      glob pattern(s) for reference files (can repeat)
  --optional <supply> mark a supply as optional; when its glob matches zero files, skip the
                      review (emit 0 blockers / 0 nitpicks, exit 0) instead of a fail-loud error.
                      supported: rules (can repeat)
  --partition '<slug>=<globs>'
                      a set of files this review may be judged by on its own, should the
                      whole prompt overflow its window (can repeat). the partitions run at
                      once, and their verdicts merge into one --output with one
                      blockers/nitpicks tally. a fit never splits.
                      · globs: a prefix (src/review), a glob (src/**/*.ts), or a comma
                        list of either: 'review=src/review/**,src/domain.objects/**' — no
                        braces needed ('review={...}' reads the same). repeat a slug to
                        widen it; its flags merge into one partition. quote each value
                      · a member with a ! at its head subtracts what it matches — it
                        carves a flat dir, which has no subdirectory to cut along:
                        'review=src/review/*,!src/review/compile*'
                      · a malformed value refuses with the corrected one; a glob that
                        matched no target is flagged in --mode plan
                      · sets may overlap, and should: a file in two or more partitions is
                        common — it leads each prompt, and is graded once, by the first
                        partition that lists it
                      · refuses (exit 2), under --mode plan or when an overflow splits: a
                        target in no partition · a bound route absent from a partition ·
                        a partition that still overflows alone. a fit run ignores the set
                      the refusal of an overflowed review names which lever fits it:
                      a narrower --paths-wout for edited files, or --partition for
                      added ones, whose bodies no bind can shrink
  --mode <mode>       plan, hard, or soft (default: none — the review runs)
                      · plan: preview the declared --partition split — each partition's
                        globs and cost — and call no brain
                      · hard, soft: the rhachet dispatcher's own mode, passed through by
                        every guard call. review reads neither, so each runs the review
  --conversation <files>  comma-separated prior peer-review dialogue files (.given + .taken) to thread as context (opt-in; guard expands $conversation)
  --output <path>     output file path (default: .review/$branch/$isotime.output.md)
  --focus <mode>      review focus: push or pull (default: push)
  --goal <goal>       review goal: exhaustive or representative (default: exhaustive)
  --brain <slug>      brain to use for review (default: ${DEFAULT_BRAIN})
  --open <opener>     open output file with specified program (e.g., nvim, codium, code)
  --help              show this help message

${input.brainsInWords}
`.trim();

/**
 * .what = refuses a review invocation for a flag defect, then exits 2
 * .why = every flag refusal shares the owl frame `emitReviewRefusal` gives every
 *        other review refusal, so a typo reads like a scope or overflow refusal
 */
const refuseReviewFlag = (input: {
  headline: string;
  lines?: string[];
  hint: string;
}): never => {
  emitReviewRefusal({
    kind: 'constraint',
    headline: input.headline,
    lines: asRefusalHintLines({ lines: input.lines ?? [], hint: input.hint }),
  });
  return process.exit(2);
};

/**
 * .what = the `known` latest slugs a brain-pin refusal carries, as a tree branch
 * .why = the list is the menu a caller picks the fix from, so it survives the drop of
 *        the metadata json — as rows, never as a json array
 */
const asBrainKnownLines = (input: {
  metadata: Record<string, unknown> | null;
}): string[] => {
  // only a list of slugs is a menu; any other shape names naught to pick
  const known = input.metadata?.known;
  if (!Array.isArray(known)) return [];
  const slugs = known.filter(
    (slug): slug is string => typeof slug === 'string',
  );
  if (slugs.length === 0) return [];
  return [
    '   ├─ known',
    ...slugs.map(
      (slug, at) => `   │  ${at === slugs.length - 1 ? '└─' : '├─'} ${slug}`,
    ),
  ];
};

/**
 * .what = boots the `--brain` choice, or refuses in the owl frame and exits 2
 * .why = a brain the caller named badly — an unregistered slug, a locked key, an absent
 *        package — is a flag defect, so it reads in the same frame as every other flag
 *        refusal rather than as a bare header below the frame's place
 *
 * .note = an unregistered brain is converted by `genReviewBrain` first, so the
 *         refusal names the fix; any fault that is not a constraint still throws
 */
const genReviewBrainOrRefuse = async (input: {
  choice: string;
}): Promise<{
  brain: ContextBrain<BrainChoice>;
}> => {
  try {
    const { brain } = await genReviewBrain({
      choice: input.choice,
    });
    return { brain };
  } catch (error) {
    if (!(error instanceof BadRequestError)) throw error;

    // the reason's first line is the headline. the metadata json is dropped, since it is
    // debug noise in a human frame (rule.forbid.snapshot-visual-blemishes); the two
    // fields a caller acts on ride as tree rows — the `known` slugs to pick from, and
    // the `hint` as a `fix:` row
    const parts = asHelpfulMessageParts({
      message: asConstraintErrorHeadline({ error }),
    });
    const [lead, ...rest] = parts.headline
      .split('\n')
      .filter((line) => line.trim() !== '');
    return refuseReviewFlag({
      headline: lead ?? '',
      lines: [
        ...rest.map((line) => `   ├─ ${line}`),
        ...asBrainKnownLines({ metadata: parts.metadata }),
        ...(parts.hint ? [`   ├─ fix: ${parts.hint}`] : []),
      ],
      hint: 'run with --help for the --brain choices',
    });
  }
};

/**
 * .what = checks if help flag is present in args
 * .why = enables early exit for help display
 */
const hasHelpFlag = (argv: string[]): boolean => {
  return argv.includes('--help') || argv.includes('-h');
};

/**
 * .what = the flags that may be given more than once, each occurrence accumulated
 * .why = a caller who passes several globs must not silently lose all but the last.
 *        a last-wins path glob is the worst failure shape there is: the bind reads
 *        as applied, the review runs unbounded, and no error is raised.
 *
 * .note = --paths-with and --paths-wout are a symmetric pair, so both repeat. one
 *         that repeats beside one that does not is a footgun a caller meets once.
 * .note = --rules repeats because review.by emits one --rules per rule of a rubric
 *         (genReviewRubricCmd). a last-wins --rules loads one rule of two in silence;
 *         a refusal fails every multi-rule rubric
 * .note = --partition repeats because one flag declares one partition, and a split has
 *         two or more
 */
const FLAGS_REPEATABLE = new Set([
  'rules',
  'refs',
  'optional',
  'paths-with',
  'paths-wout',
  'partition',
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
 * .what = every `--key` this parser recognizes, in its canonical form
 * .why = an unrecognized flag used to land in `options[key]` and never be read
 *        downstream — no error, no warn. a misspelled `--paths-wout` ran the lane
 *        unbounded with no signal at all, and the overflow read as a lane
 *        genuinely too wide rather than a dropped bind (rule.forbid.failhide).
 *
 * .note = `help` is included so `--help` never reads as unknown — `hasHelpFlag`
 *         checks it separately, but `parseReviewArgs` walks every arg first.
 *
 * `skill`, `repo`, and `mode` are the outer `rhachet run --skill review --repo <x>
 * --mode hard` dispatcher's own flags — every guard-authored `$rhx review …` call
 * opens with them. `rhachet run` forwards its full argv verbatim rather than
 * strip what it already consumed, so `review()` sees them too. they are
 * recognized here and read by naught downstream — the allowlist catches a typo in
 * a flag `review()` itself acts on, never re-litigates the dispatcher's contract.
 */
export const FLAGS_KNOWN = new Set([
  'rules',
  'paths',
  'paths-with',
  'paths-wout',
  'polluters',
  'diffs',
  'join',
  'refs',
  'optional',
  'partition',
  'conversation',
  'output',
  'focus',
  'goal',
  'brain',
  'open',
  'help',
  ...FLAGS_OF_DISPATCHER,
]);

/**
 * .what = the short flags this parser reads
 * .why = `-h` is read, which teaches that short flags are read, so any other
 *        short flag is refused by name rather than dropped in silence
 */
const FLAGS_SHORT_KNOWN = new Set(['-h']);

/**
 * .what = the non-repeatable flags that may appear with no value, and mean absence
 * .why = every other non-repeatable flag refuses when valueless: a `--diffs`
 *        typed with its value forgotten must not run on the default, since the
 *        driver asked for one value and would get another in silence
 *        (rule.forbid.unexpected-defaults). each entry here states why it is exempt:
 *
 *        · `conversation` — the guard expands `$conversation` to the empty string
 *          on round 1 (no prior round to converse with), and the shell then drops
 *          the token, so argv reads `--conversation --output …`. that is absence
 *          spelled by a machine, never a slip, and a refusal would halt round 1
 *          of every guarded stone
 *        · `help` — a bare switch by contract; it takes no value at all
 *        · `FLAGS_OF_DISPATCHER` — the dispatcher's own flags, forwarded verbatim
 *          (see FLAGS_KNOWN); their contract is the dispatcher's to police
 */
const FLAGS_TOLERANT_OF_NO_VALUE = new Set([
  'conversation',
  'help',
  ...FLAGS_OF_DISPATCHER,
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
  rules: string[] | undefined;
  diffs: string | undefined;
  paths: string | undefined;
  pathsWith: string[] | undefined;
  pathsWout: string[] | undefined;
  /** the four choice flags, as typed — narrowed by review() after its refusal check */
  polluters: string;
  join: string;
  refs: string[] | undefined;
  optional: string[] | undefined;
  partition: string[] | undefined;
  /**
   * `plan` where `--mode plan` was given; `apply` otherwise. `--mode` is also the
   * dispatcher's own flag (`--mode hard`), so only `plan` is read as a request
   */
  mode: 'plan' | 'apply';
  /**
   * the `--mode` value as typed; null where absent. read only to refuse a value that is
   * neither `plan` nor the dispatcher's own, since a typo of `plan` ran a paid review
   */
  modeGiven: string | null;
  /**
   * every `--mode` value as typed, in order. `--mode` is a dispatcher flag, so it escapes
   * the generic repeat refusal; read only to refuse values that differ, since a last-wins
   * `--mode plan --mode hard` ran a paid review where a free preview was asked for
   */
  modesGiven: string[];
  conversation: string[] | undefined;
  output: string | undefined;
  focus: string;
  goal: string;
  brain: string;
  open: string | undefined;
  unknownFlags: string[];
  /** known flags that appeared with no value and may not — refused by the caller */
  valuelessFlags: string[];
  /** single-value flags typed more than once — refused by the caller */
  repeatedFlags: string[];
  /** tokens no flag consumed — refused by the caller, since review takes no positional */
  strayArgs: string[];
} => {
  // the caller args, eval-mode offset and `--` handled in one shared place, with each
  // `--flag=value` read as `--flag value` — the form `review._.cost` reads too
  const args = asArgvSpaced({ args: getInvocationArgs(argv) });

  // .note = deliberate mutation, and a SCOPED ZONE — `options`, `unknownFlags`,
  //         `flagsValueless`, `flagsSeen`, `flagsRepeated`, `argsStray`, `modesTyped`,
  //         and the cursor are born here and none escapes; the
  //         return below reads them and hands back a fresh literal
  //         (rule.require.immutable-vars). an argv walk is a fold, not a map — a flag
  //         consumes the next token, and a repeatable flag accumulates
  const options: Record<string, string | string[]> = {};
  const unknownFlags: string[] = [];

  // flags that appeared with no value. without this set, a bare flag reads as absent.
  // every known flag outside FLAGS_TOLERANT_OF_NO_VALUE is refused by the caller
  const flagsValueless = new Set<string>();

  // single-value flags typed twice, and tokens no flag consumed. a last-wins
  // `--brain a --brain b` ran `b` with no word, and a stray `src/foo.ts`
  // was dropped with none — which one the human meant is theirs to say
  const flagsSeen = new Set<string>();
  const flagsRepeated = new Set<string>();
  const argsStray: string[] = [];

  // every `--mode` value, since the last-wins `options.mode` alone hides a repeat whose
  // values differ (getOneReviewModeRepeatRefusal)
  const modesTyped: string[] = [];

  for (let i = 0; i < args.length; i++) {
    // an empty token is no argument at all — a quoted `"$conversation"` on round 1
    // expands to one, and it must read as absence, never as a stray positional
    const arg = args[i];
    if (!arg) continue;

    // a short flag other than `-h` is not read here, so it is refused by name
    if (arg.startsWith('-') && !arg.startsWith('--') && arg.length > 1) {
      if (!FLAGS_SHORT_KNOWN.has(arg)) unknownFlags.push(arg);
      continue;
    }

    // a token no flag consumed: this command takes no positional
    if (!arg.startsWith('--')) {
      argsStray.push(arg);
      continue;
    }

    if (arg.startsWith('--')) {
      const key = asCanonicalReviewFlag({ flag: arg.slice(2) });
      const value = args[i + 1];

      // a single-value flag seen before is recorded, so the caller refuses it
      if (flagsSeen.has(key) && isFlagRefusedWhenRepeated({ key }))
        flagsRepeated.add(arg);
      flagsSeen.add(key);

      // an unrecognized flag is recorded, never dropped in silence — the caller reads
      // it back from `unknownFlags` and fails loud, the arg itself is what states it
      if (!FLAGS_KNOWN.has(key)) unknownFlags.push(arg);

      // a repeatable flag accumulates each occurrence. presence is recorded (as [])
      // even when the value is absent or another flag, so review() can fail loud on
      // a bare `--optional` (no supply named)
      const hasValue = !!value && !value.startsWith('--');
      if (FLAGS_REPEATABLE.has(key)) {
        if (!options[key]) options[key] = [];
        if (!hasValue) continue;
        (options[key] as string[]).push(value);
        i++;
        continue;
      }

      // the flag was there and took no value — recorded, never collapsed into
      // absence. see `flagsValueless` above for why the two must stay apart
      if (!hasValue) {
        flagsValueless.add(key);
        continue;
      }

      // .note = --conversation is a normal single-value flag: the guard expands
      //         $conversation to ONE comma-joined token, split into files below
      if (key === 'mode') modesTyped.push(value);
      options[key] = value;
      i++;
    }
  }

  return {
    rules: options.rules as string[] | undefined,
    diffs: options.diffs as string | undefined,
    paths: options.paths as string | undefined,
    pathsWith: options['paths-with'] as string[] | undefined,
    pathsWout: options['paths-wout'] as string[] | undefined,
    // the four choice flags hand back the value as typed, never cast to their closed set:
    // review() refuses an outside value, then narrows each (asReviewChoice)
    polluters: (options.polluters as string | undefined) ?? 'drop',
    join: (options.join as string | undefined) ?? 'intersect',
    refs: options.refs as string[] | undefined,
    optional: options.optional as string[] | undefined,
    partition: options.partition as string[] | undefined,
    mode: options.mode === 'plan' ? 'plan' : 'apply',
    modeGiven: (options.mode as string | undefined) ?? null,
    modesGiven: modesTyped,
    conversation: options.conversation
      ? (options.conversation as string).split(',')
      : undefined,
    output: options.output as string | undefined,
    focus: (options.focus as string | undefined) ?? 'push',
    // .why = exhaustive by default: a sample of 3 of 9 instances costs three guard rounds
    //        to converge and hides the class; all 9 converge in one and show the cause.
    //        it widens coverage, never severity — many locations under one violation
    goal: (options.goal as string | undefined) ?? 'exhaustive',
    brain: (options.brain as string) ?? DEFAULT_BRAIN,
    open: options.open as string | undefined,
    unknownFlags,
    // an unknown flag is already refused by name, so it is not refused twice here
    valuelessFlags: [...flagsValueless].filter((key) =>
      isFlagRefusedWhenValueless({ key }),
    ),
    repeatedFlags: [...flagsRepeated],
    strayArgs: argsStray,
  };
};

/**
 * .what = whether a flag given with no value must be refused
 * .why = a known flag that needs a value, and only that; an unknown flag is refused
 *        by name elsewhere, and a tolerant flag reads a bare mention as its own value
 */
const isFlagRefusedWhenValueless = (input: { key: string }): boolean =>
  FLAGS_KNOWN.has(input.key) && !FLAGS_TOLERANT_OF_NO_VALUE.has(input.key);

/**
 * .what = whether a flag given a second time must be refused
 * .why = a single-value flag given twice is ambiguous; a repeatable flag
 *        (`--partition`, the binds) accumulates, and a dispatcher flag is the
 *        skill runner's own, never this parser's to judge
 * .note = `--mode` is the one dispatcher flag review also reads, so a repeat of it
 *         whose values differ is refused apart (getOneReviewModeRepeatRefusal)
 */
const isFlagRefusedWhenRepeated = (input: { key: string }): boolean =>
  !FLAGS_REPEATABLE.has(input.key) && !FLAGS_OF_DISPATCHER.has(input.key);

/**
 * .what = whether one choice refusal is the `--mode` one
 * .why = every choice refusal opens with its own `--<flag> ` (getAllReviewFlagChoiceRefusals),
 *        and a `--mode` slip earns a hint that names `--mode plan`, the one mode review reads
 */
const isRefusalOfModeFlag = (refusal: string): boolean =>
  refusal.startsWith('--mode ');

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
  if (options.unknownFlags.length > 0)
    refuseReviewFlag({
      headline: `${asCountedNoun({ count: options.unknownFlags.length, one: 'unknown flag', many: 'unknown flags' })}: ${asFlagListForDisplay({ flags: options.unknownFlags })}`,
      hint: 'run with --help for the full flag list',
    });

  // a known flag typed with its value forgotten must not run on its default — the
  // driver asked for one value and would get the default in silence
  // (rule.forbid.unexpected-defaults). `--conversation` is exempt, since the guard
  // spells round 1's empty conversation that way (FLAGS_TOLERANT_OF_NO_VALUE)
  if (options.valuelessFlags.length > 0)
    refuseReviewFlag({
      headline: `${asCountedNoun({ count: options.valuelessFlags.length, one: 'flag', many: 'flags' })} given with no value: ${asFlagListForDisplay({ flags: options.valuelessFlags })}`,
      hint: 'run with --help for the value each one expects',
    });

  // a single-value flag typed twice ran on the last value with no word; which one
  // the human meant is theirs to say, never ours to guess
  if (options.repeatedFlags.length > 0)
    refuseReviewFlag({
      headline: `${asCountedNoun({ count: options.repeatedFlags.length, one: 'flag', many: 'flags' })} given more than once: ${asFlagListForDisplay({ flags: options.repeatedFlags })}`,
      // the repeatable set is read from FLAGS_REPEATABLE, so the hint cannot drift from the parser
      hint: `keep one value per flag; only ${asFlagListForDisplay({ flags: [...FLAGS_REPEATABLE] })} repeat`,
    });

  // a `--mode` typed twice with values that differ ran on the last one in silence, and
  // `--mode plan --mode hard` then paid for a review where a free preview was asked for
  const modeRepeatRefusal = getOneReviewModeRepeatRefusal({
    modes: options.modesGiven,
  });
  if (modeRepeatRefusal !== null)
    refuseReviewFlag({
      headline: modeRepeatRefusal,
      hint: 'keep one --mode: --mode plan previews for free, any other mode runs a paid review',
    });

  // a token no flag consumed was dropped with no word — often an unquoted glob the
  // shell expanded, so the bind the human typed never reached the review
  if (options.strayArgs.length > 0)
    refuseReviewFlag({
      headline: `${asCountedNoun({ count: options.strayArgs.length, one: 'argument', many: 'arguments' })} no flag reads: ${options.strayArgs.join(', ')}`,
      hint: 'review takes no positional; quote each glob (--paths-with "src/**/*.ts") so the shell does not expand it',
    });

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
  if (!hasRules && !hasDiffs && !hasPaths && !hasPathsWith)
    refuseReviewFlag({
      headline:
        'must specify at least one of --rules, --diffs, --paths, or --paths-with',
      hint: 'run with --help for usage',
    });

  // a bare --paths-with or --paths-wout (present, no glob) must not silently apply as
  // "no exclusion" — the exact accepted-but-ignored-flag class the FLAGS_KNOWN allowlist
  // exists to close. mirrors the --optional bare-flag check below (rule.forbid.failhide)
  if (options.pathsWith?.length === 0)
    refuseReviewFlag({
      headline: '--paths-with requires a glob pattern',
      hint: 'run with --help for usage',
    });
  if (options.pathsWout?.length === 0)
    refuseReviewFlag({
      headline: '--paths-wout requires a glob pattern',
      hint: 'run with --help for usage',
    });

  // a bare --partition would read as "may split" with no partition to split into, and
  // an overflow would then refuse while the caller believes a split was declared
  if (options.partition?.length === 0)
    refuseReviewFlag({
      headline: "--partition requires a declaration, '<slug>=<globs>'",
      hint: "e.g. --partition 'review=src/domain.operations/review/**,src/domain.objects/**'",
    });

  // each declaration must parse before any brain cost is paid
  const partitionFault = getOneReviewPartitionsFault({
    partition: options.partition ?? [],
  });
  if (partitionFault)
    refuseReviewFlag({
      headline: partitionFault.headline,
      hint: partitionFault.hint,
    });

  // a bare --refs would review with no references while the driver believes some
  // were supplied — a verdict indistinguishable from refs that matched naught
  if (options.refs?.length === 0)
    refuseReviewFlag({
      headline: '--refs requires a glob pattern',
      hint: 'run with --help for usage',
    });

  // an unrecognized choice (--polluters, --join, --focus, --goal, --mode) must not fall
  // through to the other mode. a typo of `--polluters keep` hands back the scope the
  // caller asked to keep; a typo of `--focus pull` sends an atom brain no content at
  // all, and it reports that empty read as a review; a typo of `--mode plan` runs a
  // paid review where a free preview was asked for (rule.forbid.failhide)
  const choiceRefusals = getAllReviewFlagChoiceRefusals({
    options: { ...options, mode: options.modeGiven },
  });
  // each refusal keeps its own qualified line, so every one reads and greps alike
  const [choiceRefusalFirst, ...choiceRefusalsRest] = choiceRefusals;
  if (choiceRefusalFirst !== undefined)
    refuseReviewFlag({
      headline: choiceRefusalFirst,
      // each further refusal is a row of the one tree, so the hint leaf below closes it
      lines: choiceRefusalsRest.map(
        (refusal) => `   ├─ ✋ ConstraintError: ${refusal}`,
      ),
      // a --mode slip points at the one mode review reads, so the fix is one glance away
      hint: choiceRefusals.some(isRefusalOfModeFlag)
        ? 'run with --help for --mode'
        : 'run with --help for usage',
    });

  // validate --optional supply names (fail loud: never silently disable strictness)
  // .note = only 'rules' is supported today; 'refs' is a deliberate future extension, so it
  //         is rejected loudly rather than silently accepted as a no-op (see Q7 + edgecases)
  if (options.optional !== undefined) {
    // a bare `--optional` (no supply named) must not quietly disable the strict default
    if (options.optional.length === 0)
      refuseReviewFlag({
        headline: '--optional requires a supply name (supported: rules)',
        hint: 'run with --help for usage',
      });

    // reject any unknown or not-yet-supported supply name
    const unsupported = getSuppliesUnsupported({ supplies: options.optional });
    if (unsupported.length > 0)
      refuseReviewFlag({
        headline: `--optional does not support: ${unsupported.join(', ')} (supported: ${SUPPLIES_OPTIONAL_SUPPORTED.join(', ')})`,
        hint: 'run with --help for usage',
      });
  }

  // determine output path (generate default if not specified)
  const cwd = process.cwd();
  const outputPath = options.output ?? genDefaultReviewOutputPath({ cwd });

  // skip on empty --optional rules before brain discovery, so a skip costs $0
  const skipDecision = await getReviewOptionalSkipDecision({
    rules: options.rules ?? [],
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

  // invoke stepReview with validation error handler
  try {
    // the partitions this run's route declares for its reviewer; none outside a route guard
    // .note = the run's one root — the same `cwd` every other input of this run reads against
    const partitionsOfRoute = await getAllPartitionFlagsOfReviewRun({
      output: outputPath,
      cwd,
    });

    // a plan previews a declared split and calls no brain, so a plan with no split to
    // preview refuses before any brain is pinned or booted — never after its cost is paid
    // .note = stepReview keeps its own check, for a route set this lane's targets narrow
    //         to none, and for a direct sdk call
    if (
      options.mode === 'plan' &&
      !options.partition &&
      partitionsOfRoute.partition.length === 0
    )
      refuseReviewFlag({
        headline:
          '--mode plan previews a partition split, and none is declared',
        hint: HINT_OF_PLAN_WITHOUT_SPLIT,
      });

    // create brain context via discovery with credentials
    // .note = a bad `--brain` refuses in the owl frame (genReviewBrainOrRefuse)
    const { brain } = await genReviewBrainOrRefuse({
      choice: options.brain,
    });

    // the prime meet is the pour's grant, never this process's to infer: only a lane
    // the guard poured beside peers carries `join`. read once, here at the contract
    // boundary, so the domain reads no env
    // .note = deliberate mutation: the marker is CONSUMED on read, before any brain or
    //         clone is spawned below, so a review an enrolled clone starts inside this
    //         lane inherits no `join` it was never granted
    const meet = asReviewPrimeMeetFromEnv({ env: process.env });
    delete process.env[ENV_OF_REVIEW_PRIME_MEET];

    await stepReview(
      {
        rules: options.rules ?? [],
        diffs:
          options.diffs ??
          (!hasPaths && !hasPathsWith ? 'since-main' : undefined),
        paths: options.paths,
        pathsWith: options.pathsWith,
        pathsWout: options.pathsWout,
        polluters: asReviewChoice({
          flag: 'polluters',
          value: options.polluters,
        }),
        join: asReviewChoice({ flag: 'join', value: options.join }),
        refs: options.refs,
        optional: options.optional,
        partitions: options.partition,
        partitionsOfRoute,
        mode: options.mode,
        conversation: options.conversation,
        output: outputPath,
        focus: asReviewChoice({ flag: 'focus', value: options.focus }),
        goal: asReviewChoice({ flag: 'goal', value: options.goal }),
        meet,
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
        // the allowlist is a child-process failure, and no wider. `--open` takes an
        // arbitrary program name, so an absent or non-zero opener is an ordinary
        // fact about the driver's input — the review already succeeded, and a
        // cosmetic note is the right answer. a broad `if (error instanceof Error)`
        // catch here is `rule.forbid.failhide`'s mega-blocker shape: it would
        // swallow a real malfunction (a TypeError, an OOM) as "opener unavailable"
        // and still exit 0, so only a real spawn failure is caught below
        if (!isErrorOfSpawnFailure({ error })) throw error;

        // the caller's opener failed: a ConstraintError header, though the review is
        // written and the run exits 0 (asOpenerFailureNote)
        console.error(
          asOpenerFailureNote({
            opener: options.open,
            output: outputAbsolute,
            cause: asErrorMessage({ error }),
          }),
        );
      }
    }
  } catch (error) {
    // a refusal whose owl frame is already on stderr exits 2 in silence: to print its
    // message again would show the driver one failure under two headers
    if (error instanceof ReviewRefusalEmittedError) process.exit(2);
    if (error instanceof BadRequestError) {
      console.error(`\n${asConstraintErrorHeader({ error })}`);
      process.exit(2);
    }

    // a caller-fixable refusal from a dependency's helpful-errors copy (e.g. keyrack's
    // absent-key refusal) renders as one ✋ block too, never a stack trace
    // .note = an unknown --brain arrives above as a BadRequestError (asBrainLookupFault)
    if (isCallerConstraintError(error)) {
      console.error(`\n${asConstraintRefusalText({ message: error.message })}`);
      process.exit(2);
    }
    throw error;
  }
};
