import type {
  ContextCliEmit,
  ContextGuardProgress,
} from '@src/domain.objects/Driver/ContextCliEmit';
import type { GuardProgressEvent } from '@src/domain.objects/Driver/GuardProgressEvent';

import {
  formatGuardReviewerTree,
  type ReviewerTreeState,
} from './formatGuardReviewerTree';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SPIN_MS = 80;

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
  let completedCount = 0;

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

    // cached judge
    if (!event.inflight && !event.outcome) {
      clearActive();
      completedCount++;
      seal(`   ${branch} ✓ ${label} - allowed (cached)`);
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
      completedCount++;
      const judge = event.outcome.judge;
      const allowed =
        judge && 'decision' in judge && judge.decision === 'allowed';
      const mark = allowed ? '✓' : '✗';
      const status = allowed ? 'allowed' : 'blocked';

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
    _position?: ContextGuardProgress,
  ) => {
    // require reviewer metadata for tree format
    if (!event.reviewer) {
      // fallback to legacy simple format if metadata absent
      handleLegacyReviewEvent(event, _position);
      return;
    }

    const { reviewer } = event;

    // cached review (no inflight, has outcome with review data)
    // .note = cached events carry outcome.review with blockers/nitpicks and outcome.path
    if (!event.inflight && event.outcome) {
      clearActive();
      completedCount++;
      const review = event.outcome.review;
      const state = asReviewerTreeState(
        reviewer,
        review,
        event.outcome.path,
        null, // no duration for cached reviews
      );
      // mark as cached for display
      if (state.state.type === 'finished') {
        state.state.cached = true;
      }
      const lines = formatGuardReviewerTree({
        reviewer: state,
        isLast: false,
        baseIndent: '   ',
      });
      // blank line before each reviewer for visual separation
      seal('   │');
      emitLines(lines);
      return;
    }

    // active review (inflight, no endedAt)
    if (event.inflight && !event.inflight.endedAt) {
      clearActive();
      const beganMs = new Date(event.inflight.beganAt).getTime();

      // blank line before each reviewer for visual separation
      seal('   │');

      // seal header line (permanent) - completed will skip header and emit details only
      // .note = show rounds + 1 because this round will consume the budget
      const displayBudget =
        reviewer.budget === Infinity ? '∞' : reviewer.budget;
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
    // .note = header already sealed at inflight start, so skip first line from tree
    if (event.inflight?.endedAt && event.outcome) {
      clearActive();
      const dur = computeDurationSec(event);
      completedCount++;

      const review = event.outcome.review;
      const state = asReviewerTreeState(
        reviewer,
        review,
        event.outcome.path,
        dur,
      );
      const lines = formatGuardReviewerTree({
        reviewer: state,
        isLast: false,
        baseIndent: '   ',
      });
      // skip first line (header) since it was sealed at inflight start
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
      completedCount++;
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
      completedCount++;
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
    clearActive();
    // blank line + terminator line to close the tree
    seal('   │');
    seal(`   └─ halted: ${input.reason}`);
  };

  return {
    context: { cliEmit: { onGuardProgress, onGuardHalted } },
    done: clearActive,
  };
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
 * .what = transforms review outcome to ReviewerTreeState
 * .why = maps event shape to shared formatter input shape
 */
const asReviewerTreeState = (
  reviewer: NonNullable<GuardProgressEvent['reviewer']>,
  review: NonNullable<GuardProgressEvent['outcome']>['review'],
  path: string | null,
  durationSec: string | null,
): ReviewerTreeState => {
  // malfunction state
  if (review && 'malfunction' in review) {
    return {
      index: reviewer.index,
      slug: reviewer.slug,
      level: reviewer.level,
      rounds: reviewer.rounds,
      budget: reviewer.budget,
      state: {
        type: 'malfunction',
        path: path ?? '',
      },
    };
  }

  // constraint state
  if (review && 'constraint' in review) {
    return {
      index: reviewer.index,
      slug: reviewer.slug,
      level: reviewer.level,
      rounds: reviewer.rounds,
      budget: reviewer.budget,
      state: {
        type: 'constraint',
        path: path ?? '',
      },
    };
  }

  // exhausted state
  if (review && 'exhausted' in review) {
    return {
      index: reviewer.index,
      slug: reviewer.slug,
      level: reviewer.level,
      rounds: reviewer.rounds,
      budget: reviewer.budget,
      state: {
        type: 'finished',
        verdict: 'exhausted',
        durationSec: null,
        blockers: review.blockers,
        nitpicks: review.nitpicks,
        path: path ?? '',
        cached: false,
      },
    };
  }

  // queued state
  if (review && 'queued' in review) {
    return {
      index: reviewer.index,
      slug: reviewer.slug,
      level: reviewer.level,
      rounds: reviewer.rounds,
      budget: reviewer.budget,
      state: { type: 'queued' },
    };
  }

  // finished state with blockers/nitpicks
  if (review && 'blockers' in review) {
    // compute verdict from blockers/nitpicks (default thresholds for now)
    const verdict: 'approved' | 'rejected' =
      review.blockers === 0 ? 'approved' : 'rejected';

    return {
      index: reviewer.index,
      slug: reviewer.slug,
      level: reviewer.level,
      rounds: reviewer.rounds,
      budget: reviewer.budget,
      state: {
        type: 'finished',
        verdict,
        durationSec: durationSec !== null ? parseFloat(durationSec) : null,
        blockers: review.blockers,
        nitpicks: review.nitpicks,
        path: path ?? '',
        cached: false,
      },
    };
  }

  // fallback: null review means approved with 0 counts
  return {
    index: reviewer.index,
    slug: reviewer.slug,
    level: reviewer.level,
    rounds: reviewer.rounds,
    budget: reviewer.budget,
    state: {
      type: 'finished',
      verdict: 'approved',
      durationSec: durationSec !== null ? parseFloat(durationSec) : null,
      blockers: 0,
      nitpicks: 0,
      path: path ?? '',
      cached: false,
    },
  };
};
