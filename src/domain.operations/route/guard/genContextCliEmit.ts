import type {
  ContextCliEmit,
  ContextGuardProgress,
} from '@src/domain.objects/Driver/ContextCliEmit';
import type { GuardProgressEvent } from '@src/domain.objects/Driver/GuardProgressEvent';

import { asMeterCountDisplay } from './asMeterCountDisplay';
import { genReviewWaveBuffer } from './review/genReviewWaveBuffer';
import { computeReviewPeerVerdict } from './review/peer/meter/computeReviewPeerVerdict';
import { getReviewedJudgeThresholds } from './review/peer/meter/getReviewedJudgeThresholds';
import {
  formatGuardReviewerTree,
  type ReviewerTreeState,
} from './tree/formatGuardReviewerTree';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SPIN_MS = 80;

/**
 * .what = the tallier a live-progress reviewer row defaults to
 * .why = live progress events predate the persisted `tallied` footer, so they cannot know a
 *        reviewer's real tallier — the `tallied by reviewer@…` marker only appears in the FINAL
 *        guard tree (formatGuardTree, from artifacts). one shared default keeps the three
 *        in-flight/legacy build sites in lockstep (rule.forbid.duplicate-format-tree-operations).
 */
const DEFAULT_TALLIER_FOR_INFLIGHT = 'deterministic' as const;

/**
 * .what = creates a ContextCliEmit that drives stderr progress output as tree
 * .why = enables live feedback via spinner under owl header as guards execute
 */
export const genContextCliEmit = (input: {
  stderr: NodeJS.WriteStream;
}): { context: ContextCliEmit; done: () => void } => {
  const isTty = input.stderr.isTTY ?? false;
  let activeInterval: ReturnType<typeof setInterval> | null = null;
  let lastLineLen = 0;

  // clear active spinner interval
  const clearActive = () => {
    if (activeInterval) {
      clearInterval(activeInterval);
      activeInterval = null;
    }
  };

  // overwrite the last stderr line via \r (tty) or print a new line (non-tty)
  const overwrite = (text: string) => {
    if (isTty) {
      const padded = text.padEnd(lastLineLen);
      input.stderr.write(`\r${padded}`);
      lastLineLen = text.length;
    } else {
      input.stderr.write(`${text}\n`);
      lastLineLen = 0;
    }
  };

  // finalize the last line: overwrite + newline (tty) or just print (non-tty)
  const seal = (text: string) => {
    if (isTty) {
      const padded = text.padEnd(lastLineLen);
      input.stderr.write(`\r${padded}\n`);
      lastLineLen = 0;
    } else {
      input.stderr.write(`${text}\n`);
    }
  };

  // emit multiple lines to stderr (for tree output)
  const emitLines = (lines: string[]) => {
    clearActive();
    for (const line of lines) {
      seal(line);
    }
  };

  // determine branch character based on position (├─ for intermediate, └─ for last)
  const getBranch = (position?: ContextGuardProgress): string => {
    if (!position) return '└─';
    return position.index < position.total - 1 ? '├─' : '└─';
  };

  // ── the level wave — one status line, blocks released in DECLARED order ──
  // .why = under a concurrent pour two lanes settle in a race. the live stream is
  //        handed process.stdout (route.ts:980), so it is captured by every peer
  //        acceptance snapshot — a settle-order append would make 36 snapshots a
  //        coin flip. so a settled block is buffered and released once every
  //        earlier lane in its level has landed. see fulcrum F9.
  // .note = the wave's STATE lives in its own unit; this file keeps only the i/o.
  //         so the release policy and the status display evolve apart — the seam
  //         a single mixed closure refused (i001/r4 nitpick.2,
  //         `rule.prefer.decomposable-architecture`)
  const wave = genReviewWaveBuffer();

  // the ONE line that moves, always last
  // .why = the wisher's three constraints (seed S2): "we can only overwrite the
  //        last line in a review spinner" · "we require the spinner to say how
  //        long all has been inflight" · "we want to know how many are left too"
  // .note = the tail status line does NOT wait. `done` ticks the instant a lane
  //         settles, so an onlooker sees the COUNT move before they see the block
  const drawStatus = () => {
    clearActive();
    // 🔴 no status line at all under a pipe — a DELIBERATE deviation from the
    //    vision, which predicted one appended line per tick
    // .why = the vision reasoned from `overwrite`'s non-tty fallback (:52-55)
    //        without the interval that calls it: every spinner in this file is
    //        already `if (isTty)` gated, so no interval has ever fired under a
    //        pipe. to append per tick here would make the wave status the ONE
    //        spinner that spams a piped log
    // .why = the arithmetic settles it. SPIN_MS is 80ms and the review timeout
    //        is PT21M, so one level could append ~15,750 status lines to a CI
    //        log — for a value that is a spinner, and so differs every run
    // .note = the information is not lost. the settled BLOCKS still emit, whole
    //         and in declared order, byte-identical to the tty case. only the
    //         animation is suppressed, which is what `[case2]` actually needs
    //
    // 🔴 .note = it is suppressed, never SILENT. `runStoneGuardReviews` announces
    //         each level's roster on genuine stderr at the pour, once, before any
    //         lane launches — so a piped log states that the level began and which
    //         lanes are in it, and a reader can part "this level is slow" from
    //         "this level never began". raised i009/r10 point 1, where the
    //         tradeoff above had been priced as a binary (spam vs silence) and a
    //         third O(1) option was never weighed
    //
    // 🔴 .note = the announce does NOT live here, deliberately. `route.ts:980`
    //         hands this emit `process.stdout`, so any byte written here is
    //         captured by 36 frozen peer snapshots — and a per-lane announce on
    //         this path is also a settle RACE, since a lane that contends only
    //         for the level slot launches ahead of a grouped one. both were
    //         measured: the pour site has the roster in DECLARED order before any
    //         launch, and writes to a stream no oracle reads
    if (!isTty) return;
    if (wave.status().inflight === 0) return;
    const beganMs = wave.status().beganMs ?? Date.now();
    let frameIdx = 0;
    activeInterval = setInterval(() => {
      const sec = ((Date.now() - beganMs) / 1000).toFixed(1);
      const frame = FRAMES[frameIdx % FRAMES.length]!;
      frameIdx++;
      const now = wave.status();
      overwrite(
        `   └─ ${frame} ${now.inflight} inflight · ${now.done} done · ${now.left} left · ${sec}s`,
      );
    }, SPIN_MS);
  };

  // release every block still buffered, whatever the cursor is owed
  // .why = a lane that throws lands no block, so the cursor would stall on it
  //        forever and every block behind it would be lost
  const flushRest = () => {
    for (const block of wave.drain()) emitLines(block);
  };

  const onGuardProgress = (
    event: GuardProgressEvent,
    position?: ContextGuardProgress,
  ) => {
    // judge events retain simple format
    if (event.step.phase === 'judge') {
      handleJudgeEvent(event, position);
      return;
    }

    // review events require full tree format via shared formatter
    handleReviewEvent(event, position);
  };

  /**
   * .what = handles judge progress events with simple format
   * .why = judges show allowed|blocked decision, no tree needed
   */
  const handleJudgeEvent = (
    event: GuardProgressEvent,
    position?: ContextGuardProgress,
  ) => {
    const num = event.step.index + 1;
    const label = `judge.${num}`;
    const branch = getBranch(position);

    // cached judge (inflight null); outcome may carry the allowed|blocked decision
    // .note = cached judge events now include outcome for parity with cached reviews,
    //         so match on !inflight (not !outcome) or the tree is left unclosed
    if (!event.inflight) {
      clearActive();
      const judge = event.outcome?.judge ?? null;
      const { mark, status } = asJudgeLiveMarkStatus(judge);
      // blank line before judge for visual separation (match completed judge)
      seal('   │');
      seal(`   ${branch} ${mark} ${label} - ${status} (cached)`);
      return;
    }

    // active judge (spinner)
    if (event.inflight && !event.inflight.endedAt) {
      clearActive();
      const beganMs = new Date(event.inflight.beganAt).getTime();
      if (isTty) {
        let frameIdx = 0;
        activeInterval = setInterval(() => {
          const sec = ((Date.now() - beganMs) / 1000).toFixed(1);
          const frame = FRAMES[frameIdx % FRAMES.length]!;
          frameIdx++;
          overwrite(`   ${branch} ${frame} ${label} - inflight ${sec}s`);
        }, SPIN_MS);
      }
      return;
    }

    // completed judge
    if (event.inflight?.endedAt && event.outcome) {
      clearActive();
      const dur = computeDurationSec(event);
      const { mark, status } = asJudgeLiveMarkStatus(event.outcome.judge);

      // blank line before judge for visual separation
      seal('   │');
      seal(`   ${branch} ${mark} ${label} - ${status} ${dur}s`);
    }
  };

  /**
   * .what = handles review progress events with full tree format
   * .why = reviews show verdict, blockers, nitpicks, path via shared formatter
   */
  const handleReviewEvent = (
    event: GuardProgressEvent,
    position?: ContextGuardProgress,
  ) => {
    // require reviewer metadata for tree format
    if (!event.reviewer) {
      // fallback to legacy simple format if metadata absent
      handleLegacyReviewEvent(event, position);
      return;
    }

    const { reviewer } = event;

    // the reviewer's DECLARED slot within its level, and the level's member count
    // .note = read off the EVENT, never off `position` — `setStoneAsPassed` wraps
    //         `cliEmit` and replaces the second argument with the guard-wide step
    //         position, so a roster passed there never arrives
    // .note = a caller that supplies no slot has handed no roster, so no order
    //         can be imposed — it falls through to the un-buffered emit this path
    //         had before concurrency, header sealed at inflight
    const slot = reviewer.slot ?? null;

    // open this LEVEL's wave, and flush whatever an unspent prior wave left
    // .why = `begin` keys on the level rather than on a spent cursor, so a prior
    //        wave a mid-flight throw cut short cannot absorb this level's blocks.
    //        its orphans come back here rather than vanish
    // .note = the orphan list is empty on every path this repo can reach today —
    //         each member of a level settles, cached and exhausted alike — so no
    //         snapshot observes this loop
    if (slot)
      for (const orphan of wave.begin({
        level: reviewer.level,
        total: slot.total,
      }))
        emitLines(orphan);

    // buffer one reviewer's WHOLE block, then release what the cursor is owed
    // .why = the header used to seal at inflight and the detail at finish, so two
    //        lanes interleaved as `header r1 · header r2 · body r1 · body r2` and
    //        r1's verdict printed under r2's header
    const settle = (lines: string[]) => {
      const block = ['   │', ...lines];
      if (!slot) {
        emitLines(block);
        return;
      }
      for (const released of wave.settle({ slot: slot.index, block }))
        emitLines(released);
      drawStatus();
    };

    // derive the guard's reviewed? thresholds so the live verdict matches the
    // final tree's authoritative computeReviewPeerVerdict (single source of truth)
    const thresholds = getReviewedJudgeThresholds({
      judges: event.stone.guard?.judges ?? [],
    }) ?? { allowBlockers: 0, allowNitpicks: 0 };

    // cached review (no inflight, has outcome with review data)
    // .note = cached events carry outcome.review with blockers/nitpicks and outcome.path
    if (!event.inflight && event.outcome) {
      const review = event.outcome.review;
      const state = asReviewerTreeState(
        reviewer,
        review,
        event.outcome.path,
        null, // no duration for cached reviews
        thresholds,
      );
      // mark as cached for display
      if (state.state.type === 'finished') {
        state.state.cached = true;
      }
      settle(
        formatGuardReviewerTree({
          reviewer: state,
          isLast: false,
          baseIndent: '   ',
        }),
      );
      return;
    }

    // active review (inflight, no endedAt)
    // .note = a slotted lane seals NO header here. its block is released whole at
    //         finish, so a co-member cannot land its detail under this header
    if (event.inflight && !event.inflight.endedAt) {
      const beganMs = new Date(event.inflight.beganAt).getTime();

      if (slot) {
        wave.launch({ slot: slot.index, beganMs });

        drawStatus();
        return;
      }

      clearActive();

      // blank line before each reviewer for visual separation
      seal('   │');

      // seal header line (permanent) - completed will skip header and emit details only
      // .note = show rounds + 1 because this round will consume the budget
      //
      // 🟡 .hazard = THE TWO EMIT PATHS DISAGREE HERE, AND THEY DO SO ON PURPOSE.
      //         a malfunction or a constraint consumes no round, so this optimistic
      //         header renders `1/5` where the guard tree renders the authoritative
      //         `0/5`. the slotted path above carries no such gap — it seals no header
      //         at inflight, so its block is built from the SETTLED round.
      //
      //         ⇒ and the repair is NOT to drop the `+ 1`. this path never reprints its
      //         header, so a header without it would read `0/5` forever — even for a
      //         review that ran and did consume its round. that trades a misreport on
      //         two verdict kinds for a misreport on every one of them.
      //
      //         ⇒ so the optimism stays on this path, and the guard tree stays the
      //         authority for what a round actually cost. raised i003/r009
      //
      //         ✅ .clamped = `genContextCliEmit.test.ts [case11]` pins BOTH halves in
      //         one given — `1/5` here, `0/5` on the slotted path — so an editor who
      //         reads this `+ 1` as a defect and pins one side in isolation goes red
      //         beside this reason rather than in a suite they never open. the prose
      //         above stood alone until i033/r9, and prose is not a test
      const displayBudget = asMeterCountDisplay(reviewer.budget);
      const roundsAfter = reviewer.rounds + 1;
      const header = `r${reviewer.index}: ${reviewer.slug} (l${reviewer.level}, ${roundsAfter}/${displayBudget})`;
      seal(`   ├─ ${header}`);

      // tty mode: spinner on status line
      if (isTty) {
        let frameIdx = 0;
        activeInterval = setInterval(() => {
          const sec = ((Date.now() - beganMs) / 1000).toFixed(1);
          const frame = FRAMES[frameIdx % FRAMES.length]!;
          frameIdx++;
          overwrite(`   │     └─ ${frame} inflight ${sec}s`);
        }, SPIN_MS);
      }
      return;
    }

    // completed review (has endedAt and outcome)
    if (event.inflight?.endedAt && event.outcome) {
      const dur = computeDurationSec(event);
      const review = event.outcome.review;
      const state = asReviewerTreeState(
        reviewer,
        review,
        event.outcome.path,
        dur,
        thresholds,
      );
      const lines = formatGuardReviewerTree({
        reviewer: state,
        isLast: false,
        baseIndent: '   ',
      });

      if (slot) {
        settle(lines);
        return;
      }

      // un-slotted: the header sealed at inflight start, so skip it here
      clearActive();
      emitLines(lines.slice(1));
    }
  };

  /**
   * .what = handles review events without reviewer metadata (legacy path)
   * .why = backward compatibility for events emitted before metadata addition
   */
  const handleLegacyReviewEvent = (
    event: GuardProgressEvent,
    position?: ContextGuardProgress,
  ) => {
    const num = event.step.index + 1;
    const label = `review.${num}`;
    const branch = getBranch(position);

    // cached
    if (!event.inflight && !event.outcome) {
      clearActive();
      seal(`   ${branch} ✓ ${label} - completed (cached)`);
      return;
    }

    // active
    if (event.inflight && !event.inflight.endedAt) {
      clearActive();
      const beganMs = new Date(event.inflight.beganAt).getTime();
      if (isTty) {
        let frameIdx = 0;
        activeInterval = setInterval(() => {
          const sec = ((Date.now() - beganMs) / 1000).toFixed(1);
          const frame = FRAMES[frameIdx % FRAMES.length]!;
          frameIdx++;
          overwrite(`   ${branch} ${frame} ${label} - inflight ${sec}s`);
        }, SPIN_MS);
      }
      return;
    }

    // completed
    if (event.inflight?.endedAt && event.outcome) {
      clearActive();
      const dur = computeDurationSec(event);
      const review = event.outcome.review;
      const malfunctioned = review && 'malfunction' in review;
      const mark = malfunctioned ? '💥' : '✓';
      const status = malfunctioned ? 'malfunctioned' : 'completed';
      seal(`   ${branch} ${mark} ${label} - ${status} ${dur}s`);
    }
  };

  /**
   * .what = emits a tree terminator when guard halts early
   * .why = closes the tree visually when no judge follows reviews
   */
  const onGuardHalted = (input: { reason: string }) => {
    flushRest();
    clearActive();
    // blank line + terminator line to close the tree
    seal('   │');
    seal(`   └─ halted: ${input.reason}`);
  };

  return {
    context: { cliEmit: { onGuardProgress, onGuardHalted } },
    done: () => {
      flushRest();
      clearActive();
    },
  };
};

/**
 * .what = maps a judge outcome to its live-tree mark + status word
 * .why = a malfunctioned judge must read as `💥 malfunction`, never `✗ blocked` — the
 *        peer side already softens a broken reviewer this way (asReviewerTreeState), and a
 *        bare "blocked" on a forgiven judge contradicts the persisted tree's
 *        `overruled ✓ — forgiven by human`. shared by the cached + completed branches so
 *        both read alike (rule.forbid.duplicate-format-tree-operations).
 * .note = the live event never carries the overrule (a human action on a halted stone), so
 *         it renders the factual verdict only; the persisted tree renders the forgiveness.
 */
const asJudgeLiveMarkStatus = (
  judge: NonNullable<GuardProgressEvent['outcome']>['judge'],
): { mark: string; status: string } => {
  if (judge && 'malfunction' in judge)
    return { mark: '💥', status: 'malfunction' };
  const allowed =
    !judge || ('decision' in judge && judge.decision === 'allowed');
  return { mark: allowed ? '✓' : '✗', status: allowed ? 'allowed' : 'blocked' };
};

/**
 * .what = computes duration in seconds from a completed progress event
 * .why = derives display duration from event timestamps
 */
const computeDurationSec = (event: GuardProgressEvent): string => {
  if (!event.inflight?.endedAt) return '0.0';
  const beganMs = new Date(event.inflight.beganAt).getTime();
  const endedMs = new Date(event.inflight.endedAt).getTime();
  return ((endedMs - beganMs) / 1000).toFixed(1);
};

/**
 * .what = the identity fields every `ReviewerTreeState` carries, whatever its state
 * .why = these five plus `overruled` were spelled out in EVERY branch of
 *        `asReviewerTreeState` below — five copies of one fact, each with the same
 *        two-line comment. a repair to the identity read (the declared-index fix was
 *        exactly one) had to land in all five, and a branch missed by the sweep would
 *        render a reviewer under the wrong rung with no diff to see
 *        (rule.forbid.duplicate-format-tree-operations, raised i019/r001).
 *
 * 🔴 .why `overruled` is always false here = a live-progress event never carries an
 *    overrule, which is a human action on a HALTED stone. the inflight tree is therefore
 *    always un-forgiven, and the persisted tree is what renders the forgiveness. said
 *    once, that reads as a property of the event source rather than a per-branch remark.
 */
const asReviewerTreeIdentity = (
  reviewer: NonNullable<GuardProgressEvent['reviewer']>,
): Pick<
  ReviewerTreeState,
  'index' | 'slug' | 'level' | 'rounds' | 'budget' | 'overruled'
> => ({
  index: reviewer.index,
  slug: reviewer.slug,
  level: reviewer.level,
  rounds: reviewer.rounds,
  budget: reviewer.budget,
  overruled: false,
});

/**
 * .what = transforms review outcome to ReviewerTreeState
 * .why = maps event shape to shared formatter input shape
 *
 * .note = it is an ADAPTER, never a second formatter. both this and
 *         `asReviewerTreeStateFromMeter` feed the ONE shared renderer
 *         (`formatGuardReviewerTree`), and both derive their verdict from the ONE
 *         shared `computeReviewPeerVerdict`. what differs is only the upstream shape —
 *         a live event here, a persisted meter there.
 */
const asReviewerTreeState = (
  reviewer: NonNullable<GuardProgressEvent['reviewer']>,
  review: NonNullable<GuardProgressEvent['outcome']>['review'],
  path: string | null,
  durationSec: string | null,
  thresholds: { allowBlockers: number; allowNitpicks: number },
): ReviewerTreeState => {
  // 🔴 read ONCE, above every branch — never inside one.
  // .why = a `{ disputed, blockers, nitpicks }` outcome structurally satisfies the
  //        `'blockers' in review` branch below, so when that member was added the compiler
  //        flagged NOTHING and the flag was dropped on the one path that carries it. that is the
  //        same silent absorption `RouteStoneGuardBlockerType` suffered — a cascade with a
  //        default tail closes over no union. one read at the top leaves no branch to forget it.
  const skippedByDispute = !!review && 'disputed' in review;

  // malfunction state
  if (review && 'malfunction' in review) {
    return {
      ...asReviewerTreeIdentity(reviewer),
      skippedByDispute,
      state: {
        type: 'malfunction',
        path: path ?? '',
      },
    };
  }

  // constraint state
  if (review && 'constraint' in review) {
    return {
      ...asReviewerTreeIdentity(reviewer),
      skippedByDispute,
      state: {
        type: 'constraint',
        path: path ?? '',
      },
    };
  }

  // exhausted state
  if (review && 'exhausted' in review) {
    return {
      ...asReviewerTreeIdentity(reviewer),
      skippedByDispute,
      state: {
        type: 'finished',
        verdict: 'exhausted',
        durationSec: null,
        // a live-progress event carries no stance corpus of its own — `disputed: 0` here,
        // never a folded value. the persisted tree (asReviewerTreeStateFromMeter) is the one
        // that reads the meter's live disputed count
        blockers: { disputed: 0, reported: review.blockers },
        nitpicks: { disputed: 0, reported: review.nitpicks },
        path: path ?? '',
        cached: false,
        tallier: DEFAULT_TALLIER_FOR_INFLIGHT,
      },
    };
  }

  // queued state
  if (review && 'queued' in review) {
    return {
      ...asReviewerTreeIdentity(reviewer),
      skippedByDispute,
      state: { type: 'queued' },
    };
  }

  // finished state with blockers/nitpicks
  if (review && 'blockers' in review) {
    // compute verdict via the authoritative computeReviewPeerVerdict, with the
    // guard's real reviewed? thresholds — NOT a naive `blockers === 0` shortcut.
    // .why = the live-progress tree must agree with the final guard tree, which
    //        already derives its verdict this way. a hardcoded shortcut renders a
    //        threshold-permitted reviewer as 'rejected' live but 'approved' final —
    //        a single-source-of-truth breach visible within one stdout.
    // .note = the review ran (exit 0 with counts), so exitClass='passed' and
    //         wasExhausted=false; the result is only ever 'approved' | 'rejected'.
    const verdict = computeReviewPeerVerdict({
      rounds: reviewer.rounds,
      budget: reviewer.budget,
      blockers: review.blockers,
      nitpicks: review.nitpicks,
      allowBlockers: thresholds.allowBlockers,
      allowNitpicks: thresholds.allowNitpicks,
      exitClass: 'passed',
      wasExhausted: false,
    }) as 'approved' | 'rejected';

    return {
      ...asReviewerTreeIdentity(reviewer),
      skippedByDispute,
      state: {
        type: 'finished',
        verdict,
        durationSec: durationSec !== null ? parseFloat(durationSec) : null,
        // a live-progress event carries no stance corpus of its own — see the exhausted
        // branch above
        blockers: { disputed: 0, reported: review.blockers },
        nitpicks: { disputed: 0, reported: review.nitpicks },
        path: path ?? '',
        cached: false,
        tallier: DEFAULT_TALLIER_FOR_INFLIGHT,
      },
    };
  }

  // fallback: null review means approved with 0 counts
  //
  // ⚠️ this branch respelled all six identity fields inline — the SIXTH copy the
  //    extraction above exists to kill, and it was missed because the sweep ran
  //    over the five branches that already returned a state object. so the very
  //    defect the leaf prevents (a branch a later identity change skips) had a
  //    live instance in the same file. raised i032/r10
  return {
    ...asReviewerTreeIdentity(reviewer),
    skippedByDispute,
    state: {
      type: 'finished',
      verdict: 'approved',
      durationSec: durationSec !== null ? parseFloat(durationSec) : null,
      blockers: { disputed: 0, reported: 0 },
      nitpicks: { disputed: 0, reported: 0 },
      path: path ?? '',
      cached: false,
      tallier: DEFAULT_TALLIER_FOR_INFLIGHT,
    },
  };
};
