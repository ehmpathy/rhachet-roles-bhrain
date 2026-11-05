import type { ReviewRunIdentity } from '@src/domain.objects/Reviewer/ReviewRunIdentity';
import { asRateHuman } from '@src/domain.operations/review/asRateHuman';
import { MINUTES_OF_CACHE_REACH } from '@src/domain.operations/review/MINUTES_OF_CACHE_REACH';
import {
  asFigureHuman,
  MARK_OF_ABSENT,
} from '@src/domain.operations/review/meter/asFigureHuman';
import type {
  ReviewPrefixPair,
  ReviewPrefixVerdict,
} from '@src/domain.operations/review/meter/ReviewPrefixPair';

/**
 * .what = the verdict word as a run renders it, with its glyph where it asks for action
 * .why = 🔴 marks a miss (the prompt held, the cache served none), 🟡 a lapse (the round
 *        came past the cache reach) and an over-reach (the instrument is off); the other
 *        three are facts that ask for no move
 */
const WORD_OF_VERDICT: Record<ReviewPrefixVerdict, string> = {
  served: 'served',
  missed: '🔴 missed',
  lapsed: '🟡 lapsed',
  'self-cached': 'self-cached',
  'over-reach': '🟡 over-reach',
  unshared: 'unshared',
};

/**
 * .what = a figure with its unit, or the absent mark where it was not measured
 * .why = an unmeasured figure renders absent, never zero (rule.forbid.failhide)
 */
const asFigureWithUnit = (input: {
  of: number | null;
  unit: string;
}): string =>
  input.of === null
    ? MARK_OF_ABSENT
    : `${asFigureHuman({ of: Math.round(input.of) })} ${input.unit}`;

/**
 * .what = the prior round's name as this run reads it — its iteration, and its stone
 *         where the stone differs from this run's
 * .why = a reviewer's prior round is most often on the same stone, so the stone is
 *        named only where it adds a fact
 */
const asPriorRoundName = (input: { pair: ReviewPrefixPair }): string =>
  input.pair.prior.stone === input.pair.round.stone
    ? `i${input.pair.prior.iteration}`
    : `${input.pair.prior.stone} i${input.pair.prior.iteration}`;

/**
 * .what = the gap a lapsed pair names, so the reader sees how far past the reach it came
 * .why = the same `(lapsed Nm)` shape the lane grade's cold caveat reads, one word one sense
 *        (`term=prompt.cache.lapsed`); naught on every other verdict
 */
const asLapseCaveat = (input: { pair: ReviewPrefixPair }): string =>
  input.pair.verdict === 'lapsed' && input.pair.minutesSincePrior !== null
    ? ` (${Math.round(input.pair.minutesSincePrior)}m since ${asPriorRoundName(input)}, past the ${MINUTES_OF_CACHE_REACH}-minute reach)`
    : '';

/**
 * .what = where the expected read came from, as the pair row names it
 * .why = a figure the meet set must never read as one shared with the prior round — a
 *        reader would chase a prior the cache may never have held
 */
const asExpectedSource = (input: {
  pair: ReviewPrefixPair;
  prior: string;
}): string =>
  input.pair.expectedFrom === 'meet'
    ? `${asFigureWithUnit({ of: input.pair.headChars, unit: 'chars' })} of head ${asWarmerOfMeet({ meet: input.pair.meet })} warmed this round; meet: ${input.pair.meet}`
    : `${asFigureWithUnit({ of: input.pair.sharedChars, unit: 'chars' })} shared with ${input.prior}`;

/**
 * .what = who warmed the head a warm meet read — the run's own poke, or a peer's
 * .why = a `primed` lane led the meet: its own poke wrote the head, so "a peer" would
 *        send a reader after a lane that never sent one
 */
const asWarmerOfMeet = (input: { meet: ReviewPrefixPair['meet'] }): string =>
  input.meet === 'primed' ? 'its own poke' : 'a peer';

/**
 * .what = the two brains of an `unshared` pair whose rounds rode different brains, or null
 * .why = a brain switch is the one `unshared` cause the pair can name for certain; a pair
 *        where either brain is unrecorded cannot claim it
 */
const asBrainSwitch = (input: {
  pair: ReviewPrefixPair;
}): { prior: string; round: string } | null => {
  const { verdict, brains } = input.pair;
  if (verdict !== 'unshared') return null;
  if (brains.prior === null || brains.round === null) return null;
  if (brains.prior === brains.round) return null;
  return { prior: brains.prior, round: brains.round };
};

/**
 * .what = the shared-prefix rows of one run — its round beside its prior round
 * .why = `cache.get` alone reads alike whether the cache missed a prefix the prompts
 *        shared, or the prompts shared none. the rows set what the cache COULD have
 *        served (`expected`) beside what it DID serve (`cache.get`), and say where the
 *        prompts part, so a reader can tell a layout break from a cache miss
 *
 * .note = three states render as three: a run with no guard identity has no lane to
 *         find a prior in; a run with an identity and no pair is its lane's first
 *         round in this tree; a pair is the measured answer. the terms are defined
 *         in `--help`, never here, so the rows stay dense
 */
export const asPrefixPairLines = (input: {
  identity: ReviewRunIdentity | null;
  pair: ReviewPrefixPair | null;
}): string[] => {
  // no guard identity, so no lane to pair with
  if (input.identity === null)
    return [
      `   ├─ prefix: ${MARK_OF_ABSENT}  (no guard identity, so no prior round to pair with)`,
    ];

  // a lane's first round has no prior to share a prefix with
  const { pair } = input;
  if (pair === null)
    return [
      `   ├─ prefix: ${MARK_OF_ABSENT}  (the first round of ${input.identity.slug} in this tree)`,
    ];

  // the measured pair — its verdict, then the two halves it weighs, then the part
  const prior = asPriorRoundName({ pair });

  // a brain switch is the cause of its own `unshared`: a cache is per model, so the prior's
  // bytes were never a prefix this round could read. the shared-chars and break rows would
  // send a reader after a layout break that is not there, so the pair names the switch
  const switched = asBrainSwitch({ pair });
  if (switched)
    return [
      `   ├─ prefix vs ${prior}: ${WORD_OF_VERDICT.unshared} — brain switched (${switched.prior} → ${switched.round})`,
      `   │  ├─ cache.get ${asFigureWithUnit({ of: pair.detectedTokens, unit: 'tok' })}`,
      `   │  └─ a cache is per model, so ${prior}'s prompt on ${switched.prior} held no prefix for ${switched.round} to read`,
    ];
  const verdict =
    pair.verdict === null
      ? `${MARK_OF_ABSENT}  (${pair.sharedChars === null ? 'a prompt is not on disk' : 'this round is not metered'})`
      : `${WORD_OF_VERDICT[pair.verdict]}${asLapseCaveat({ pair })}`;
  // an absent reach reads as its own clause, never a mark dropped inside "of expected"
  const reach =
    pair.reach === null
      ? `reach ${MARK_OF_ABSENT}  (no expected prefix to weigh it against)`
      : `reach ${asRateHuman({ of: pair.reach, absent: MARK_OF_ABSENT })} of expected`;
  return [
    `   ├─ prefix vs ${prior}: ${verdict}`,
    `   │  ├─ cache.get ${asFigureWithUnit({ of: pair.detectedTokens, unit: 'tok' })} · ${reach}`,
    `   │  ├─ expected ${asFigureWithUnit({ of: pair.expectedTokens, unit: 'tok est.' })} (${asExpectedSource({ pair, prior })})`,
    `   │  └─ prefix breaks in: ${pair.breaksIn ?? MARK_OF_ABSENT}`,
  ];
};
