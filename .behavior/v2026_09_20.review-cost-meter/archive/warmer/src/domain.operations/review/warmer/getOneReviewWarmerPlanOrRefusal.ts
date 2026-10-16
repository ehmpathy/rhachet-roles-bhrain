import { isErrorOfBadRequest } from '../isErrorOfBadRequest';
import {
  asReviewWarmerPlan,
  type ReviewWarmerPlan,
} from './asReviewWarmerPlan';
import { asWarmerRefusalBody } from './asWarmerRefusalBody';

/**
 * .what = parses `--warmer` into a plan, or into the refusal a caller must print
 * .why = the cli must refuse a malformed `--warmer` at the door, before a
 *        review is paid for, and a silent fall back to a default would spend
 *        on a cadence the caller did not ask for. the parse, the class check,
 *        and the refusal body are one decision, so they live under one name
 *        rather than inline at the entrypoint
 *
 * .note = only a BadRequestError is a caller's defect and becomes a refusal;
 *         every other class is a defect in this code and rethrows as itself
 *         (rule.forbid.failhide)
 */
export const getOneReviewWarmerPlanOrRefusal = (input: {
  flag: string | boolean | undefined;
}):
  | { plan: ReviewWarmerPlan | null; refusal: null }
  | { plan: null; refusal: string } => {
  try {
    return { plan: asReviewWarmerPlan({ flag: input.flag }), refusal: null };
  } catch (error) {
    // by constructor name, the one class grammar this subsystem keeps
    if (!isErrorOfBadRequest({ error })) throw error;
    return { plan: null, refusal: asWarmerRefusalBody({ error }) };
  }
};
