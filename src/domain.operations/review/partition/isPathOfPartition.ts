import { isPathMatchedByGlob } from '@src/domain.operations/review/isPathMatchedByGlob';

import type {
  ReviewPartitionDeclared,
  ReviewPartitionMember,
} from './asReviewPartitionsFromFlags';

/**
 * .what = whether one declared member claims a path
 * .why = a prefix claims the path itself and every path beneath it; a glob claims what
 *        it matches
 */
const isPathOfMember = (input: {
  path: string;
  member: ReviewPartitionMember;
}): boolean => {
  if (input.member.kind === 'glob')
    return isPathMatchedByGlob({ path: input.path, glob: input.member.value });
  return (
    input.path === input.member.value ||
    input.path.startsWith(`${input.member.value}/`)
  );
};

/**
 * .what = the test file a jest snapshot pins — `D/__snapshots__/F.snap` → `D/F` — or null
 *         when the path is no snapshot
 * .why = a snapshot is half of its test: it belongs wherever that test belongs, so a glob
 *        that claims a test by its stem need not name the snapshot dir beside it
 */
export const asSubjectOfSnapshot = (input: { path: string }): string | null => {
  const match = /^(.*\/)?__snapshots__\/([^/]+)\.snap$/.exec(input.path);
  if (!match) return null;
  return `${match[1] ?? ''}${match[2]}`;
};

/**
 * .what = whether a declared partition claims a path
 * .why = the one test the split and the lane reader share, so a path a split assigns to a
 *        partition is the same path the lane reader finds in it
 *
 * .note = a snapshot is claimed by each partition that claims it OR the test it pins, so a
 *         resnap never strands a `.snap` outside the partition of its own test
 */
export const isPathOfPartition = (input: {
  path: string;
  partition: ReviewPartitionDeclared;
}): boolean => {
  // the paths that stand for this one: itself, and the test it pins if it is a snapshot
  const subject = asSubjectOfSnapshot({ path: input.path });
  const paths = subject === null ? [input.path] : [input.path, subject];

  // claimed where an inclusion matches and no exclusion does
  // .note = an exclusion that names a test excludes its snapshot too, as an inclusion does
  const members = input.partition.members;
  const isMatchedBy = (by: { exclude: boolean }): boolean =>
    paths.some((path) =>
      members
        .filter((member) => member.exclude === by.exclude)
        .some((member) => isPathOfMember({ path, member })),
    );
  return isMatchedBy({ exclude: false }) && !isMatchedBy({ exclude: true });
};
