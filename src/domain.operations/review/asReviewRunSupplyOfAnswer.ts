import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';

/**
 * .what = the served provider and generation id of one brain answer, or nulls
 *         where the brain package reported none
 *
 * .why = `rhachet-brains-openrouter` returns a `SupplyReport` as `output.supply`
 *        on every answer (`provider`, `generationId`, the floor walk). rhachet's
 *        `BrainOutput` type declares no slot for it yet, so the field rides at
 *        runtime beside the declared ones — the package's own note says so. it is
 *        read here by shape, never by an `as` cast, and any other brain yields nulls
 *
 * .note = only the two fields a zero cache read needs are kept. the floor walk is
 *         the package's audit trail, and it can run to many hops
 */
export const asReviewRunSupplyOfAnswer = (input: {
  answer: object;
}): ReviewRunMetricsRealized['supply'] => {
  // the supply the package attached, if any
  const supply = 'supply' in input.answer ? input.answer.supply : null;
  if (typeof supply !== 'object' || supply === null)
    return { provider: null, generationId: null };

  // each field is kept only where it is a string, so a shape change upstream
  // reads as "unreported" rather than as a wrong value
  const provider =
    'provider' in supply && typeof supply.provider === 'string'
      ? supply.provider
      : null;
  const generationId =
    'generationId' in supply && typeof supply.generationId === 'string'
      ? supply.generationId
      : null;
  return { provider, generationId };
};
