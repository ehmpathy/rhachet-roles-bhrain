import * as path from 'path';

/**
 * .what = where one partition of a split review, or its prime, writes its own report
 * .why = the lane's `--output` holds the merged report, so each partition writes beside it,
 *        one level down: `<dir>/.partition=<n>.<slug>/<same basename>`
 *
 * .note = 🔴 the prime is a NAMED variant (`of: 'prime'`), never a sentinel index. it writes
 *         to `.partition=0.prime/`: ordinal 0 sits ahead of every partition, whose ordinals
 *         run from 1, so the prime can never share a dir with one (rule.forbid.magic-values)
 * .note = 🔴 the basename is kept whole. the meter recovers a run's stone, round, and slug
 *         from it (`asReviewRunIdentity`), so a partition run is attributed to the lane that
 *         split it. the dot-dir keeps it out of the peer givens a guard reads, whose globs
 *         sit one level up and do not descend
 * .note = the ordinal leads the slug, so two partitions whose names slug alike (`a/b`, `a-b`)
 *         never share a dir
 * .note = not `asSanitizedPeerReviewSlug`, deliberately. that one swaps path separators only,
 *         and must stay reversible to a config slug a driver types. a partition name is a glob
 *         (`{src,blackbox}`, `**`), whose metacharacters it would pass into a dir name; this
 *         slug is never typed back, so it may drop every character a path cannot hold
 */
export const asReviewPartitionOutputPath = (input: {
  output: string;
  of:
    | 'prime'
    | {
        name: string;
        /** the partition's position in the declared order, from 0 */
        index: number;
      };
}): string => {
  // the prime's dir is named outright
  if (input.of === 'prime')
    return path.join(
      path.dirname(input.output),
      '.partition=0.prime',
      path.basename(input.output),
    );

  // a partition's dir is its ordinal and its name, reduced to what a dir name can hold
  const slug =
    input.of.name
      .replace(/[()]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'partition';
  return path.join(
    path.dirname(input.output),
    `.partition=${input.of.index + 1}.${slug}`,
    path.basename(input.output),
  );
};
