import { asMemberOfGlob } from './asMemberOfGlob';
import type { ReviewPartitionSplit } from './getAllTargetsByPartition';
import { isPathOfPartition } from './isPathOfPartition';

/**
 * .what = whether one declared glob claims any of a set of paths
 * .why = the one matcher a split uses, so a glob flagged here is one the split also ignored
 */
const isGlobOfAnyPath = (input: {
  slug: string;
  glob: string;
  paths: string[];
}): boolean => {
  const partition = {
    slug: input.slug,
    globs: [input.glob],
    members: [asMemberOfGlob({ glob: input.glob })],
  };
  return input.paths.some((path) => isPathOfPartition({ path, partition }));
};

/**
 * .what = every declared glob that claims none of the targets the split was checked against
 * .why = 🔴 a glob with a typo claims naught in silence: its files fall to `rest`, or to a
 *        partition the caller never meant, and coverage still passes. the one cheap signal
 *        is a glob that matched zero files — named here so a plan can flag it before any
 *        write or any brain cost
 *
 * .note = a partition's claimed targets are its common plus its narrow, so a glob's matches
 *         are counted within them — every file a glob matches is claimed by its partition
 * .note = a glob that claims the bound route is never flagged: every partition must hold the
 *         route spec, and a round whose diff left the spec untouched matches it to naught
 * .note = a zero is not always a typo: a subtree with no change this round matches naught
 *         too. the render says both, and the caller decides
 */
export const getAllGlobsUnmatchedOfSplit = (input: {
  split: ReviewPartitionSplit;
  /** the bound route, relative to cwd; null for none */
  route: string | null;
}): Array<{ slug: string; glob: string }> => {
  const probesOfRoute =
    input.route === null ? [] : [`${input.route}/0.wish.md`];
  return input.split.partitions.flatMap((partition) => {
    const paths = [...partition.common, ...partition.narrow, ...probesOfRoute];
    // an exclusion claims naught by design, so it is never flagged as a glob that claims none
    return partition.globs
      .filter((glob) => !asMemberOfGlob({ glob }).exclude)
      .filter((glob) => !isGlobOfAnyPath({ slug: partition.name, glob, paths }))
      .map((glob) => ({ slug: partition.name, glob }));
  });
};
