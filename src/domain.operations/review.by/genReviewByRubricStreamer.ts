import { formatGuardReviewerTree } from '../route/guard/tree/formatGuardReviewerTree';
import { asReviewByReviewerTreeState } from './asReviewByReviewerTreeState';
import type { ReviewRubricProgress } from './ReviewByResult';

/**
 * .what = spinner frames + cadence, matched to genContextCliEmit (the route peer-review streamer)
 * .why = so review.by's live stream spins identically to route.stone.set's peer reviews.
 */
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SPIN_MS = 80;

/**
 * .what = a live streamer that renders each review.by rubric as an INCREMENTAL peer-style row —
 *         the exact form route.stone.set streams its peer reviews with (formatGuardReviewerTree)
 * .why = the human asked review.by to look, while it runs, like the incremental peer-review
 *        render — not a bespoke line. so this reuses formatGuardReviewerTree verbatim (via
 *        asReviewByReviewerTreeState) for both the inflight spinner line and the finished detail
 *        rows, so it stays perma-conformed with the guard's streamer. it mirrors
 *        genContextCliEmit's review path: seal a blank `│`, seal the `r{n}: slug` header, spin an
 *        `inflight` line under it (tty), then overwrite with the finished verdict/blocker/nitpick/
 *        given rows.
 *
 * .note = writes to STDOUT (not stderr): rhachet's skill runner streams a skill's stdout live but
 *         discards its stderr on success, so only stdout reaches the human as it runs. the caller
 *         passes process.stdout and suppresses this entirely under a guard (the guard renders its
 *         own tree). see rule.require.status-feedback.
 */
export const genReviewByRubricStreamer = (input: {
  out: NodeJS.WriteStream;
}): {
  onProgress: (event: ReviewRubricProgress) => void;
  done: () => void;
} => {
  const isTty = input.out.isTTY ?? false;

  // .note = deliberate mutation. a streamer is inherently stateful — the spinner interval, the
  //         last line width (for \r overwrite), and the active rubric identity all evolve across
  //         start/tick/done callbacks. an imperative accumulator is the clearest shape for a
  //         terminal-control loop; see rule.require.immutable-vars (annotated-mutation exception).
  let activeInterval: ReturnType<typeof setInterval> | null = null;
  let lastLineLen = 0;
  let beganMs = 0;
  let activeIndex = 0;
  let activeSlug = '';

  const clearActive = (): void => {
    if (activeInterval) {
      clearInterval(activeInterval);
      activeInterval = null;
    }
  };

  // overwrite the last line via \r (tty) or print a fresh line (non-tty) — mirrors genContextCliEmit
  const overwrite = (text: string): void => {
    if (isTty) {
      input.out.write(`\r${text.padEnd(lastLineLen)}`);
      lastLineLen = text.length;
    } else {
      input.out.write(`${text}\n`);
      lastLineLen = 0;
    }
  };

  // finalize a line: overwrite + newline (tty) or plain print (non-tty)
  const seal = (text: string): void => {
    if (isTty) {
      input.out.write(`\r${text.padEnd(lastLineLen)}\n`);
      lastLineLen = 0;
    } else {
      input.out.write(`${text}\n`);
    }
  };

  // render a rubric's inflight lines [header, spinnerLine] via the SHARED formatter, so the
  // header + indent match a peer reviewer exactly. hideMeter drops the route-only (l,budget).
  const inflightLines = (
    index: number,
    slug: string,
    durationSec: number,
  ): string[] =>
    formatGuardReviewerTree({
      reviewer: {
        index,
        slug,
        level: 1,
        rounds: 0,
        budget: 1,
        // a review.by row is a flat per-role review, never a route-ladder level, so it is
        // never overrule-scoped
        overruled: false,
        state: { type: 'inflight', durationSec },
      },
      isLast: false,
      baseIndent: '   ',
      hideMeter: true,
    });

  const onProgress = (event: ReviewRubricProgress): void => {
    // a rubric is about to run: seal the separator + header, then spin an inflight line under it
    if (event.phase === 'start') {
      clearActive();
      beganMs = Date.now();
      activeIndex = event.index;
      activeSlug = event.slug;

      // blank connector line + the reviewer header (both permanent), like peer streaming
      seal('   │');
      seal(inflightLines(event.index, event.slug, 0)[0]!);

      // tty: rotate the spinner on the inflight line; non-tty: leave the header (no noisy reprint)
      if (isTty) {
        // .note = deliberate mutation. frameIdx advances each tick to spin the glyph.
        let frameIdx = 0;
        activeInterval = setInterval(() => {
          const sec = (Date.now() - beganMs) / 1000;
          const frame = FRAMES[frameIdx % FRAMES.length]!;
          frameIdx++;
          // reuse the shared inflight line, swap the fixed glyph for the current frame
          const spinnerLine = inflightLines(
            activeIndex,
            activeSlug,
            sec,
          )[1]!.replace('⠋', frame);
          overwrite(spinnerLine);
        }, SPIN_MS);
      }
      return;
    }

    // a rubric finished: overwrite the spinner with the finished peer row (skip the sealed header)
    clearActive();
    const state = asReviewByReviewerTreeState({
      index: event.index,
      slug: event.slug,
      verdict: event.verdict!,
      durationMs: event.durationMs ?? null,
      outputPath: event.outputPath ?? '',
    });
    const lines = formatGuardReviewerTree({
      reviewer: state,
      isLast: false,
      baseIndent: '   ',
      hideMeter: true,
    });
    for (const line of lines.slice(1)) seal(line);
  };

  return { onProgress, done: clearActive };
};
