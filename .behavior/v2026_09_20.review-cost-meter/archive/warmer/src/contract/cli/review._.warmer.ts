import type { BrainChoice, ContextBrain } from 'rhachet';

import { genReviewBrain } from '@src/domain.operations/brain/genReviewBrain';
import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import { asErrorMessage } from '@src/domain.operations/review/asErrorMessage';
import { getOneReviewRunHead } from '@src/domain.operations/review/getOneReviewRunHead';
import { isErrorOfBadRequest } from '@src/domain.operations/review/isErrorOfBadRequest';
import { asWarmerArgsFromArgv } from '@src/domain.operations/review/warmer/asWarmerArgsFromArgv';
import { asWarmerEndStampFault } from '@src/domain.operations/review/warmer/asWarmerEndStampFault';
import { getAllWarmerFlagsAbsent } from '@src/domain.operations/review/warmer/getAllWarmerFlagsAbsent';
import { getAllWarmerFlagsMalformed } from '@src/domain.operations/review/warmer/getAllWarmerFlagsMalformed';
import { isWarmerArgvComplete } from '@src/domain.operations/review/warmer/isWarmerArgvComplete';
import type { ReviewWarmerPrefix } from '@src/domain.operations/review/warmer/ReviewWarmerRecord';
import { setOneWarmerRetireBeforeBegin } from '@src/domain.operations/review/warmer/setOneWarmerRetireBeforeBegin';
import { setReviewWarmerBoot } from '@src/domain.operations/review/warmer/setReviewWarmerBoot';
import { setReviewWarmerEnd } from '@src/domain.operations/review/warmer/setReviewWarmerEnd';
import { setReviewWarmerPokes } from '@src/domain.operations/review/warmer/setReviewWarmerPokes';
import { CLOCK_OF_WALL } from '@src/domain.operations/review/warmer/WarmerClock';
import { isErrorOfWatermarkFault } from '@src/domain.operations/review/watermark/isErrorOfWatermarkFault';
import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asTreeCauseLines } from './asTreeCauseLines';

/**
 * .what = each kind of unusable warmer flag, with the label its refusal line reads
 * .why = one row per kind, in the order the refusal lists them, so a fourth kind is a
 *        row here rather than a fourth copy of the line builder
 */
const LABEL_OF_WARMER_FLAG_FAULT: ReadonlyArray<
  readonly ['unknown' | 'absent' | 'malformed', string]
> = [
  ['unknown', 'not a warmer flag'],
  ['absent', 'absent'],
  ['malformed', 'not a positive number'],
];

/**
 * .what = the refusal lines that name each unusable flag, by why it is unusable
 * .why = an absent flag and a malformed one are different defects in the spawn; one
 *        list for both would name a flag the spawn passed as one it forgot
 */
const asWarmerFlagFaultLines = (input: {
  absent: string[];
  malformed: string[];
  unknown: string[];
}): string[] =>
  LABEL_OF_WARMER_FLAG_FAULT.filter(([fault]) => input[fault].length > 0).map(
    ([fault, label]) => `   ├─ ${label}: ${input[fault].join(' · ')}`,
  );

/**
 * .what = boots the warmer's brain, or records why it could not and hands back null
 * .why = the boot is the one step whose failure must land in the ledger before it fails
 *        loud: detached, stderr is ignored, so a warmer that never booted would otherwise
 *        read as one never spawned. the caller reads one name, never a catch to decode
 *
 * .note = a fault that is not a bad request still throws, after its row is on disk
 */
const getOneWarmerBrainOrNull = async (input: {
  cwd: string;
  reviewer: string;
  logDir: string;
  choice: string;
}): Promise<ContextBrain<BrainChoice> | null> => {
  try {
    const { brain } = await genReviewBrain({ choice: input.choice });
    return brain;
  } catch (error) {
    const cause = asErrorMessage({ error });

    // EVERY boot failure lands in the ledger `review._.cost` reads. a provider,
    // network, or keyrack fault is the likeliest, so the row is written before any
    // branch on the error's kind
    setOneWarmerRetireBeforeBegin(
      {
        cwd: input.cwd,
        reviewer: input.reviewer,
        logDir: input.logDir,
        why: `the warmer could not boot its brain, so it cost naught — ${cause}`,
      },
      { clock: CLOCK_OF_WALL },
    );

    // an unregistered brain arrives already named by its slug (`genReviewBrain`),
    // exactly as the parent names it; an unexpected fault still fails loud, now that its
    // trace is on disk
    if (!isErrorOfBadRequest({ error })) throw error;

    // a malfunction, never a constraint: the brain choice arrives from the parent
    // `rhx review` via `--brain`, and the creds are the one `CREDS_OF_REVIEW_BRAIN`
    // the parent booted with — both already booted once, so no retyped input
    // clears it
    emitReviewRefusal({
      kind: 'malfunction',
      headline: 'review._.warmer could not boot its brain, so it cost naught',
      lines: [
        `   ├─ reviewer: ${input.reviewer}`,
        ...asTreeCauseLines({ cause }),
        '   └─ fix: the boot is recorded in the warmer cost record; re-run the review, and',
        '      if it persists, check the provider status and its credentials',
      ],
    });
    process.exitCode = 1;
    return null;
  }
};

/**
 * .what = the entrypoint a detached review warmer boots into
 * .why = the warmer must outlive `rhx review`, which returns in seconds while the
 *        next round arrives much later. only a child process holds a cadence across
 *        that gap, and it needs its own entrypoint.
 *
 * .note = it holds no lock. it beats its pid and its next wake into its prefix's
 *         watermark, and stamps the record ended on exit; a crash simply stops the
 *         beats, so the record lapses within one cadence.
 */
export const reviewWarmer = async (): Promise<void> => {
  // the read half of the argv contract `setReviewWarmerProcess` writes. no driver types
  // these flags: `rhx review` spawns the child with a plan already parsed by
  // `asReviewWarmerPlan`, so this reads the settled numbers, never the `--warmer` grammar
  const options = asWarmerArgsFromArgv({ argv: process.argv });

  // refuse a spawn that omitted a flag. the guard is a type predicate, so it also
  // narrows each option to its defined type for every line after this block
  if (!isWarmerArgvComplete(options) || options.unknown.length > 0) {
    // name only the unusable flags: in a detached process the message is the whole
    // diagnosis, and a list of all five hides which part of the spawn was wrong
    // (rule.require.errors-name-the-fix)
    const absent = getAllWarmerFlagsAbsent({ options });
    const malformed = getAllWarmerFlagsMalformed({ options });
    const unknown = options.unknown;

    // a malfunction, never a constraint: the caller is our own `rhx review`, so no
    // retyped input can clear it (rule.require.exit-code-semantics)
    emitReviewRefusal({
      kind: 'malfunction',
      // pluralized, never `flag(s)` (rule.forbid.snapshot-visual-blemishes)
      headline: `review._.warmer was spawned with ${asCountedNoun({ count: absent.length + malformed.length + unknown.length, one: 'flag', many: 'flags' })} it cannot use`,
      lines: [
        ...asWarmerFlagFaultLines({ absent, malformed, unknown }),
        '   ├─ usage',
        '   │  └─ review._.warmer --reviewer <slug> --log-dir <path> \\',
        '   │       --pokes <n> --every <minutes> --brain <choice>',
        // the fix names the spawn, since no driver types this command. it fits each
        // fault kind above — absent, malformed, unknown — since all three are the spawn's
        '   └─ fix: no driver types this — `rhx review` spawns it. a flag this',
        '      spawn could not use is a defect in that spawn, so name it in an',
        '      issue rather than a retry. see `rhx review --help` for the',
        '      `--warmer` grammar',
      ],
    });
    process.exit(1);
  }

  const cwd = process.cwd();
  const reviewer = options.reviewer;
  const plan = { pokes: options.pokes, everyMinutes: options.every };

  // the prefix this child keeps warm: the head in the log dir it was handed, and the
  // brain it was told to poke. it keys every watermark this warmer reads and writes
  const prefix = {
    head: await getOneReviewRunHead({ dir: options.logDir }),
    brain: options.brain,
  };

  // the first beat, before any spend: record this child's pid and its first wake, so
  // a round can name it and stop it. no hold outlives this one write
  // (rule.require.locks-via-with-simple-mutex)
  const boot = await setReviewWarmerBoot({
    cwd,
    reviewer,
    prefix,
    plan,
    pid: process.pid,
    now: CLOCK_OF_WALL.now(),
  }).then(
    () => null,
    (error: unknown) => {
      if (!isErrorOfWatermarkFault({ error })) throw error;
      return asErrorMessage({ error });
    },
  );
  if (boot !== null) {
    // the row lands in the ledger first, exactly as a brain-boot failure's does: detached,
    // stderr is ignored, so a warmer whose spawn printed a pid would otherwise leave no
    // trace of why it never poked. the ledger sits under the run's log dir, apart from
    // the watermark cache that refused the write, so it is still writable
    setOneWarmerRetireBeforeBegin(
      {
        cwd,
        reviewer,
        logDir: options.logDir,
        why: `the warmer could not record its lane, so it cost naught — ${boot}`,
      },
      { clock: CLOCK_OF_WALL },
    );

    // name the refusal (rule.require.errors-name-the-fix). a hand run or a test reads
    // it, and the spend is zero either way
    emitReviewRefusal({
      kind: 'malfunction',
      headline: 'review._.warmer could not record its lane, so it cost naught',
      lines: [
        `   ├─ reviewer: ${reviewer}`,
        ...asTreeCauseLines({ cause: boot }),
        '   └─ fix: the warmer watermark under this cwd could not be written. check',
        '      that the review cache dir is writable, then re-run the review',
      ],
    });
    process.exit(1);
  }

  try {
    // inside the try, so a failed boot still meets the finally and ends the record.
    // the catch is scoped to the BOOT alone: a fault inside the poke loop is the loop's
    // to record, and must never read as "could not boot". the pin is part of the
    // boot, so it sits inside the same scope — a pin refusal is recorded too
    const brain = await getOneWarmerBrainOrNull({
      cwd,
      reviewer,
      logDir: options.logDir,
      choice: options.brain,
    });

    // no brain: its refusal is already recorded, and the life ends here, clean — so it
    // still meets the end stamp below, never a bare return past it
    if (brain !== null)
      await setReviewWarmerPokes(
        {
          cwd,
          reviewer,
          plan,
          logDir: options.logDir,
          prefix,
          pid: process.pid,
        },
        { brain, clock: CLOCK_OF_WALL },
      );
  } catch (error: unknown) {
    // the life faulted: stamp the record ended, then let THIS fault stand — the end
    // stamp may never replace it (raised i010/r009); a stamp fault rides above it,
    // with this fault as its cause
    await setReviewWarmerEndOfLife({
      cwd,
      reviewer,
      prefix,
      life: { fault: error },
    });
    throw error;
  }

  // the life ended clean: stamp the record ended
  await setReviewWarmerEndOfLife({
    cwd,
    reviewer,
    prefix,
    life: null,
  });
};

/**
 * .what = stamps this warmer's record ended, only where it still names this warmer
 * .why = a later warmer of this prefix may have taken the name, and its record must stay
 *        live. a watermark fault is let pass — the record lapses on its own once its
 *        promised wake goes by
 * .note = 🔴 every other fault of the stamp is thrown, never swallowed (rule.forbid.failhide).
 *         where the life already faulted, the thrown error names both and chains the
 *         life's fault as its `cause`, so the stamp can never mask it (asWarmerEndStampFault)
 */
const setReviewWarmerEndOfLife = async (input: {
  cwd: string;
  reviewer: string;
  prefix: ReviewWarmerPrefix;
  life: { fault: unknown } | null;
}): Promise<void> =>
  setReviewWarmerEnd({
    cwd: input.cwd,
    reviewer: input.reviewer,
    prefix: input.prefix,
    pid: process.pid,
    now: CLOCK_OF_WALL.now(),
  }).catch((error: unknown) => {
    // a watermark fault lapses; any other fault throws, the life's fault chained beneath
    const thrown = asWarmerEndStampFault({
      stampFault: error,
      life: input.life,
    });
    if (thrown !== null) throw thrown.fault;
  });
