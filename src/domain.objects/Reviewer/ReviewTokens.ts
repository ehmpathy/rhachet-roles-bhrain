/**
 * .what = disjoint token counts for one review run or one rolled-up bucket —
 *         each token counted exactly once, across the four axes the rate card
 *         prices separately
 *
 * .why = a single `tokens` figure cannot say where the money went. cache.get is
 *        read at 1/31.4 the price of input, so a sum of the four is a number no
 *        decision can be made from — the split is the whole answer.
 *
 * .why = declared once, here, so every reader of this shape
 *        (`getOnePromptTokens`, `getOneFullRateTokens`, `getOneCacheHitRate`)
 *        and every writer of it (the meter, the grove report) share the same
 *        four axes, rather than each hand-declaring a copy that could drift.
 *
 * .why = it is a domain object, so it sits in `domain.objects/Reviewer/` rather than
 *        beside any one operation — `meter/` and `grove/` both read it, and neither owns it.
 *
 * .note = the four axes are disjoint by contract, and every reader depends on it.
 *         `input` excludes what the cache served; `cacheSet` is the write that seeded
 *         it; `cacheGet` is the read that hit it. so the prompt total is
 *         `input + cacheSet + cacheGet`, and `output` is never part of a prompt
 *         figure — a hit rate that admitted it would move when a reviewer merely
 *         wrote more (`getOneCacheHitRate`).
 */
export interface ReviewTokens {
  /** prompt tokens charged at full rate, exclusive of all the cache served */
  input: number;
  /** prompt tokens written INTO the cache — full rate, paid once per seed */
  cacheSet: number;
  /** prompt tokens served FROM the cache — 31.4x cheaper than input, never nil */
  cacheGet: number;
  /** tokens the brain generated. priced on its own axis, and never a prompt figure */
  output: number;
}
