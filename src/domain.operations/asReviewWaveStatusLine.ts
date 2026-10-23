import type { ReviewWaveStatus } from './genReviewWaveBuffer';

/**
 * .what = the one tail line a concurrent review wave spins under its settled blocks —
 *         `⠋ 2 inflight · 1 done · 1 left · 12.3s`
 * .why = the guard's peer stream and review.by's rubric stream both pour reviews at once,
 *        and both show the wave on one overwritten line. one render keeps the two streams
 *        identical (rule.forbid.duplicate-format-tree-operations)
 */
export const asReviewWaveStatusLine = (input: {
  frame: string;
  status: ReviewWaveStatus;
  /** seconds since the wave's first lane went aloft */
  sec: number;
}): string =>
  `   └─ ${input.frame} ${input.status.inflight} inflight · ${input.status.done} done · ${input.status.left} left · ${input.sec.toFixed(1)}s`;
