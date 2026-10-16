import { isErrorOfBadRequest } from '@src/domain.operations/review/isErrorOfBadRequest';
import { ReviewBrainCallError } from '@src/domain.operations/review/ReviewBrainCallError';

/**
 * .what = the error a failed brain call rethrows as
 * .why = a caller fault keeps its class, so the cli still exits 2 on it; every
 *        other fault is the provider's, and wears the malfunction header
 *
 * .note = the caller-fault test reads the class by NAME (`isErrorOfBadRequest`), since
 *         the throw arrives through `rhachet`, which may load its own copy of
 *         `helpful-errors`. the `as` passes the caught value on unchanged: a value whose
 *         prototype chain names `BadRequestError` extends `Error`
 */
export const asReviewBrainCallFault = (input: { error: unknown }): Error => {
  if (isErrorOfBadRequest({ error: input.error })) return input.error as Error;
  return new ReviewBrainCallError({ error: input.error });
};
