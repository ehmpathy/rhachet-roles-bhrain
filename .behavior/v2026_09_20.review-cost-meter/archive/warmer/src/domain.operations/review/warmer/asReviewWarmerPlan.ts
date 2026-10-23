import { BadRequestError } from 'helpful-errors';

import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = how many pokes a warmer sends, and how far apart
 * .why = the two numbers are one decision — see `asReviewWarmerPlan`
 */
export interface ReviewWarmerPlan {
  /** how many pokes to send before the warmer exits */
  pokes: number;
  /** minutes between pokes */
  everyMinutes: number;
}

/**
 * .what = the plan `--warmer on` gets. not the default — the default is off
 * .why = two measured numbers set it:
 *        · cadence 15m — under the gap where `CENSUS_OF_CACHE_REACH.decay` falls below
 *          half. a poke past the ttl refreshes naught and bills in full
 *        · count 12 — `k x m` is the coverage window. 12 x 15m = 2h45m spans the
 *          observed 1h29m – 3h05m gap between guard rounds
 * .note = frozen; `asReviewWarmerPlan` hands out a copy, so no caller re-plans others
 */
export const PLAN_OF_WARMER_ON: Readonly<ReviewWarmerPlan> = Object.freeze({
  pokes: 12,
  everyMinutes: 15,
});

/**
 * .what = the most pokes and the widest cadence a plan may declare
 * .why = a warmer spends unattended, so the parser bounds its worst case.
 *        `100x,1m` is a typo away from `10x,1m`
 * .note = a poke costs ~$0.0042 expected: a hit is $0.00043, a miss $0.0195 (45x),
 *         and ~1 in 5 miss. so the bound costs ~$0.05 per lane per review gap, at
 *         these rates. the help states no dollar figure — rates move, and the
 *         measured spend is `rhx review._.cost --of tree`'s to state
 * .note = the cadence cap binds on coverage, not spend: it sits under the same census
 *         gap as the cadence (`CENSUS_OF_CACHE_REACH.test` holds both)
 */
export const BOUND_OF_WARMER = {
  pokesMax: 12,
  everyMinutesMax: 30,
} as const;

/** the shape a `<k>x,<m>m` value must match */
const SHAPE_OF_WARMER_VALUE = /^(\d+)x,(\d+)m$/;

/** the usage line every refusal names (rule.require.errors-name-the-fix) */
const USAGE_OF_WARMER = '--warmer off | on | <k>x,<m>m   e.g. --warmer 5x,10m';

/**
 * .what = parses a `--warmer` flag into a plan, or null for off
 * .why = the pair rides in one token, so `1x,90m` — a poke past the ttl — shows at
 *        the call site rather than hides across two flags
 * .note = absent → off. a default spends on every caller who did not choose, so it
 *         must pay for itself, and the warmer does not. `rhx review._.cost --of tree`,
 *         2026-09-27: pokes cost $3.68; the 94 reviews that followed a warm run saved
 *         at most $1.40 — an upper bound that credits the warmer with every cache read,
 *         even the pin's. net -$2.28, a loss on 18 of 22 lanes. the path to a warmer
 *         that pays: `.dream/v2026_09_27.feat.tune-the-warmer-policy-to-raise-cache-hits.md`
 * .note = a malformed value refuses; a silent fallback would spend on a plan nobody
 *         wrote (rule.forbid.unexpected-defaults)
 */
export const asReviewWarmerPlan = (input: {
  flag: string | boolean | undefined;
}): ReviewWarmerPlan | null => {
  // absent flag → no warmer
  if (input.flag === undefined) return null;

  // a bare `--warmer` refuses: it is byte-identical to a dropped value, and only one of
  // the two meant to spend.
  // .note = no refusal in this transformer carries a metadata bag: each message already
  //         names the value the driver typed and the bound it broke, so a bag would only
  //         echo them back beneath the headline
  if (input.flag === true || input.flag === false)
    return BadRequestError.throw(
      `--warmer was given no value, so this cannot tell "on" from a value you meant to type. ${USAGE_OF_WARMER}`,
    );

  const value = input.flag.trim().toLowerCase();
  if (value === 'off') return null;
  // `on` is a friendly alias of its plan, and passes the same bounds as every typed
  // plan — a bump to the constant alone must not ship an unbounded default
  const spelled =
    value === 'on'
      ? `${PLAN_OF_WARMER_ON.pokes}x,${PLAN_OF_WARMER_ON.everyMinutes}m`
      : value;

  const matched = SHAPE_OF_WARMER_VALUE.exec(spelled);
  if (!matched)
    return BadRequestError.throw(
      `--warmer "${input.flag}" is not a plan this can read. ${USAGE_OF_WARMER}`,
    );

  const pokes = Number(matched[1]);
  const everyMinutes = Number(matched[2]);

  if (pokes < 1)
    return BadRequestError.throw(
      `--warmer "${input.flag}" asks for 0 pokes, which is --warmer off said the long way. ${USAGE_OF_WARMER}`,
    );
  if (pokes > BOUND_OF_WARMER.pokesMax)
    return BadRequestError.throw(
      `--warmer "${input.flag}" asks for ${asCountedNoun({ count: pokes, one: 'poke', many: 'pokes' })}, over the bound of ${BOUND_OF_WARMER.pokesMax}. ` +
        `a warmer spends unattended, so its worst case is bounded here rather than left to the caller. ${USAGE_OF_WARMER}`,
    );

  if (everyMinutes < 1)
    return BadRequestError.throw(
      `--warmer "${input.flag}" asks for a 0m cadence, which would spend the whole plan at once ` +
        `and protect one instant. ${USAGE_OF_WARMER}`,
    );
  if (everyMinutes > BOUND_OF_WARMER.everyMinutesMax)
    return BadRequestError.throw(
      `--warmer "${input.flag}" spaces pokes ${everyMinutes}m apart, over the bound of ` +
        `${BOUND_OF_WARMER.everyMinutesMax}m. a poke sent past the cache ttl refreshes naught and ` +
        `costs in full, so a wide cadence buys no coverage at any count. ${USAGE_OF_WARMER}`,
    );

  return { pokes, everyMinutes };
};
