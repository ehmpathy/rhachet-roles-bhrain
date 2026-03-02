import type {
  ContextCliEmit,
  ContextGuardProgress,
} from '@src/domain.objects/Driver/ContextCliEmit';
import type { GuardProgressEvent } from '@src/domain.objects/Driver/GuardProgressEvent';

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

  // determine branch character based on position (├─ for intermediate, └─ for last)
  const getBranch = (position?: ContextGuardProgress): string => {
    if (!position) return '└─';
    return position.index < position.total - 1 ? '├─' : '└─';
  };

  const onGuardProgress = (
    event: GuardProgressEvent,
    position?: ContextGuardProgress,
  ) => {
    // format label as phase.N (e.g., review.1, judge.1)
    const phase = event.step.phase;
    const num = event.step.index + 1;
    const label = `${phase}.${num}`;
    const branch = getBranch(position);

    // handle cached step (both inflight and outcome null)
    if (!event.inflight && !event.outcome) {
      clearActive();
      completedCount++;
      const mark = '✓';
      const status = event.step.phase === 'review' ? 'done' : 'passed';
      seal(`   ${branch} ${mark} ${label} - ${status} (cached)`);
      return;
    }

    // handle active step (started but not yet done)
    if (event.inflight && !event.inflight.endedAt) {
      clearActive();
      const beganMs = new Date(event.inflight.beganAt).getTime();

      // only show spinner in TTY mode; non-TTY shows only completed results
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

    // handle completed step (has endedAt and outcome)
    if (event.inflight?.endedAt && event.outcome) {
      clearActive();
      const dur = computeDurationSec(event);
      completedCount++;

      if (event.step.phase === 'review') {
        const status = 'done';
        seal(`   ${branch} ✓ ${label} - ${status} ${dur}s`);
      }

      if (event.step.phase === 'judge') {
        const passed = event.outcome.judge?.decision === 'passed';
        const mark = passed ? '✓' : '✗';
        const status = passed ? 'passed' : 'failed';
        seal(`   ${branch} ${mark} ${label} - ${status} ${dur}s`);
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
