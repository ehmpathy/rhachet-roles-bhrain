import { asReviewWaveStatusLine } from '@src/domain.operations/asReviewWaveStatusLine';
import { genReviewWaveBuffer } from '@src/domain.operations/genReviewWaveBuffer';
import { genTerminalTailLine } from '@src/infra/terminal/genTerminalTailLine';

// a sanctioned exposure, declared in src/domain.operations/route/guard/tree/.readme.md
import { formatGuardReviewerTree } from '../route/guard/tree/formatGuardReviewerTree';
import { asReviewByReviewerTreeState } from './asReviewByReviewerTreeState';
import type { ReviewRubricProgress } from './ReviewByResult';

/**
 * .what = a live streamer that renders review.by's rubrics as they pour — each rubric's
 *         whole peer-style row released in declared order, under one tail status line
 * .why = the rubrics run concurrently (`stepReviewBy`), so a row that sealed its header at
 *        start would land another rubric's verdict under it. this reuses the guard's own
 *        wave buffer (`genReviewWaveBuffer`) and status line (`asReviewWaveStatusLine`), so
 *        review.by streams exactly as route.stone.set streams a concurrent peer level:
 *        each block whole, in declared order, and one `N inflight · D done · L left` line
 *        that moves (rule.require.status-feedback)
 *
 * .note = reentrant by construction. every start and done event is keyed by its rubric's
 *         slot, never by "the active rubric", so any number may be inflight at once
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
  // the ordered-release state; review.by is one flat wave, so it holds one level
  const wave = genReviewWaveBuffer();

  // the tail-line mechanics (overwrite, seal, spin) and the spinner frames + cadence come from
  // the one driver the guard's peer stream reads too, so the two streams spin identically
  const tail = genTerminalTailLine({ out: input.out });
  const clearActive = tail.stop;
  const seal = tail.seal;

  // spin the one wave status line while any rubric is aloft (tty only, as the guard does)
  const drawStatus = (): void => {
    clearActive();
    if (wave.status().inflight === 0) return;
    const beganMs = wave.status().beganMs ?? Date.now();
    tail.spin({
      render: (frame) =>
        asReviewWaveStatusLine({
          frame,
          status: wave.status(),
          sec: (Date.now() - beganMs) / 1000,
        }),
    });
  };

  const onProgress = (event: ReviewRubricProgress): void => {
    // every event ensures the one wave is open, sized to the rubric roster
    wave.begin({ level: 1, total: event.total });
    const slot = event.index - 1;

    // a rubric went aloft: count it, and let the status line show it
    if (event.phase === 'start') {
      wave.launch({ slot, beganMs: Date.now() });
      drawStatus();
      return;
    }

    // a rubric finished: buffer its whole row, then release every row now in order
    const state = asReviewByReviewerTreeState({
      index: event.index,
      slug: event.slug,
      verdict: event.verdict!,
      durationMs: event.durationMs ?? null,
      outputPath: event.outputPath ?? '',
    });
    const block = [
      '   │',
      ...formatGuardReviewerTree({
        reviewer: state,
        isLast: false,
        baseIndent: '   ',
        hideMeter: true,
      }),
    ];
    clearActive();
    for (const released of wave.settle({ slot, block }))
      for (const line of released) seal(line);
    drawStatus();
  };

  // stop the spinner, and release any row a thrown rubric left behind a gap
  const done = (): void => {
    clearActive();
    for (const released of wave.drain())
      for (const line of released) seal(line);
  };

  return { onProgress, done };
};
