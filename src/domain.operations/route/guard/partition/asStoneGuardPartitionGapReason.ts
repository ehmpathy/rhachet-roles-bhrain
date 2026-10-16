import type { StoneGuardPartitionGap } from './StoneGuardPartitionGap';

/**
 * .what = the one-line reason a stone records when its partitions cannot hold the branch
 * .why = a later surface reads this reason alone, so it must name the cause in every gap
 *        shape — files no partition claims, partitions that lack the route spec, or both
 */
export const asStoneGuardPartitionGapReason = (input: {
  gaps: Pick<StoneGuardPartitionGap, 'unclaimed' | 'routeAbsentFrom'>[];
}): string => {
  const unclaimed = input.gaps.flatMap((gap) => gap.unclaimed);
  const routeAbsentFrom = input.gaps.flatMap((gap) => gap.routeAbsentFrom);
  const causes = [
    ...(unclaimed.length > 0
      ? [`no partition claims ${unclaimed.join(', ')}`]
      : []),
    ...(routeAbsentFrom.length > 0
      ? [`the route spec is absent from ${routeAbsentFrom.join(', ')}`]
      : []),
  ];
  return `peer review partitions cannot hold the branch: ${causes.join('; ')}`;
};
