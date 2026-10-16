/**
 * .what = the five verdicts a round pair's cache read can earn against its shared prefix
 * .why = a 0% cache rate has opposite causes, and the pair parts them:
 *
 *        - `served`      = a prefix was shared, and the cache read up to it
 *        - `missed`      = a prefix was shared, and the cache served none — the prompt
 *                          held, and ttl or the replica pin is at fault
 *        - `self-cached` = the run went multi-turn, and its cache read came from its
 *                          OWN earlier turns — no cross-round reach to measure
 *        - `over-reach`  = the cache read more than the shared prefix holds, which the
 *                          byte-prefix model forbids — the instrument is off, never a win
 *        - `unshared`    = no prefix was shared, so the cache had no chance — the prompt
 *                          layout broke, and a lever is at fault
 */
export type ReviewPrefixVerdict =
  | 'served'
  | 'missed'
  | 'self-cached'
  | 'over-reach'
  | 'unshared';

/**
 * .what = where the shared prefix of a round pair parts
 * .why = `head` names a static head that changed (a rubric, a brief, a focus); `tail`
 *        names the per-round bytes behind it; `whole` names a later prompt that matched
 *        its prior from end to end
 */
export type ReviewPrefixBreak = 'head' | 'tail' | 'whole';

/**
 * .what = one reviewer's round, set against its prior round — the prefix a cache could
 *         have served, beside the cache read the brain billed
 * .why = `cache.get` alone reads alike whether the prefix was 500k chars and the cache
 *        missed, or the prefix was 0 chars and the cache had no chance. the pair
 *        carries both halves, so a reader can tell which defect happened
 *
 * .note = every figure that could not be measured is null, never zero — a prompt not on
 *         disk shares no measured prefix, and an unmetered run billed no measured read
 *         (rule.forbid.failhide)
 */
export interface ReviewPrefixPair {
  /** the reviewer slug both rounds ran under */
  reviewer: string;
  /** the prior round — its log dir, stone, and guard iteration */
  prior: { dir: string; stone: string; iteration: number };
  /** this round — its log dir, stone, and guard iteration */
  round: { dir: string; stone: string; iteration: number };
  /**
   * the longest common byte prefix of the two prompts, restated in chars — null where
   * either prompt is not on disk
   */
  sharedChars: number | null;
  /** the shared prefix, as tokens est. at this round's own chars per token */
  expectedTokens: number | null;
  /** the cache read this round billed — null where the round is not metered */
  detectedTokens: number | null;
  /** detected / expected — null where either is absent, zero, or self-cached */
  reach: number | null;
  /** see `ReviewPrefixVerdict` — null where either half is unmeasured */
  verdict: ReviewPrefixVerdict | null;
  /** see `ReviewPrefixBreak` — null where the static head is not on record */
  breaksIn: ReviewPrefixBreak | null;
  /** the chars of this round's static head — null where not on record */
  headChars: number | null;
}

/**
 * .what = the verdict counts over a set of round pairs
 * .why = the one-line rollup the tree and grove breadths render in the cache lever area
 */
export interface ReviewPrefixRollup {
  /** every round pair considered */
  pairs: number;
  served: number;
  missed: number;
  selfCached: number;
  overReach: number;
  unshared: number;
  /** pairs where a prompt was absent or the round unmetered */
  unmeasured: number;
}

/**
 * .what = the shared-prefix census of a corpus — the rollup, and the pairs it counts
 * .why = the json a tree or grove emits carries the same figures its render rolls up
 */
export interface ReviewPrefixCensus {
  verdicts: ReviewPrefixRollup;
  pairs: ReviewPrefixPair[];
}
