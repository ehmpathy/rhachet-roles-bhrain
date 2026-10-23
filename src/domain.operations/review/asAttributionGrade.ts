import type { AttributionGrade } from '@src/domain.objects/Reviewer/AttributionGrade';

/**
 * .what = reads a grade off disk, or null when the artifact states none
 * .why = older artifacts predate this field. a cast would read an absent
 *        field, or a future grade, as one of these two (rule.forbid.as-cast).
 *
 * .note = answers `null`, never `'attributed'`, for an unknown value — to
 *         default it to the clean grade would failhide (rule.forbid.failhide).
 *         return type is the `AttributionGrade` union itself, so a third
 *         grade coined there turns this reader red until admitted.
 */
export const asAttributionGrade = (input: {
  value: unknown;
}): AttributionGrade | null =>
  input.value === 'attributed' || input.value === 'unattributed'
    ? input.value
    : null;
