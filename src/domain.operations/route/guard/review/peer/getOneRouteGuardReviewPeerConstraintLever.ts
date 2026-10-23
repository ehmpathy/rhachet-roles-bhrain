import { getOneRouteGuardReviewPeerGiven } from './getOneRouteGuardReviewPeerGiven';

/**
 * .what = the lever the refused reviewers' .given artifacts name — whether any refusal was an
 *         overflow, and the `--partition` values they proposed, once each, in proposal order
 * .why = a constraint halt leads with the lever the refusal chose. only an overflow is cured
 *        by a partition or a narrower bind; an unknown flag, an absent rubric, or a bad glob
 *        is refused too, and to offer it a partition sends the driver down the wrong road.
 *        so the halt reads each refused .given here, once, and learns which refusal it holds
 *
 * .note = a .given that is gone, or that holds no refusal, names no lever
 */
export const getOneRouteGuardReviewPeerConstraintLever = async (input: {
  /** the paths of the refused reviewers' .given artifacts */
  paths: string[];
}): Promise<{ overflowed: boolean; partitions: string[] }> => {
  // read each refused .given, in parallel
  const givens = await Promise.all(
    input.paths.map((path) => getOneRouteGuardReviewPeerGiven({ path })),
  );
  const constraints = givens.flatMap((given) =>
    given?.constraint ? [given.constraint] : [],
  );

  // the partitions each overflow proposed, once each, in the order proposed
  return {
    overflowed: constraints.some((constraint) => constraint.overflowed),
    partitions: [
      ...new Set(
        constraints
          .filter((constraint) => constraint.overflowed)
          .flatMap((constraint) => constraint.partitions),
      ),
    ],
  };
};
