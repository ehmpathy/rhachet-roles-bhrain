import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

/**
 * .what = whether one locus entry carries the shape the writer declares
 */
const isLocusEntry = (
  value: unknown,
): value is { path: string; chars: number } =>
  typeof value === 'object' &&
  value !== null &&
  'path' in value &&
  typeof value.path === 'string' &&
  'chars' in value &&
  typeof value.chars === 'number';

/**
 * .what = reads the `locus` row of a `metrics.compiled.json`, graded
 * .why = the row lets a fold name a directory from kilobytes. three states, and
 *        each must survive the read as itself:
 *
 *        - absent or `null` → `null`, UNREAD. every run compiled before the row
 *          existed carries no locus, and that is not a claim that it placed none
 *        - an array of `{ path, chars }` → the measured locus; `[]` is a fact
 *        - aught else → a malformed artifact, which fails loud rather than read as
 *          an absent one (rule.forbid.failhide)
 */
export const asCompiledLocus = (input: {
  value: unknown;
  dir: string;
}): { path: string; chars: number }[] | null => {
  // absent and null both mean UNREAD — the row was never written, or the walk failed
  if (input.value === undefined || input.value === null) return null;

  // a present row of the right shape is the measured answer
  if (Array.isArray(input.value) && input.value.every(isLocusEntry))
    return input.value;

  // a present row of any other shape is corrupt
  throw new ReviewRunArtifactError(
    'metrics.compiled.json carries a locus row that is not a list of { path, chars }',
    { dir: input.dir, locus: input.value },
  );
};
