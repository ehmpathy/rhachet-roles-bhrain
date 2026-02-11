import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import type { GuardProgressEvent } from '@src/domain.objects/Driver/GuardProgressEvent';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SPIN_MS = 80;

/**
 * .what = creates a ContextCliEmit that drives stderr progress output
 * .why = enables live feedback via spinner + result lines as guards execute
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

  // print a detail line below the result
  const detail = (text: string) => {
    input.stderr.write(`${text}\n`);
  };

  const onGuardProgress = (event: GuardProgressEvent) => {
    const label =
      event.step.phase === 'review'
        ? `r${event.step.index + 1}`
        : `j${event.step.index + 1}`;

    // handle active step (started but not yet done)
    if (event.inflight && !event.inflight.endedAt) {
      clearActive();
      const beganMs = new Date(event.inflight.beganAt).getTime();

      if (isTty) {
        let frameIdx = 0;
        activeInterval = setInterval(() => {
          const sec = ((Date.now() - beganMs) / 1000).toFixed(1);
          const frame = FRAMES[frameIdx % FRAMES.length]!;
          frameIdx++;
          overwrite(`  ${frame} ${label}: inflight ${sec}s`);
        }, SPIN_MS);
      } else {
        detail(`  ${label}: inflight`);
      }
      return;
    }

    // handle completed step (has endedAt and outcome)
    if (event.inflight?.endedAt && event.outcome) {
      clearActive();
      const dur = computeDurationSec(event);

      if (event.step.phase === 'review') {
        seal(`  ✓ ${label}: finished ${dur}s`);
        if (event.outcome.review) {
          if (event.outcome.review.blockers > 0) {
            const bl =
              event.outcome.review.blockers === 1 ? 'blocker' : 'blockers';
            detail(`    ${event.outcome.review.blockers} ${bl} 🔴`);
          }
          if (event.outcome.review.nitpicks > 0) {
            const nl =
              event.outcome.review.nitpicks === 1 ? 'nitpick' : 'nitpicks';
            detail(`    ${event.outcome.review.nitpicks} ${nl} 🟠`);
          }
        }
      }

      if (event.step.phase === 'judge') {
        const mark = event.outcome.judge?.decision === 'passed' ? '✓' : '✗';
        seal(`  ${mark} ${label}: finished ${dur}s`);
        // always show reason when judge fails; failfast = make failures observable
        if (event.outcome.judge?.decision === 'failed') {
          const reason =
            event.outcome.judge.reason ?? 'no reason captured (command failed)';
          detail(`    reason: ${reason}`);
        }
      }
    }
  };

  return {
    context: { cliEmit: { onGuardProgress } },
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
