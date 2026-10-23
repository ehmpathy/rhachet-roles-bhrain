import { isErrorOfBadRequest } from '@src/domain.operations/review/isErrorOfBadRequest';

/**
 * .what = whether a fault is a refusal no brain billed
 * .why = a constraint — an overflow refusal, a bad input, a provider's 400 — is raised before
 *        the brain call or rejected by the provider unbilled, so its spend is truly nil. any
 *        other fault (a deadline overrun, a dropped socket, a 5xx) may land after the
 *        provider billed, so its spend is unknown, never zero
 *
 * .note = 🔴 the ONE predicate for "this fault cost naught". a split lane reads it over the
 *         runs that threw and the faults its partition retry swallowed; a single run reads it
 *         over the faults its transient retry swallowed. one home, so no seat can grade a
 *         fault billed that another grades free
 */
export const isFaultOfUnbilledCall = (fault: { error: unknown }): boolean =>
  isErrorOfBadRequest({ error: fault.error });
