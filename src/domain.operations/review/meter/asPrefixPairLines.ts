import type { ReviewRunIdentity } from '@src/domain.objects/Reviewer/ReviewRunIdentity';
import { asRateHuman } from '@src/domain.operations/review/asRateHuman';
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
 * .why = 🔴 marks a miss (the prompt held, the cache served none) and 🟡 an over-reach
 *        (the instrument is off); the other three are facts that ask for no move
 */
const WORD_OF_VERDICT: Record<ReviewPrefixVerdict, string> = {
  served: 'served',
  missed: '🔴 missed',
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
  const verdict =
    pair.verdict === null
      ? `${MARK_OF_ABSENT}  (${pair.sharedChars === null ? 'a prompt is not on disk' : 'this round is not metered'})`
      : WORD_OF_VERDICT[pair.verdict];
  const reach = asRateHuman({ of: pair.reach, absent: MARK_OF_ABSENT });
  const shared = asFigureWithUnit({ of: pair.sharedChars, unit: 'chars' });
  return [
    `   ├─ prefix vs ${prior}: ${verdict}`,
    `   │  ├─ cache.get ${asFigureWithUnit({ of: pair.detectedTokens, unit: 'tok' })} · reach ${reach} of expected`,
    `   │  ├─ expected ${asFigureWithUnit({ of: pair.expectedTokens, unit: 'tok est.' })} (${shared} shared with ${prior})`,
    `   │  └─ prefix breaks in: ${pair.breaksIn ?? MARK_OF_ABSENT}`,
  ];
};
