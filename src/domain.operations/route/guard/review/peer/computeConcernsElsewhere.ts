import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';
import { computeUndeclaredConcerns } from './getStoneUndeclaredConcerns';

/**
 * .what = how many concerns the stone still owes a stance on, across every lane EXCEPT the one
 *         just declared
 * .why = the stance ack must tell a driver whether a cleared THIS lane leaves the stone clear or
 *        not (r9 n2). the write-orchestrator had folded that inline with a
 *        `computeUndeclaredConcerns(...).filter(lane => lane.slug !== slug).reduce(...)` chain —
 *        a two-step fold a reader must simulate (rule.forbid.inline-decode-friction). one named
 *        transformer answers "what do OTHER lanes still owe", so the orchestrator reads as
 *        narrative and the key cannot drift.
 *
 * .note = it folds through the SAME pure `computeUndeclaredConcerns` the entrance gate reads, so
 *         the two grade one corpus by one predicate — no second read of the ledger.
 */
export const computeConcernsElsewhere = (input: {
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
  levelBySlug: Map<string, number>;
  overruledLevels: Set<number>;
  allowBlockers: number;
  allowNitpicks: number;
  /** the lane just declared, excluded from the "elsewhere" count */
  excludeSlug: string;
}): number =>
  computeUndeclaredConcerns({
    absorptions: input.absorptions,
    givens: input.givens,
    levelBySlug: input.levelBySlug,
    overruledLevels: input.overruledLevels,
    allowBlockers: input.allowBlockers,
    allowNitpicks: input.allowNitpicks,
  })
    .filter((lane) => lane.slug !== input.excludeSlug)
    .reduce((sum, lane) => sum + lane.concerns.length, 0);
