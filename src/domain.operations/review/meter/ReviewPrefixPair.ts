import type { ReviewRunMeet } from '@src/domain.objects/Reviewer/ReviewRunMeet';

/**
 * .what = the six verdicts a round pair's cache read can earn against its shared prefix
 * .why = a 0% cache rate has opposite causes, and the pair parts them:
 *
 *        - `served`      = a prefix was shared, and the cache read up to it
 *        - `missed`      = a prefix was shared, the round came within the cache reach of
 *                          its prior, and the cache served none — the prompt held, and
 *                          the host that served was not the one that cached (no pin
 *                          steers it; `setOnePrefixPoke`)
 *        - `lapsed`      = a prefix was shared, and the cache served none, but the round
 *                          began past the cache reach of its prior — the clock, never the
 *                          layout (`term=prompt.cache.lapsed`)
 *        - `self-cached` = the run went multi-turn, and its cache read came from its
 *                          OWN earlier turns — no cross-round reach to measure
 *        - `over-reach`  = the cache read more than the shared prefix holds, which the
 *                          byte-prefix model forbids — the instrument is off, never a win
 *        - `unshared`    = no prefix was shared, so the cache had no chance — the prompt
 *                          layout broke, or the round rode a brain its prior did not (a
 *                          cache is per model, so two brains share no prefix)
 */
export type ReviewPrefixVerdict =
  | 'served'
  | 'missed'
  | 'lapsed'
  | 'self-cached'
  | 'over-reach'
  | 'unshared';

/**
 * .what = where the shared prefix of a round pair parts
 * .why = `head` names a static head that changed (the instructions, or a target of the
 *        corpus the level shares); `tail` names the lane's own bytes behind it (rubric,
 *        refs, partition band, conversation); `whole` names a later prompt that matched
 *        its prior from end to end (`asPrefixBreak`)
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
   * the brain slug each round rode on — null where a round's args record names none
   *
   * .why = a prompt cache is per model. a round on a brain its prior did not ride could
   *        read no prefix from it, so the pair grades `unshared`, never `missed` — and the
   *        census splits by the round's brain, so each brain reads its own counts
   */
  brains: { prior: string | null; round: string | null };
  /**
   * the minutes from the prior round's last send (its mint plus its brain wall time) to
   * this round's mint — null where either log dir's stamp cannot be read
   * (`getOneMinutesSincePriorSend`)
   *
   * .why = a zero cache read past the cache reach is the clock, never the layout, so the
   *        gap is what parts `lapsed` from `missed`
   */
  minutesSincePrior: number | null;
  /**
   * what this round's level meet did — null where its record names none
   *
   * .why = a round that met a warm peer is graded against the head that peer warmed, not
   *        against its own prior round alone (`getOnePrefixVerdict`)
   */
  meet: ReviewRunMeet | null;
  /**
   * the longest common byte prefix of the two prompts, restated in chars — null where
   * either prompt is not on disk
   */
  sharedChars: number | null;
  /**
   * the cache read this round could earn, as tokens est. at its own chars per token — the
   * prefix it shares with its prior, or the head a warm peer wrote, whichever is longer
   */
  expectedTokens: number | null;
  /**
   * which bytes the expected read was taken from — null where it is unmeasured
   *
   * - `prior` = the prefix this round shares with its prior round
   * - `meet`  = the head a warm peer wrote this round, longer than the prior share
   *
   * .why = a render that names `shared with iK` for a figure the meet set misattributes the
   *        expectation to a round the cache may never have held
   */
  expectedFrom: 'prior' | 'meet' | null;
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
  lapsed: number;
  selfCached: number;
  overReach: number;
  unshared: number;
  /** pairs where a prompt was absent or the round unmetered */
  unmeasured: number;
}
