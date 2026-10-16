import {
  NAMES_OF_TARGET_INPUT,
  type TargetInputName,
} from '@src/domain.operations/review/asTargetContentsByInput';
import { getOneLocusChars } from '@src/domain.operations/review/meter/getOneLocusChars';

/**
 * .what = the chars a split's locus carries across every named target input
 * .why = the denominator each split row's share is taken over; summed over the
 *        closed set of input names, so an input with no rows adds zero rather than
 *        drops out of the total
 */
export const getOneLocusCharsTotal = (input: {
  locus: Record<TargetInputName, { chars: number }[]>;
}): number =>
  NAMES_OF_TARGET_INPUT.reduce(
    (total, name) => total + getOneLocusChars({ rows: input.locus[name] }),
    0,
  );
