import type { IsoPrice, IsoPriceWords } from 'iso-price';
import { priceMultiply, priceSub } from 'iso-price';

/**
 * .what = what the cache saved ONE review, priced at that review's own measured rates
 * .why = the saved amount is a counterfactual — what the cached tokens would have
 *        cost at full rate, less what they did cost. the full rate is taken from
 *        the run's own bill (`cost.input / tokens.input`), never a rate card: a
 *        rate card is a projection; a run's own quotient is a measurement.
 *
 * .note = null where the run had no full-rate token. a quotient over zero tokens
 *         is no rate at all, and to price a cached token against an invented rate
 *         would state a saved amount no artifact measured (rule.forbid.failhide).
 *
 * .note = the full-rate figure is the input bill scaled by a token ratio, a plain
 *         scalar, never money arithmetic, so the result keeps the provider's own
 *         precision. `priceDivide` is not used: it picks its output precision from
 *         the divisor alone and throws on the micro-precision bills small runs
 *         carry (ehmpathy/iso-price#14).
 */
export const getOneCacheSavedPrice = (input: {
  tokens: { input: number; cacheGet: number };
  cost: { input: IsoPrice | string; cacheRead: IsoPrice | string };
}): IsoPriceWords | null => {
  // no full-rate token, so no measured rate to price a cached token against
  if (input.tokens.input === 0) return null;

  // what the cached tokens would have cost at this run's own full rate
  const atFullRate = priceMultiply({
    of: input.cost.input,
    by: input.tokens.cacheGet / input.tokens.input,
  });

  // less what the cache actually charged for them
  return priceSub(atFullRate, input.cost.cacheRead);
};
