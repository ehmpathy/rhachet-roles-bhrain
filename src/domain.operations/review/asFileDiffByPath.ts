import type { FileDiff } from '@src/domain.operations/git/getAllFileDiffsFromRange';

/**
 * .what = casts a diff list into a lookup keyed by path
 * .why = the render plan needs one diff by path, twice; a linear `.find` per
 *        target is O(n^2) on a large corpus, so the lookup is built once
 *        (`rule.forbid.inline-decode-friction`)
 *
 * .note = a path collision keeps the LAST diff, per `Map`'s own semantics.
 *         `getAllFileDiffsFromRange` yields one diff per path, so a collision
 *         is a defect upstream, not a case to handle here.
 */
export const asFileDiffByPath = (input: {
  of: FileDiff[];
}): Map<string, FileDiff> =>
  new Map(input.of.map((diff) => [diff.path, diff] as const));
