import { UnexpectedCodePathError } from 'helpful-errors';
import { asIsoPriceShape, isIsoPrice } from 'iso-price';

import type { TokenSpendRepaidRow } from '@src/domain.objects/Reflector/TokenSpendReport';

import { asTokenRepaidTotal } from './asTokenRepaidTotal';

/**
 * .what = the measure that orders repaid rows: price when every row is priced, else tokens
 * .why = the repaid section and the proposal must rank the same rows the same way; price
 *        alone knows a read from a write, so it ranks whenever it is whole
 */
export const asTokenRepaidRank = (input: {
  repaid: TokenSpendRepaidRow[];
}): {
  rankedBy: 'price' | 'tokens';
  measure: (row: TokenSpendRepaidRow) => number;
} => {
  const isAllPriced = input.repaid.every(
    (row) => row.priced.price !== null && row.priced.unpricedTokens === 0,
  );
  const rankedBy = isAllPriced ? 'price' : 'tokens';
  return {
    rankedBy,
    measure: (row) =>
      rankedBy === 'price'
        ? asPriceNumber({ row })
        : asTokenRepaidTotal({ tokens: row.tokens }),
  };
};

/**
 * .what = a row's price as a float, for rank order only
 * .why = an order and a share need a ratio; the price itself is shown in its iso form
 */
const asPriceNumber = (input: { row: TokenSpendRepaidRow }): number => {
  // a rank by price is chosen only when every row is priced, so an absent price is a defect
  const price = input.row.priced.price;
  if (price === null || !isIsoPrice(price))
    throw new UnexpectedCodePathError('a price rank met a row with no price', {
      row: input.row,
    });

  // an exponent this cannot read would silently rescale the row, so it halts instead
  const shape = asIsoPriceShape(price);
  // every iso-price exponent reads `$name.x10^$power` — `whole.x10^0`, `centi.x10^-2`, …
  const power = String(shape.exponent).match(/\.x10\^(-?\d+)$/)?.[1];
  if (power === undefined)
    throw new UnexpectedCodePathError(
      'a price rank met an exponent it cannot read',
      { price, exponent: shape.exponent },
    );
  return Number(shape.amount) * 10 ** Number(power);
};
