import { asIsoPrice, type IsoPriceWords } from 'iso-price';

import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';
import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

/**
 * .what = casts a run's recorded `cost.total` to a price, or names the artifact torn
 * .why = a total that is present but no price (`5`, `''`, `"$abc"`) is a torn artifact, the
 *        same as a total that is absent. iso-price refuses it with its own error class, and
 *        the meter isolates per run only a `ReviewRunArtifactError` — so an unwrapped
 *        refusal would take down a whole `--of grove` report over one corrupt file, where
 *        it should grade that one run `unknown` and name its dir
 * .note = only the two classes iso-price's cast throws on bad input are recast — its own
 *         `BadRequestError`, and the `SyntaxError` its amount parse raises on text like
 *         `"$abc"`. any other throw surfaces as itself (rule.forbid.failhide)
 */
const CLASSES_OF_CAST_FAULT = ['BadRequestError', 'SyntaxError'];

export const asIsoPriceOfRunArtifact = (input: {
  dir: string;
  costTotal: Parameters<typeof asIsoPrice>[0];
}): IsoPriceWords => {
  try {
    return asIsoPrice(input.costTotal);
  } catch (error) {
    const isCastFault = getAllErrorClassNames({ error }).some((name) =>
      CLASSES_OF_CAST_FAULT.includes(name),
    );
    if (!isCastFault) throw error;
    throw new ReviewRunArtifactError(
      'metrics.realized.json states a cost.total that is no price',
      { dir: input.dir, costTotal: input.costTotal, error: String(error) },
    );
  }
};
