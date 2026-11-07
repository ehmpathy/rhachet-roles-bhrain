import {
  isRunMeetWarm,
  type ReviewRunMeet,
} from '@src/domain.objects/Reviewer/ReviewRunMeet';
import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';
import { getOnePromptTokens } from '@src/domain.operations/review/getOnePromptTokens';
import { isMinutesPastCacheReach } from '@src/domain.operations/review/meter/isMinutesPastCacheReach';
import type { ReviewPrefixVerdict } from '@src/domain.operations/review/meter/ReviewPrefixPair';

/**
 * .what = the chars per token a run with no measured ratio is read at
 * .why = the ratio varies by corpus, so a run's own ratio is preferred; this is the
 *        fallback where the run carries no tokens or no chars to derive one from
 */
const CHARS_PER_TOKEN_FALLBACK = 4;

/**
 * .what = the reach past which a cache read exceeds the shared prefix
 * .why = the expected side is an estimate at a derived chars-per-token ratio, so a
 *        read a hair above it is noise; five points of headroom keeps a rounded
 *        estimate from read as a model violation
 */
const REACH_OF_OVER = 1.05;

/**
 * .what = whether a run's cache read came from its own earlier turns
 * .why = a multi-turn run reports its LAST turn, so a continuation turn bills `input`
 *        near zero and `cacheGet` near the whole prompt — turn one put it there moments
 *        before. to divide that read by a cross-round prefix compares it to an
 *        unrelated prior round. a genuine cross-round hit cannot look like this: its
 *        prefix ends where the round's own edits begin
 */
const isRunSelfCached = (input: { tokens: ReviewTokens }): boolean => {
  const promptTokens = getOnePromptTokens({ tokens: input.tokens });
  if (promptTokens === 0 || input.tokens.cacheGet === 0) return false;
  return (
    input.tokens.cacheGet / promptTokens > 0.9 &&
    input.tokens.input / promptTokens < 0.05
  );
};

/**
 * .what = the chars per token of a run, from the run itself where it can be measured
 * .why = a hardcoded ratio over-states or under-states reach by corpus; the run's own
 *        `promptChars / promptTokens` is the ratio its bill was taken at
 */
const getOneCharsPerToken = (input: {
  promptChars: number | null;
  tokens: ReviewTokens | null;
}): number => {
  if (input.tokens === null || !input.promptChars)
    return CHARS_PER_TOKEN_FALLBACK;
  const promptTokens = getOnePromptTokens({ tokens: input.tokens });
  if (promptTokens === 0) return CHARS_PER_TOKEN_FALLBACK;
  return input.promptChars / promptTokens;
};

/**
 * .what = whether a round rode a brain its prior round did not
 * .why = a prompt cache is per model, so a round on a new brain can read no prefix its
 *        prior wrote. an unrecorded brain on either side proves no switch, so it reads false
 */
const isPairBrainSwitched = (input: {
  brains: { prior: string | null; round: string | null };
}): boolean =>
  input.brains.prior !== null &&
  input.brains.round !== null &&
  input.brains.prior !== input.brains.round;

/**
 * .what = the cache read a round's shared prefix could earn, in tokens — null where a
 *         prompt is not on disk
 * .why = a round on a brain its prior did not ride shares no prefix a cache could serve,
 *        whatever its bytes share, so its expected read is zero
 */
const getOneExpectedTokens = (input: {
  sharedChars: number | null;
  promptChars: number | null;
  tokens: ReviewTokens | null;
  brains: { prior: string | null; round: string | null };
  meet: ReviewRunMeet | null;
  headChars: number | null;
}): number | null => {
  // a round that met a warm peer can read the head that peer warmed, on its own brain
  if (isPairMetWarm(input))
    return Math.round(
      Math.max(input.sharedChars ?? 0, input.headChars) /
        getOneCharsPerToken(input),
    );
  if (input.sharedChars === null) return null;
  if (isPairBrainSwitched(input)) return 0;
  return Math.round(input.sharedChars / getOneCharsPerToken(input));
};

/**
 * .what = whether a round met a peer that warmed its head this round, with a head to measure
 * .why = the cure's own win: a lane reads the head a peer's prime wrote seconds before. that
 *        read can exceed what the lane shares with its own prior round, so a grade against the
 *        prior alone would call the win `over-reach`, and a zero read against a stale prior
 *        would call a real miss `lapsed`. the meet is keyed on brain + head, so the peer rode
 *        this round's brain, and the gap to it is seconds
 */
const isPairMetWarm = (input: {
  meet: ReviewRunMeet | null;
  headChars: number | null;
}): input is { meet: ReviewRunMeet; headChars: number } =>
  input.headChars !== null && isRunMeetWarm({ meet: input.meet });

/**
 * .what = a round's expected cache read, its detected one, their reach, and the verdict
 * .why = the decision that parts a layout break from a cache miss, in one pure place,
 *        so the run, tree, and grove breadths cannot grade one pair two ways
 *
 * .note = every figure that cannot be measured answers null: a prompt not on disk has no
 *         shared prefix, and an unmetered round has no cache read
 */
export const getOnePrefixVerdict = (input: {
  /** the shared prefix in chars — null where a prompt is not on disk */
  sharedChars: number | null;
  /** this round's prompt chars — null where its census could not be read */
  promptChars: number | null;
  /** this round's tokens — null where the round is not metered */
  tokens: ReviewTokens | null;
  /** the brain each round rode on — null where a round's args record names none */
  brains: { prior: string | null; round: string | null };
  /** the minutes from the prior round's last send to this round's mint — null where unread */
  minutesSincePrior: number | null;
  /** what this round's level meet did — null where its record names none */
  meet: ReviewRunMeet | null;
  /** this round's static head, in chars — null where its census is absent */
  headChars: number | null;
}): {
  expectedTokens: number | null;
  expectedFrom: 'prior' | 'meet' | null;
  detectedTokens: number | null;
  reach: number | null;
  verdict: ReviewPrefixVerdict | null;
} => {
  // the expected half stands on the prompts, the brains, and the meet alone
  const expectedTokens = getOneExpectedTokens(input);
  const expectedFrom = asExpectedFrom({ ...input, expectedTokens });
  const detectedTokens = input.tokens?.cacheGet ?? null;

  // no verdict where either half is unmeasured
  if (
    input.tokens === null ||
    expectedTokens === null ||
    detectedTokens === null
  )
    return {
      expectedTokens,
      expectedFrom,
      detectedTokens,
      reach: null,
      verdict: null,
    };

  // a multi-turn run read its own turns; no cross-round reach to state
  if (isRunSelfCached({ tokens: input.tokens }))
    return {
      expectedTokens,
      expectedFrom,
      detectedTokens,
      reach: null,
      verdict: 'self-cached',
    };

  // no shared prefix: the cache had no chance, or it read bytes no prefix holds
  if (expectedTokens === 0)
    return {
      expectedTokens,
      expectedFrom,
      detectedTokens,
      reach: null,
      verdict: detectedTokens > 0 ? 'over-reach' : 'unshared',
    };

  // a shared prefix: the reach grades the read against it
  const reach = detectedTokens / expectedTokens;
  return {
    expectedTokens,
    expectedFrom,
    detectedTokens,
    reach,
    verdict: asVerdictOfReach({
      reach,
      detectedTokens,
      // a warm peer touched the head seconds before, so its gap is never the prior's
      minutesSincePrior: isPairMetWarm(input) ? 0 : input.minutesSincePrior,
    }),
  };
};

/**
 * .what = which bytes a round's expected read was taken from — null where it is unmeasured
 * .why = the render names the source, so a figure the meet set never reads as one shared
 *        with the prior round. `meet` only where the head a warm peer wrote is the longer
 *        of the two — the same `max` the expected figure takes
 */
const asExpectedFrom = (input: {
  expectedTokens: number | null;
  sharedChars: number | null;
  meet: ReviewRunMeet | null;
  headChars: number | null;
}): 'prior' | 'meet' | null => {
  if (input.expectedTokens === null) return null;
  if (isPairMetWarm(input) && input.headChars > (input.sharedChars ?? 0))
    return 'meet';
  return 'prior';
};

/**
 * .what = whether a round began past the cache reach of its prior round
 * .why = past the reach, no cache could hold the prior's prefix, so a zero read is the
 *        clock. an unread gap proves no lapse, so it reads false and the zero stays a miss
 */
const isPairPastCacheReach = (input: {
  minutesSincePrior: number | null;
}): boolean => isMinutesPastCacheReach({ minutes: input.minutesSincePrior });

/**
 * .what = the verdict of a round whose prefix was shared, by its reach and its gap
 * .why = four outcomes over two figures, named so the composer above reads plainly. a
 *        zero read parts on the clock: past the reach it lapsed, within it it missed
 */
const asVerdictOfReach = (input: {
  reach: number;
  detectedTokens: number;
  minutesSincePrior: number | null;
}): ReviewPrefixVerdict => {
  if (input.detectedTokens === 0 && isPairPastCacheReach(input))
    return 'lapsed';
  if (input.detectedTokens === 0) return 'missed';
  if (input.reach > REACH_OF_OVER) return 'over-reach';
  return 'served';
};
