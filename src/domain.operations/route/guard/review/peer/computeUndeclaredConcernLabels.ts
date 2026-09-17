import { asReviewConcernRefLabel } from './asReviewConcernRef';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';

/**
 * .what = of the concerns one given raised, the ones no stance yet covers
 * .why = TWO callers ask this question of the same corpus — the entrance gate, to know
 *        whether a round may start, and the stance ack, to tell the driver what the lane
 *        still owes. both were written inline, and both built their labels by template
 *        literal rather than through `asReviewConcernRefLabel`.
 *
 * 🔴 .the sharp part: the renderer was ALREADY declared, and both copies went around it.
 *
 *    `asReviewConcernRefLabel`'s own note states its purpose — "one renderer keeps the parse
 *    and the render from a drift the type system cannot see". a `${severity}.${ordinal}`
 *    template written elsewhere IS that drift, and it passes every test the day it is
 *    authored: the strings agree by coincidence, not by construction.
 *
 * ⚠️ and these labels are compared against `stance.about`, which `setStoneAsConcernAbsorbed` writes
 *    THROUGH that renderer. so a change to the label grammar that reached the renderer and
 *    not the two copies would break the match in silence — a concern would read undeclared
 *    forever, and the gate would refuse a round no driver could clear.
 *
 * .note = `also` carries a label the corpus does not yet hold. the stance ack asks this
 *         question after its own write, and it read the corpus before it — so the row just
 *         written is handed in here rather than bought with a second read of the ledger.
 */
export const computeUndeclaredConcernLabels = (input: {
  absorptions: ReviewAbsorption[];
  slug: string;
  pathGiven: string;
  blockers: number;
  nitpicks: number;
  also?: string[];
}): string[] => {
  // the concerns this given raised, by label, in report order
  const labelsRaised = [
    ...Array.from({ length: input.blockers }, (_, i) =>
      asReviewConcernRefLabel({ ref: { kind: 'blocker', ordinal: i + 1 } }),
    ),
    ...Array.from({ length: input.nitpicks }, (_, i) =>
      asReviewConcernRefLabel({ ref: { kind: 'nitpick', ordinal: i + 1 } }),
    ),
  ];

  // the labels a stance already covers, scoped to THIS given
  const labelsDeclared = new Set([
    ...input.absorptions
      .filter(
        (one) => one.reviewer === input.slug && one.given === input.pathGiven,
      )
      .map((one) => one.about),
    ...(input.also ?? []),
  ]);

  return labelsRaised.filter((one) => !labelsDeclared.has(one));
};
