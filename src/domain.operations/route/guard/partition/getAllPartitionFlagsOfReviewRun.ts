// a sanctioned exposure, declared in src/domain.operations/review/.readme.md
import { asReviewRouteOfOutput } from '@src/domain.operations/review/asReviewRouteOfOutput';
import { asReviewRunIdentity } from '@src/domain.operations/review/asReviewRunIdentity';

import { asRouteGuardPartitionCommand } from './asRouteGuardPartitionCommand';
import { asRouteGuardPartitionPeerKey } from './asRouteGuardPartitionPeerKey';
import { getAllPartitionFlagsOfReviewer } from './getAllPartitionFlagsOfReviewer';
import { getOneRouteGuardPartitions } from './getOneRouteGuardPartitions';

/**
 * .what = the `--partition` values a route declares for the reviewer one review run serves,
 *         and the `route.guard.partition` command that re-declares that set
 * .why = a route declares its partitions once, and every reviewer reuses them (seed S45). a
 *        guarded run learns its route, stone, and reviewer from the output path the guard
 *        gave it, so its caller reads the declaration here and hands the flags to the review.
 *        the command rides beside them, so a run whose split refuses can print the repaired
 *        set paste-ready, under the very scope the set is held in (rule.forbid.workarounds)
 *
 * .note = the read lives in the route context, which owns the declaration. the review context
 *         receives plain flags and plain command text, and never reaches into route internals
 *         (rule.forbid.scope-leaks)
 * .note = a run outside a route guard — a hand run, a wrapper that writes elsewhere — has no
 *         route identity, and so reads none
 */
export const getAllPartitionFlagsOfReviewRun = async (input: {
  /** the run's output path, which carries the guard's identity */
  output: string;
  cwd: string;
}): Promise<{
  partition: string[];
  /** the command that re-declares the set; null where the route declares none */
  command: { head: string; tail: string } | null;
}> => {
  // a run outside a route guard has no declaration to read
  const identity = asReviewRunIdentity({ output: input.output });
  const route = asReviewRouteOfOutput({ output: input.output, cwd: input.cwd });
  if (!identity || !route) return { partition: [], command: null };

  // the route's set for this reviewer: its override, else the standard set
  const declared = await getOneRouteGuardPartitions({ route, cwd: input.cwd });
  const partition = getAllPartitionFlagsOfReviewer({
    declared,
    stone: identity.stone,
    peer: identity.slug,
  });
  if (partition.length === 0) return { partition, command: null };

  // the scope that set is held under: the reviewer's override, else @all
  const isOverride =
    asRouteGuardPartitionPeerKey({
      stone: identity.stone,
      peer: identity.slug,
    }) in declared.byPeer;
  return {
    partition,
    command: asRouteGuardPartitionCommand({
      route,
      scope: isOverride
        ? { kind: 'peer', stone: identity.stone, peer: identity.slug }
        : { kind: 'all' },
    }),
  };
};
