import {
  asIsoPriceHuman,
  IsoPriceExponent,
  type IsoPriceHuman,
  type IsoPriceWords,
  isIsoPriceHuman,
  setPricePrecision,
} from 'iso-price';

/**
 * .what = the fraction digits the micro grain renders
 * .why = named beside the grain it belongs to, so the zero fill and the
 *        precision cannot disagree
 */
const DIGITS_OF_MICRO = 6;

/**
 * .what = the shape a nil spend renders as
 * .why = every nil here is a fact — a refused lane spent naught, and so did a metered
 *        run the provider billed at zero — so both keep the short `$0` the help
 *        promises. a padded `$0.000000` would read as a measured sub-micro spend.
 *        the nil shape never says WHICH fact: the grade column beside it parts a
 *        `refused` row from a `metered` one, and an `unknown` spend never reaches
 *        this column at all — it renders absent
 */
const SHAPE_OF_NIL = '$0';

/**
 * .what = renders one spend for a cost COLUMN, at the one precision every row shares
 * .why = a stored price keeps the precision it was measured at, so a metered row
 *        reads `$0.500000` and a refused row beneath it reads `$0.00`. a column of
 *        mixed precision does not align, and a reader cannot compare magnitudes
 *        down it at a glance
 *
 * .note = micro, since a review's spend is routinely a fraction of a cent and a
 *         coarser grain would round a real bill to a nil. the json keeps the full
 *         stored precision; only the human column is set
 *
 * 🔴 .note = `asIsoPriceHuman` drops the whole fraction where it is all zeroes, so
 *     a lane that summed to exactly one dollar read `$1` beside `$0.250000`, and a
 *     metered `$1` took the same short shape as a refused `$0`. the fraction is
 *     restored here, at the micro grain this column declares, so every metered
 *     row carries the same six digits — and only the nil keeps the short `$0`
 */
export const asCostColumnHuman = (input: {
  cost: IsoPriceWords;
}): IsoPriceHuman => {
  const human = asIsoPriceHuman(
    setPricePrecision({ of: input.cost, to: IsoPriceExponent.MICRO }),
  );

  // a nil is a FACT (refused, or metered at zero), and `$0` is the one shape for it
  if (human === SHAPE_OF_NIL) return human;

  // restore the fraction the display dropped, to the column's six digits
  const [whole, fraction] = human.split('.');
  const padded: string = `${whole}.${(fraction ?? '').padEnd(DIGITS_OF_MICRO, '0')}`;
  isIsoPriceHuman.assure(padded);
  return padded;
};

/**
 * .what = the width every cost column pads to, at every breadth
 * .why = a micro-precision figure is `$0.001420` (9 chars) under a dollar and grows
 *        one char per decade above it — `$151.920000` is 11. one width, declared
 *        beside the one precision, keeps `--of tree` and `--of grove` aligned alike
 */
export const WIDTH_OF_COST_COLUMN = 12;
