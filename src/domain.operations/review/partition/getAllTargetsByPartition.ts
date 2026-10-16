import { isPathOfRouteSpec } from '@src/domain.operations/review/isPathOfRouteSpec';

import type { ReviewPartitionDeclared } from './asReviewPartitionsFromFlags';
import { isPathOfPartition } from './isPathOfPartition';

/**
 * .what = one partition of a run, with the targets it carries, split by reuse breadth
 * .why = `common` and `narrow` name how many partitions carry each target — two or more,
 *        or this one alone — which is the first key of the prompt order
 *        (`rule.require.order-prompt-bytes-by-reuse-breadth`): common leads, narrow trails
 */
export interface ReviewPartitionOfTargets {
  /** the partition's slug */
  name: string;
  /** the globs as declared, verbatim */
  globs: string[];
  /**
   * the targets this partition shares with at least one other, widest share first, then in
   * the order the run asked for them — so the partitions that carry the most of them agree
   * on the longest prefix
   */
  common: string[];
  /** the targets this partition alone claims, in the order the run asked for them */
  narrow: string[];
  /**
   * the common targets this partition GRADES — those it is the first declared to list.
   * the rest of its common targets it reads as context only, so a concern is never counted
   * twice (seed S44)
   */
  commonGraded: string[];
}

/**
 * .what = a run's targets, split across its declared partitions
 */
export interface ReviewPartitionSplit {
  partitions: ReviewPartitionOfTargets[];
  /** every target two or more partitions carry */
  common: string[];
  /** targets no partition claims — each refuses the run, since a split would drop it */
  unclaimed: string[];
  /** the slugs of the partitions that lack the bound route; empty when no route is bound */
  routeAbsentFrom: string[];
}

/**
 * .what = the paths that stand for the bound route, to test whether a partition holds it
 * .why = the route's own targets, where the run carries any; else one probe path beneath
 *        the route dir, so a partition that names the route is recognized even on a round
 *        whose diff touched no route file
 */
const asRouteProbePaths = (input: {
  targets: string[];
  route: string;
}): string[] => {
  const ofRoute = input.targets.filter((path) =>
    isPathOfRouteSpec({ path, route: input.route }),
  );
  return ofRoute.length > 0 ? ofRoute : [`${input.route}/0.wish.md`];
};

/**
 * .what = splits a run's targets across its declared partitions, and computes their overlap
 * .why = 🔴 the overlap is COMPUTED, never declared (seed S44): a target two or more
 *        partitions claim is `common`, a target one claims is `narrow`. a common target is
 *        graded once, by the first partition declared to list it, and read as context in
 *        the rest
 *
 * .note = the unclaimed targets and the route check are returned, never thrown: the caller
 *         decides how to refuse, and the plan render shows them too
 */
export const getAllTargetsByPartition = (input: {
  targets: string[];
  partitions: ReviewPartitionDeclared[];
  /** the route this run was driven from, which every partition must hold; null for none */
  route: string | null;
}): ReviewPartitionSplit => {
  // the partitions that claim each target, in declared order
  const claimsOf = asClaimsOfTargets({
    targets: input.targets,
    partitions: input.partitions,
  });
  const breadthOf = (path: string): number => claimsOf.get(path)?.length ?? 0;

  // the overlap, widest share first, then in the run's order
  const common = asOverlapByBreadth({ targets: input.targets, breadthOf });
  const unclaimed = getAllUnclaimedOfPartition({
    targets: input.targets,
    breadthOf,
  });

  // each partition's share of the split
  const partitions = input.partitions.map((partition) =>
    asShareOfPartition({
      partition,
      targets: input.targets,
      common,
      claimsOf,
    }),
  );

  // every partition must hold the bound route — it is the spec each one grades against
  const routeAbsentFrom = getAllRouteAbsentPartitions({
    partitions: input.partitions,
    targets: input.targets,
    route: input.route,
  });

  return { partitions, common, unclaimed, routeAbsentFrom };
};

/**
 * .what = the targets no partition claims, in the run's order
 * .why = a named projection, so the split reads "the unclaimed targets" rather than a
 *        breadth filter to simulate (rule.forbid.inline-decode-friction)
 */
const getAllUnclaimedOfPartition = (input: {
  targets: string[];
  breadthOf: (path: string) => number;
}): string[] => input.targets.filter((path) => input.breadthOf(path) === 0);

/**
 * .what = the slugs of the partitions that lack the bound route; empty when none is bound
 * .why = a named projection, so the split reads "which partitions lack the route" rather
 *        than a ternary over a negated filter to simulate (rule.forbid.inline-decode-friction)
 * .note = the probe list is built once, never per partition
 */
const getAllRouteAbsentPartitions = (input: {
  partitions: ReviewPartitionDeclared[];
  targets: string[];
  route: string | null;
}): string[] => {
  // no bound route, no spec to require
  if (input.route === null) return [];

  // the slugs whose partition misses any probe of the route
  const probes = asRouteProbePaths({
    targets: input.targets,
    route: input.route,
  });
  return input.partitions
    .filter((partition) => !isPartitionWithRoute({ partition, probes }))
    .map((partition) => partition.slug);
};

/**
 * .what = the partitions that claim each target, in declared order
 * .why = one named map, so the split reads "claims of each target" rather than a nested
 *        map/filter to simulate (rule.forbid.inline-decode-friction)
 */
const asClaimsOfTargets = (input: {
  targets: string[];
  partitions: ReviewPartitionDeclared[];
}): Map<string, ReviewPartitionDeclared[]> =>
  new Map(
    input.targets.map((path) => [
      path,
      input.partitions.filter((partition) =>
        isPathOfPartition({ path, partition }),
      ),
    ]),
  );

/**
 * .what = whether a partition claims a target
 */
const isClaimedBy = (input: {
  path: string;
  partition: ReviewPartitionDeclared;
  claimsOf: Map<string, ReviewPartitionDeclared[]>;
}): boolean =>
  input.claimsOf.get(input.path)?.includes(input.partition) ?? false;

/**
 * .what = whether a target is narrow to a partition — it alone claims it
 */
const isNarrowTo = (input: {
  path: string;
  partition: ReviewPartitionDeclared;
  claimsOf: Map<string, ReviewPartitionDeclared[]>;
}): boolean =>
  input.claimsOf.get(input.path)?.length === 1 && isClaimedBy(input);

/**
 * .what = whether a partition grades a common target — it is the first declared to claim it
 * .why = a common target is graded once, so a concern is never counted twice (seed S44)
 */
const isGradedBy = (input: {
  path: string;
  partition: ReviewPartitionDeclared;
  claimsOf: Map<string, ReviewPartitionDeclared[]>;
}): boolean => input.claimsOf.get(input.path)?.[0] === input.partition;

/**
 * .what = one partition's share of the split — its common, narrow, and graded targets
 * .why = a named projection, so the split reads "each partition's share" rather than
 *        three inline filters with compound predicates to simulate
 *        (rule.forbid.inline-decode-friction)
 */
const asShareOfPartition = (input: {
  partition: ReviewPartitionDeclared;
  targets: string[];
  common: string[];
  claimsOf: Map<string, ReviewPartitionDeclared[]>;
}): ReviewPartitionOfTargets => {
  const { partition, claimsOf } = input;
  return {
    name: partition.slug,
    globs: partition.globs,
    common: input.common.filter((path) =>
      isClaimedBy({ path, partition, claimsOf }),
    ),
    narrow: input.targets.filter((path) =>
      isNarrowTo({ path, partition, claimsOf }),
    ),
    // a target the partition grades is claimed by it by construction, so no second test
    commonGraded: input.common.filter((path) =>
      isGradedBy({ path, partition, claimsOf }),
    ),
  };
};

/**
 * .what = the targets two or more partitions claim, widest share first, then in the run's order
 * .why = one named overlap, so the split reads "the overlap by breadth" rather than a
 *        filter/map/sort to simulate (rule.forbid.inline-decode-friction)
 */
const asOverlapByBreadth = (input: {
  targets: string[];
  breadthOf: (path: string) => number;
}): string[] =>
  [
    ...input.targets
      .filter((path) => input.breadthOf(path) >= 2)
      .map((path, index) => ({ path, index, breadth: input.breadthOf(path) })),
  ] // cloned, so the sort's safety rests on this expression, never on the line above
    .sort((a, b) => asOverlapOrder({ a, b }))
    .map((one) => one.path);

/**
 * .what = the overlap rank: widest share first, then the run's own order
 * .why = one named order, so the sort reads as "by reuse breadth" — breadth is the first
 *        key of the prompt order (`rule.require.order-prompt-bytes-by-reuse-breadth`), and
 *        the index tiebreak keeps the run's order within a breadth
 */
const asOverlapOrder = (input: {
  a: { index: number; breadth: number };
  b: { index: number; breadth: number };
}): number =>
  input.b.breadth - input.a.breadth || input.a.index - input.b.index;

/**
 * .what = whether a partition holds the bound route — every probe path of it
 * .why = a named predicate, so the route check reads as "which partitions lack the
 *        route" rather than a negated `every` to simulate
 */
const isPartitionWithRoute = (input: {
  partition: ReviewPartitionDeclared;
  probes: string[];
}): boolean =>
  input.probes.every((path) =>
    isPathOfPartition({ path, partition: input.partition }),
  );
