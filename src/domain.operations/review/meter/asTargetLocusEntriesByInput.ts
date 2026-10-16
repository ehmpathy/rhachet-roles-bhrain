import {
  NAMES_OF_TARGET_INPUT,
  type TargetInputName,
} from '@src/domain.operations/review/asTargetContentsByInput';
import { asTargetLocusEntries } from '@src/domain.operations/review/meter/asTargetLocusEntries';

/**
 * .what = casts the per-input target contents into per-input locus entries
 * .why = the overflow refusal and the run report both address the target mass by
 *        named input; one cast over `NAMES_OF_TARGET_INPUT` means a new input is
 *        addressed at both with no edit (rule.require.distinguish-every-review-input)
 */
export const asTargetLocusEntriesByInput = (input: {
  byInput: Record<TargetInputName, { path: string; content: string }[]>;
}): Record<TargetInputName, { path: string; chars: number }[]> =>
  Object.fromEntries(
    NAMES_OF_TARGET_INPUT.map((name) => [
      name,
      asTargetLocusEntries({ targets: input.byInput[name] }),
    ]),
  ) as Record<TargetInputName, { path: string; chars: number }[]>; // fromEntries widens keys to string; the map above covers every TargetInputName
