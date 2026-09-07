/**
 * .what = cli entrypoint for the telepath elucidate.summary skill
 * .why = enables shell invocation via package-level import, isolated on its own cli
 *        subpath so the onStop hook loads minimal modules
 *        (rule.require.isolated-cli-subpath-exports)
 *
 * 🔴 on stop, remind the brain to elucidate + condense its summary. that is the whole
 *    job. it grades naught — the judgment "did the concept transfer?" belongs to the
 *    brain that holds the context, and a deterministic verdict over a judgment is a
 *    fake tool (rule.always.entool-the-skills-you-touch).
 *
 * 🟡 it fires at Stop because Stop is the last moment before rest, and the reflexive
 *    pass is exactly the pass a brain skips there (rule.require.reflexive-condensation).
 *
 * 🟡 and it fires only when the READER has gone cold — when no human has spoken for
 *    READER_MEMORY_WARM_MS. the throttle models the human's memory of the tree rather
 *    than the nudge's own cadence, so an AUTONOMOUS stretch is what earns a summary and
 *    a live back-and-forth does not (seed S33).
 */

import { BadRequestError } from 'helpful-errors';

import { getInvocationArgs } from '../../domain.operations/cli/getInvocationArgs';
import { getLastHumanUtterance } from '../../domain.operations/telepath/getLastHumanUtterance';
import { isReaderMemoryWarm } from '../../domain.operations/telepath/isReaderMemoryWarm';

/**
 * .what = the --when value from argv, in either the `--when x` or `--when=x` form
 * .why = the harness prepends --skill/--role/--repo, so a scan for the flag by name is
 *        what reads the caller's intent without a parse of the whole argv
 */
const asWhen = (args: string[]): string | null => {
  const combined = args.find((arg) => arg.startsWith('--when='));
  if (combined) return combined.slice('--when='.length);
  const index = args.indexOf('--when');
  return index === -1 ? null : (args[index + 1] ?? null);
};

/**
 * .what = validate the --when value; the only hook context here is hook.onStop
 * .why = the value is boundary-qualified — `onStop`, of WHAT? of a hook. a bare
 *        `onStop` reads as a value on an undeclared axis, and the same skill in the
 *        learner role already spells it `hook.onStop`
 *
 * 🟡 a WRONG value must fail loud, never fall through to the by-hand face. that
 *    fall-through is what let two live hooks disagree unnoticed: a stale `--when
 *    onStop` would silently become the by-hand face, exit 0, and hold no stop —
 *    a hook that no longer fires and reports success (rule.forbid.failhide)
 */
const asWhenValue = (value: string | null): 'hook.onStop' | null => {
  if (value === null) return null;
  if (value === 'hook.onStop') return 'hook.onStop';
  const shown = value === '' ? '(empty)' : value;
  throw new BadRequestError(
    `invalid --when: ${shown}. only 'hook.onStop' is supported`,
    { when: value },
  );
};

/**
 * .what = the two facts the hook face needs out of the Stop payload
 * .why = `stop_hook_active` is the platform's own loop guard, so the reminder fires once
 *        per turn with no state file of its own. `transcript_path` is what makes the
 *        throttle a model of the READER rather than a clock — it is how the hook learns
 *        when a human last spoke (seed S33)
 *
 * 🟡 the two faults fall in OPPOSITE directions, and each direction is the safe one for
 *    its field:
 *      - an unreadable payload → `continuation: true`, so a stop is never held on the
 *        hook's own bad input. a guard that blocks a session because it could not read
 *        stdin is a far worse defect than a reminder that did not fire
 *      - an absent `transcript_path` → `null`, which reads as a COLD reader downstream,
 *        so the nudge fires. a throttle that silences on its own bad input would be
 *        indistinguishable from a hook that works (rule.forbid.failhide)
 */
const getStopPayload = async (): Promise<{
  continuation: boolean;
  transcriptPath: string | null;
}> => {
  const raw = await (async (): Promise<string | null> => {
    // the wrapper captures harness stdin into RHACHET_STDIN to work around node -e
    // stdin inheritance (the pattern memory.guard and route.bounce already use)
    const envStdin = process.env.RHACHET_STDIN;
    if (envStdin !== undefined) return envStdin;
    if (process.stdin.isTTY) return null;
    // .note = deliberate mutation: accumulate stdin chunks as they stream in
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf-8');
  })();
  if (raw === null || raw.trim() === '')
    return { continuation: true, transcriptPath: null };

  try {
    const payload: { stop_hook_active?: unknown; transcript_path?: unknown } =
      JSON.parse(raw);
    return {
      continuation: payload.stop_hook_active === true,
      transcriptPath:
        typeof payload.transcript_path === 'string'
          ? payload.transcript_path
          : null,
    };
  } catch {
    return { continuation: true, transcriptPath: null };
  }
};

/**
 * .what = the reminder, to stderr
 * .why = stderr, never stdout, per rule.forbid.stdout-on-exit-errors — cli hooks
 *        surface stderr on a non-zero exit
 *
 * 🟡 it asks for SUBSTANCE before DENSITY, and the order is the whole fix.
 *
 *    the first draft asked only for density — condense, elevate, star, rehome. every
 *    one grades HOW a summary reads and not one grades WHAT it holds, so a dense
 *    recap of the last two rounds satisfied it perfectly.
 *
 *    measured 2026-09-06: it fired on three consecutive turns, each answer got
 *    denser, and the wisher still had to ask *"what is the total vision and where
 *    are we?"*
 *
 * ⇒ a bar the wrong artifact can clear is a bar one notch too coarse — the same
 *   defect `rule.require.enumerate-before-you-name` names, applied to a rule's
 *   own scope rather than to a word
 *
 * 🟡 it must TEACH the shape, and it must not SHOUT it. the two are separable, and
 *    a first repair conflated them — collapsed to 5 lines, which the wisher
 *    rejected at once: *"that makes the hook not do anything."*
 *
 *    the volume was never the length. three cuts took it out and left the teaching:
 *      - ALL-CAPS emphasis → lowercase. `rule.forbid.shouts` already forbade it
 *      - an imperative header → an invitation. *"say it dense"* → *"say where we stand"*
 *      - the 6-line canon path list, dropped. those briefs are BOOTED, so to
 *        re-list them each turn ranks below `reflexive-condensation`'s own bar
 *
 * ⇒ a reminder to be dense that is itself 30 shouted lines has refuted itself; one
 *   that teaches naught has forfeited its reason to fire. the seam is TONE, not SIZE.
 */
const emitReminder = (): void => {
  const emit = (line: string): void => console.error(line);
  emit('🦉 before you rest, say where we stand');
  emit('');
  emit('🔮 elucidate.summary --when hook.onStop');
  emit('   │');
  emit('   ├─ the substance — first, and it is the half a recap skips');
  emit('   │  ├─ 1. what  · the subject, or the answer, in one line');
  emit('   │  ├─ 2. why   · why it matters to them');
  emit('   │  ├─ 3. where · where it stands — what holds, what is open');
  emit('   │  └─ 4. next  · the move that follows, if there is one');
  emit('   │');
  emit('   ├─ the density — then say that in the fewest words');
  emit('   │  ├─ 5. condense — cut every line not 95%+ worth its place');
  emit('   │  ├─ 6. elevate  — lead with the answer, one point per line');
  emit('   │  ├─ 7. star     — ⭐ before your ask, if you have one');
  emit(
    "   │  └─ 8. rehome   — the road you walked → .agent/.notes/, ref'd by path",
  );
  emit('   │');
  emit('   ├─ the why');
  emit(
    '   │  ├─ they read it once. a point they cannot find is a point you did not',
  );
  emit('   │  │  make, and an ask they scan past is an ask you never made');
  emit('   │  └─ a trajectory is not a state. what changed since last turn is');
  emit('   │     archaeology — condense that and they still cannot act on it');
  emit('   │');
  emit('   └─ 🪷 substance first, density second — then rest');
};

/**
 * .what = emit the --help usage to stdout
 * .why = every user-faced op explains itself on demand; help is not an error, so it
 *        goes to stdout and exits 0 (rule.require.help-on-demand)
 */
const emitHelp = (): void => {
  const emit = (line: string): void => console.log(line);
  emit('🦉 say it clear, say it dense');
  emit('');
  emit('🔮 elucidate.summary');
  emit('');
  emit('  usage:');
  emit(
    '    elucidate.summary --when hook.onStop  # hook face: the reminder, exit 2',
  );
  emit(
    '    elucidate.summary                     # by hand: the same reminder, exit 0',
  );
  emit('    elucidate.summary --help | -h         # this help');
  emit('');
  emit('  the hook face fires only when the reader has gone cold:');
  emit('    ├─ a human spoke < 5m ago → warm, they hold the state → rest');
  emit('    └─ no human for 5m+       → an autonomous stretch → the reminder');
  emit(
    '       └─ it reads the stop payload transcript; by hand is never throttled',
  );
  emit('');
  emit('  exits:');
  emit(
    '    ├─ 0 → by hand, a hook continuation, a warm reader, or an unreadable payload',
  );
  emit('    └─ 2 → holds the stop open, so the summary can be re-emitted');
  emit('');
  emit(
    '  --when values: hook.onStop (only) — a wrong value exits 2, never silent',
  );
};

/**
 * .what = cli entrypoint for the telepath elucidate.summary skill
 * .why = on stop, remind the brain to elucidate + condense its summary
 *
 * exits 0 on a hook continuation, an unreadable payload, or after --help
 * exits 2 to hold the stop open with the reminder (never a write to the repo)
 */
export const elucidateSummary = async (): Promise<void> => {
  // NEVER slice(2) here: the wrapper execs `node -e`, which puts NO file path at
  // argv[1], so a fixed slice eats the caller's first flag and --when hook.onStop reads as
  // absent. getInvocationArgs carries that offset for every cli in this repo
  const args = getInvocationArgs(process.argv);

  if (args.some((arg) => ['--help', '-h'].includes(arg.split('=')[0]!))) {
    emitHelp();
    return;
  }

  // a bad --when is a caller-constraint, not a malfunction — exit 2, not 1
  // (rule.require.exit-code-semantics). allowlist BadRequestError only; any other
  // throw propagates to the wrapper's exit-1 backstop (no failhide)
  const when = ((): 'hook.onStop' | null => {
    try {
      return asWhenValue(asWhen(args));
    } catch (error) {
      if (!(error instanceof BadRequestError)) throw error;
      console.error(error.message);
      return process.exit(2);
    }
  })();

  // by hand — the same reminder, exit 0. the reminder is the ARTIFACT of this skill,
  // so it renders on every invocation; only the HOOK face holds a stop open.
  //
  // 🟡 the by-hand face is NEVER throttled: a caller who typed the command asked to see
  //    the reminder, so a silent exit would read as a broken skill
  if (when === null) {
    emitReminder();
    return;
  }

  // the hook face: the platform's own loop guard, so the reminder fires once per turn
  const payload = await getStopPayload();
  if (payload.continuation) return;

  // ...and then the throttle, which is a model of the READER rather than a clock. a
  // human who spoke within the window still holds the state, so a summary would tell
  // them what they know; one who has been away has lost the thread and is owed it.
  //
  // 🟡 so an AUTONOMOUS stretch is what earns the nudge. the naive throttle would key
  //    off the nudge's own last fire, which suppresses it exactly when the reader has
  //    been gone longest (seed S33)
  const warm = isReaderMemoryWarm({
    spokeAt: payload.transcriptPath
      ? await getLastHumanUtterance({ transcriptPath: payload.transcriptPath })
      : null,
    now: new Date(),
  });
  if (warm) return;

  emitReminder();
  process.exit(2);
};
