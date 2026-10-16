import { asIsoPrice, type IsoPriceWords, priceSum } from 'iso-price';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { getAllRunsAccounted } from '@src/domain.operations/review/meter/getAllRunsAccounted';

/**
 * .what = the spend of a set of runs, or absent when none could account for its own
 * .why = one law for both breadths: the per-tree meter and the grove mine call this
 *        one operation, so an all-`unknown` lane reads absent at each, never a
 *        measured `$0.00` at one and absent at the other.
 *
 * .note = the two halves of the absent/zero law pull opposite ways:
 *
 *         - no accounted run: the spend is unknown. null, renders absent — a
 *           `$0.00` here would state a measurement nobody made, and it would
 *           drag down every average it enters (rule.forbid.failhide)
 *         - accounted runs, all refused: the spend is known to be nil, since a
 *           refusal never reached the brain. `$0` is the honest figure
 *
 * .note = what counts as `accounted` is `isRunAccounted`'s to say, never this
 *         operation's, so the predicate is stated once rather than duplicated.
 *
 * .note = input is `Pick`ed to the two fields this law reads, never the whole
 *         `ReviewRunMeter`, so a caller — a test fixture above all — builds those
 *         two fields with no cast over a partial object (rule.require.shapefit).
 */
export const getOneAccountedCost = (input: {
  runs: Array<Pick<ReviewRunMeter, 'grade' | 'cost'>>;
}): IsoPriceWords | null => {
  const accounted = getAllRunsAccounted({ runs: input.runs });
  if (accounted.length === 0) return null;

  const costs = getAllCostsOfRuns({ runs: accounted });
  if (costs.length === 0) return asIsoPrice('$0');

  return priceSum(...costs);
};

/**
 * .what = the priced total of each run that carries one, the unpriced dropped
 * .why = a refused run is accounted and has no price; it contributes a known nil,
 *        so it leaves the list rather than enter the sum as a guess
 */
const getAllCostsOfRuns = (input: {
  runs: Array<Pick<ReviewRunMeter, 'cost'>>;
}): IsoPriceWords[] =>
  input.runs
    .map((run) => run.cost?.total)
    .filter((cost): cost is IsoPriceWords => cost !== undefined);
