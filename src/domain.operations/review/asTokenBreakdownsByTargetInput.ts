import {
  NAMES_OF_TARGET_INPUT,
  type TargetInputName,
} from '@src/domain.operations/review/asTargetContentsByInput';
import { genTokenBreakdownReport } from '@src/domain.operations/review/genTokenBreakdownReport';
import type { Breakdown } from '@src/domain.operations/review/setTokenArtifacts';

/**
 * .what = casts the per-input target contents into one token breakdown per named input
 * .why = the token artifacts address the target mass by named input, as the locus does
 *        (`asTargetLocusEntriesByInput`); one cast over `NAMES_OF_TARGET_INPUT` means a new
 *        input is broken down with no edit (rule.require.distinguish-every-review-input)
 */
export const asTokenBreakdownsByTargetInput = (input: {
  byInput: Record<TargetInputName, { path: string; content: string }[]>;
}): Record<TargetInputName, Breakdown> =>
  Object.fromEntries(
    NAMES_OF_TARGET_INPUT.map((name) => [
      name,
      genTokenBreakdownReport({ files: input.byInput[name] }),
    ]),
  ) as Record<TargetInputName, Breakdown>; // fromEntries widens keys to string; the map above covers every TargetInputName
