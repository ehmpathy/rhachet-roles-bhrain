import { type IsoPrice, priceMultiply, priceSum } from 'iso-price';

import type { TokenRates } from '@src/domain.objects/Reflector/TokenRates';
import type {
  TokenPriceByKind,
  TokenPriceSum,
} from '@src/domain.objects/Reflector/TokenSpendReport';

/**
 * .what = token counts by the kind of token, the unit every price is made of
 * .why = each kind has its own rate; a sum across kinds is a price, never a token count
 */
export interface TokenCountsByKind {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
}

/**
 * .what = every kind of token, in prompt order then output
 */
export const TOKEN_KINDS: (keyof TokenCountsByKind)[] = [
  'cacheRead',
  'cacheWrite5m',
  'cacheWrite1h',
  'input',
  'output',
];

/**
 * .what = the price of a set of token counts at one model's rates, in sum and per kind
 * .why = a rate the spec lacks must not be guessed; its tokens are counted apart as
 *        `unpriced`, so a reader sees both the priced part and what it could not price
 *
 * .note = rates null means the model has no spec; every token is then unpriced
 */
export const asTokenPrice = (input: {
  tokens: TokenCountsByKind;
  rates: TokenRates | null;
}): TokenPriceSum => {
  // price each kind whose rate is known
  const priceOf = (of: { kind: keyof TokenCountsByKind }): IsoPrice | null => {
    const rate = input.rates?.[of.kind] ?? null;
    if (rate === null) return null;
    return priceMultiply({ of: rate, by: input.tokens[of.kind] });
  };
  const byKind: TokenPriceByKind = {
    input: priceOf({ kind: 'input' }),
    output: priceOf({ kind: 'output' }),
    cacheRead: priceOf({ kind: 'cacheRead' }),
    cacheWrite5m: priceOf({ kind: 'cacheWrite5m' }),
    cacheWrite1h: priceOf({ kind: 'cacheWrite1h' }),
  };

  // count the tokens no rate could price
  const unpricedTokens = TOKEN_KINDS.filter(
    (kind) => byKind[kind] === null,
  ).reduce((sum, kind) => sum + input.tokens[kind], 0);

  // no priced kind with tokens means no price at all, never a false zero
  const pricedWithTokens = TOKEN_KINDS.filter((kind) => input.tokens[kind] > 0)
    .map((kind) => byKind[kind])
    .filter((price): price is IsoPrice => price !== null);
  return {
    price: pricedWithTokens.length === 0 ? null : priceSum(...pricedWithTokens),
    unpricedTokens,
    byKind,
  };
};
