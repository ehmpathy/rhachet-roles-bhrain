import { asErrorHeadline } from '@src/domain.operations/review/asErrorHeadline';
import { isErrorOfBadRequest } from '@src/domain.operations/review/isErrorOfBadRequest';
import { isErrorOfTransientBrainFault } from '@src/domain.operations/review/isErrorOfTransientBrainFault';
import { ReviewBrainCallError } from '@src/domain.operations/review/ReviewBrainCallError';
import { ReviewTimeoutError } from '@src/domain.operations/review/ReviewTimeoutError';

/**
 * .what = the four kinds of partition fault, by what clears each
 * .why = the recovery text keys off this one classification, so the branch lives behind a name
 */
export type PartitionFaultKind =
  | 'transient'
  | 'malfunction'
  | 'constraint.alone'
  | 'constraint.lane-wide';

/**
 * .what = classifies a partition fault by what clears it
 * .why = a constraint is a refusal a re-run repeats; a lane where every partition refused on
 *        the same headline holds one cause, never N; a malfunction of our own code (a buffer
 *        overrun, a TypeError) repeats on a re-run as surely as a refusal does — only a
 *        provider fault or a timeout is transient
 */
export const asPartitionFaultKind = (input: {
  error: unknown;
  /** every fault of this lane's pour, this one among them */
  faults: { error: unknown }[];
  /** how many partitions the lane poured */
  partitionsTotal: number;
}): PartitionFaultKind => {
  // a fault that is no constraint either clears on a re-run, or is a malfunction to repair
  if (!isPartitionFaultConstraint({ error: input.error }))
    return isPartitionFaultTransient({ error: input.error })
      ? 'transient'
      : 'malfunction';

  // a constraint that every partition met, verbatim, is the lane's one cause
  const headline = asErrorHeadline({ error: input.error });
  const isLaneWide =
    input.faults.length === input.partitionsTotal &&
    input.faults.every(
      (fault) =>
        isPartitionFaultConstraint({ error: fault.error }) &&
        asErrorHeadline({ error: fault.error }) === headline,
    );
  return isLaneWide ? 'constraint.lane-wide' : 'constraint.alone';
};

/**
 * .what = whether a partition fault is a constraint — a refusal the caller must clear
 * .why = `ConstraintError` extends `BadRequestError`, and the overflow refusal throws the
 *        latter, so one class read covers both. it reads by NAME (`isErrorOfBadRequest`),
 *        the one class grammar of this subsystem, since a partition fault may come from a
 *        brain call whose copy of `helpful-errors` is not this repo's
 */
const isPartitionFaultConstraint = (input: { error: unknown }): boolean =>
  isErrorOfBadRequest({ error: input.error });

/**
 * .what = whether a partition fault is transient — one a re-run may well clear
 * .why = only the brain's side fails by chance: a provider fault (`ReviewBrainCallError`,
 *        already retried once by `withOneRetryOnBrainCallFault`), a deadline the provider
 *        overran (`ReviewTimeoutError`), or a raw 5xx / rate limit / dropped socket
 *        (`isErrorOfTransientBrainFault`). every other fault is a malfunction of the review
 *        itself, and an honest section must not promise that a re-run clears it
 */
const isPartitionFaultTransient = (input: { error: unknown }): boolean =>
  input.error instanceof ReviewBrainCallError ||
  input.error instanceof ReviewTimeoutError ||
  isErrorOfTransientBrainFault({ error: input.error });
