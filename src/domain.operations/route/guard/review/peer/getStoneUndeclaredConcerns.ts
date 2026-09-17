import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getStoneGuardOverruledLevels } from '../../../judges/getStoneGuardOverruledLevels';
import { asPeerReviewLevelBySlug } from './asPeerReviewLevelBySlug';
import { computeUndeclaredConcernLabels } from './computeUndeclaredConcernLabels';
import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';
import { getStoneReviewCorpus } from './getStoneReviewCorpus';
import { isGivenVerdictApproved } from './isGivenVerdictApproved';
import { getReviewedJudgeThresholds } from './meter/getReviewedJudgeThresholds';
import { isLevelOverruled } from './meter/isLevelOverruled';

/**
 * .what = one lane that holds the road, and the concerns on it with no stance declared
 */
export interface RouteGuardReviewPeerUndeclared {
  slug: string;
  /** the given the concerns are numbered within — the stance's key */
  pathGiven: string;
  /** 🔴 true when the count is FABRICATED: no numeric verdict was readable */
  unreadable: boolean;
  /** the undeclared concerns, by label, in report order: `blocker.1`, `nitpick.4` */
  concerns: string[];
}

/**
 * .what = enumerates every concern this stone still owes a stance on
 * .why = acceptance #1 — a driver must declare exactly one stance per concern, so the
 *        entrance gate refuses a fresh round while any concern stands undeclared. an
 *        absent stance is refused; it never defaults to either word.
 *
 * 🔴 it asks per CONCERN, never per lane (S07). a lane at 3 blockers owes 3 declarations,
 *    and a driver may concede one and dispute two — which is the commonest honest act
 *    there is, and a lane-grain gate cannot express it.
 *
 * 🔴 the ordinals index into ONE given (S08 / F020). a fresh round renumbers them, so a
 *    stance keyed to a prior given does not discharge a concern on the current one — the
 *    lane spoke again, and the driver re-declares against what it now says.
 *
 * ⚠️ an approved lane OWES naught: it raises no hold to lift, so the gate does not demand a
 *    stance on it (F012 / S06 — the OWED predicate keys on the VERDICT). 🔴 but a driver still
 *    MAY dispute its concerns: the judge tallies STONE-WIDE, so an approved lane's nitpicks count,
 *    and the set path (assertAbsorptionHasSubject) permits a dispute to shed them. owed ≠ permitted
 *    (2026-09-15).
 *
 * 🔴 an UNREADABLE lane owes naught either, and for a sharper reason: it carries no verdict at
 *    all, only a fabricated count. a malfunction is answered by a RE-RUN, never by a stance
 *    (rule.always.diagnose-reviewer-malfunctions; contract.reviewer-output — a malfunction is
 *    never a rejection). the set path refuses a stance on it too (assertAbsorptionHasSubject), so
 *    the two gates agree (F030).
 */
export const computeUndeclaredConcerns = (input: {
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
  levelBySlug: Map<string, number>;
  overruledLevels: Set<number>;
  allowBlockers: number;
  allowNitpicks: number;
}): RouteGuardReviewPeerUndeclared[] => {
  const {
    absorptions,
    givens,
    levelBySlug,
    overruledLevels,
    allowBlockers,
    allowNitpicks,
  } = input;

  // one entry per given that still holds the road and owes a stance — a flatMap fold, so a given
  // that owes naught yields `[]` rather than a `continue` over a mutated accumulator
  // (rule.forbid.maintenance-hazards)
  return givens.flatMap((given): RouteGuardReviewPeerUndeclared[] => {
    // a human already lifted this gate, so the lane no longer holds the road
    const level = levelBySlug.get(given.slug) ?? 1;
    if (isLevelOverruled({ level, overruledLevels })) return [];

    // 🔴 an unreadable given carries a FABRICATED count, never a verdict — no numeric count was
    //    readable, so `contract.reviewer-output` scores it 1 blocker to gate. a stance is a
    //    judgment about a VERDICT (a dispute says it holds; a concede says it is right), and a
    //    malfunction has none to judge. its remedy is a RE-RUN, never a stance
    //    (rule.always.diagnose-reviewer-malfunctions); the entrance gate would deadlock a driver
    //    who narrowed the guard to fix an overflow, since this gate fires BEFORE the reviewers
    //    re-run. so it owes naught here, and the re-run's outcome is caught downstream — the
    //    post-run malfunction gate, the judge tally, or the exhaustion gate (F030).
    if (given.unreadable) return [];

    // an approved lane raises no hold to lift, so it OWES no declaration — this gate is the
    // OWED half. 🔴 it no longer shares its check with the set-path guard (assertAbsorptionHasSubject):
    // that PERMITS a dispute on any lane that counts toward the stone-wide tally, approved
    // included, so the driver can shed it. owed and permitted are two questions (2026-09-15)
    if (
      isGivenVerdictApproved({
        blockers: given.blockers,
        nitpicks: given.nitpicks,
        allowBlockers,
        allowNitpicks,
      })
    )
      return [];

    // what this lane still owes — the same question the stance ack asks, so one operation
    const concerns = computeUndeclaredConcernLabels({
      absorptions,
      slug: given.slug,
      pathGiven: given.pathGiven,
      blockers: given.blockers,
      nitpicks: given.nitpicks,
    });
    if (concerns.length === 0) return [];

    return [
      {
        slug: given.slug,
        pathGiven: given.pathGiven,
        unreadable: given.unreadable,
        concerns,
      },
    ];
  });
};

/**
 * .what = the concerns this stone still owes a stance on, right now
 * .why = the entrance gate's predicate — it reads the stance corpus, the latest given per
 *        slug, and the levels a human forgave, then folds them through the pure operation
 *        above (which is where every rule this gate encodes actually lives)
 */
export const getStoneUndeclaredConcerns = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<RouteGuardReviewPeerUndeclared[]> => {
  const [{ absorptions, givens }, overruledLevels] = await Promise.all([
    getStoneReviewCorpus({ route: input.route, stone: input.stone.name }),
    getStoneGuardOverruledLevels({ stone: input.stone, route: input.route }),
  ]);

  // the thresholds the judge tallies against, so this gate keys on the same verdict
  const thresholds = getReviewedJudgeThresholds({
    judges: input.stone.guard?.judges ?? [],
  });

  // the configured level per slug, so a forgiven level can be excluded
  const peerReviews = input.stone.guard
    ? getGuardPeerReviews(input.stone.guard)
    : [];
  const levelBySlug = asPeerReviewLevelBySlug({ peerReviews });

  return computeUndeclaredConcerns({
    absorptions,
    givens,
    levelBySlug,
    overruledLevels,
    allowBlockers: thresholds?.allowBlockers ?? 0,
    allowNitpicks: thresholds?.allowNitpicks ?? 0,
  });
};
