import { asTargetSection, type ReviewTarget } from './asTargetSection';

/**
 * .what = the target section, split by reuse breadth: the band every lane or partition
 *         shares, for the head, and a partition's own band, for the tail
 * .why = reuse BREADTH is key 1 of a prompt's order
 *        (`rule.require.order-prompt-bytes-by-reuse-breadth`). the head is what every
 *        lane of a level and every partition of a split sends byte for byte, so only the
 *        shared band may ride in it. a partition's own band rides behind the lane's rubric,
 *        so the partitions of one lane still share that rubric
 *        (rule.forbid.shared-bytes-behind-narrow-bytes).
 *
 * 🔴 .note = the shared band must lead, never trail. one kind group over a partition's
 *         whole list put its OWN edited bodies ahead of the shared route files (they
 *         render as additions, in the diff group), so the prefix parted at the first
 *         narrow byte. measured 2026-10-12, `5.3.verification i004`, partition `14.cli`:
 *         75k chars of its own bodies led 1.07M chars of shared route, and the run cached
 *         0.3%. each band holds its own kind groups, so volatility orders WITHIN a band
 *         and never across one
 *
 * .note = a whole run has no `shared` list: every target is shared by the lanes of its
 *         level, so all of it is the head band and the tail has none
 *
 * .note = a pull partition splits its path list the same way. a path list is small, so
 *         its own bytes are not the gain — the rubric behind it is. one band per partition
 *         would part every partition's head at its first own path, and the lane's rubric,
 *         which trails the head, would then be a shared prefix of none
 *
 * .note = a partition with no shared target still renders an empty head band, so the
 *         head keeps its target block and the census its marker
 */
export const asTargetSectionsByBreadth = (input: {
  targets: ReviewTarget[];
  focus: 'pull' | 'push';
  /** the base `git diff` runs against — null where the scope names none */
  diffRange: string | null;
  /** the paths every partition of a split carries — null on a whole run */
  shared: string[] | null;
}): { shared: string; narrow: string | null } => {
  // a whole run: one band, every byte of it shared
  if (input.shared === null)
    return {
      shared: asTargetSection({
        targets: input.targets,
        focus: input.focus,
        diffRange: input.diffRange,
      }),
      narrow: null,
    };

  // a partition: the shared band for the head, its own band for the tail
  const paths = new Set(input.shared);
  const narrow = input.targets.filter((target) => !paths.has(target.path));
  return {
    shared: asTargetSection({
      targets: input.targets.filter((target) => paths.has(target.path)),
      focus: input.focus,
      diffRange: input.diffRange,
    }),
    narrow:
      narrow.length > 0
        ? asTargetSection({
            targets: narrow,
            focus: input.focus,
            diffRange: input.diffRange,
          })
        : null,
  };
};
