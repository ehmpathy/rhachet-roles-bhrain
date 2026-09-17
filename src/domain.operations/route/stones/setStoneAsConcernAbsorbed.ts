import { BadRequestError } from 'helpful-errors';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import { asConfiguredReviewerBySanitizedSlug } from '../guard/review/peer/asConfiguredReviewerBySanitizedSlug';
import { asPeerReviewLevelBySlug } from '../guard/review/peer/asPeerReviewLevelBySlug';
import {
  asReviewConcernRef,
  asReviewConcernRefLabel,
} from '../guard/review/peer/asReviewConcernRef';
import { asSanitizedPeerReviewSlug } from '../guard/review/peer/asSanitizedPeerReviewSlug';
import { assertAbsorptionHasSubject } from '../guard/review/peer/assertAbsorptionHasSubject';
import { assertAbsorptionIsAnswered } from '../guard/review/peer/assertAbsorptionIsAnswered';
import { assertAbsorptionIsNotContrary } from '../guard/review/peer/assertAbsorptionIsNotContrary';
import { assertFulcrumPathExists } from '../guard/review/peer/assertFulcrumPathExists';
import { assertValidPeerReviewSlug } from '../guard/review/peer/assertValidPeerReviewSlug';
import { computeConcernsElsewhere } from '../guard/review/peer/computeConcernsElsewhere';
import { computeUndeclaredConcernLabels } from '../guard/review/peer/computeUndeclaredConcernLabels';
import { formatRouteGuardReviewPeerAbsorptionAck } from '../guard/review/peer/formatRouteGuardReviewPeerAbsorptionAck';
import { getLatestPeerGivensPerSlug } from '../guard/review/peer/getLatestPeerGivensPerSlug';
import { getRouteGuardReviewPeerFeedbackAbsorptionStatus } from '../guard/review/peer/getRouteGuardReviewPeerFeedbackAbsorptionStatus';
import { getAbsorptionOnConcern } from '../guard/review/peer/getStoneReviewAbsorptions';
import { getStoneReviewCorpus } from '../guard/review/peer/getStoneReviewCorpus';
import { getOneRouteStoneGuardReviewPeerMeter } from '../guard/review/peer/meter/getOneRouteStoneGuardReviewPeerMeter';
import { getReviewedJudgeThresholds } from '../guard/review/peer/meter/getReviewedJudgeThresholds';
import { isLevelOverruled } from '../guard/review/peer/meter/isLevelOverruled';
import { getStoneGuardOverruledLevels } from '../judges/getStoneGuardOverruledLevels';
import { setPassageReport } from '../passage/setPassageReport';
import { findOneStoneByPattern } from './asStoneGlob';
import { getAllStones } from './getAllStones';

/**
 * .what = records the driver's stance on ONE concern of ONE reviewer's critique
 * .why = a review budget was never the right instrument for a disagreement. it ends one by
 *        exhaustion rather than by judgment, so the cheapest exit from a real defect and the
 *        cheapest exit from a bad critique are the same exit. this gives the driver a way to
 *        say WHICH it is, and records that judgment where a council can rule on it.
 *
 * 🔴 the gates are ORDERED, and the order is the design:
 *      R1 — is the critique answered?        (a stance does not discharge the duty to answer)
 *      R2 — is there a readable concern?     (any lane that counts is a subject, verdict aside)
 *      R3 — is a contrary stance on record?  (a stance is final for its given)
 *    each refuses for its own reason and prints its own message; a shared message would send
 *    the driver to the wrong next step (case=3 [t3]).
 *
 * 🔴 R2 does NOT key on the verdict. EVERY concern is disputable regardless of reviewer status,
 *    because the `reviewed?` judge tallies STONE-WIDE — an approved lane's nitpicks still count,
 *    so the driver must be able to shed them (a fundamental invariant, 2026-09-15). the entrance
 *    gate still DEMANDS a stance only where the verdict rejects; this path only PERMITS one.
 *
 * .note = `--why` is REQUIRED for a dispute and OPTIONAL for a concede. a dispute is a
 *         guarantee to the council, so it cites the argument they will read; a concede owes no
 *         fulcrum, but MAY carry one to record why it conceded — an optional justification.
 *         `--severity` is REQUIRED for a concede (a mandatory invariant — no ungraded concede)
 *         and forbidden for a dispute.
 */
export const setStoneAsConcernAbsorbed = async (input: {
  stone: string;
  route: string;
  as: 'disputed' | 'conceded';
  with: string;
  about: string;
  why?: string;
  severity?: 'better' | 'urgent';
}): Promise<{
  disputed?: boolean;
  conceded?: boolean;
  emit: { stdout: string; stderr?: string } | null;
}> => {
  // --why is REQUIRED for a dispute, OPTIONAL for a concede (2026-09-15). a dispute is a guarantee
  // to the council, so it must cite the fulcrum they will read. a concede claims no judgment, so it
  // owes no fulcrum — but it MAY carry one to record WHY it conceded, a justification a later reader
  // can weigh. whichever stance carries a --why, the path is validated to point at an extant file.
  if (input.as === 'disputed' && !input.why)
    throw new BadRequestError(
      [
        `--why is required for --as disputed`,
        ``,
        `a dispute is a guarantee to the council, so it must cite the argument they will read.`,
        `write the entry first, then point at it:`,
        `  .fulcrums/inventory.of=fulcrums.case=F00N-<slug>.md`,
      ].join('\n'),
      { stone: input.stone },
    );

  // --severity grades a CONCEDE alone, and is REQUIRED there — a mandatory invariant, no default
  // (2026-09-15). a dispute asserts the concern is fine to continue, so it carries no harm grade;
  // a concede owes one on EVERY concession, so the harm test is always made rather than skipped by
  // a silent `better` default.
  if (input.as === 'disputed' && input.severity)
    throw new BadRequestError(
      [
        `--severity is not accepted for --as disputed`,
        ``,
        `a severity grades a CONCESSION's harm — a dispute concedes naught, so it has none.`,
        `grade the harm only when you concede: --as conceded --severity better|urgent`,
      ].join('\n'),
      { stone: input.stone },
    );
  if (input.as === 'conceded' && !input.severity)
    throw new BadRequestError(
      [
        `--severity is required for --as conceded`,
        ``,
        `every concession is graded by its harm — there is no ungraded concede.`,
        `  --severity urgent  — a shipped harm (security | safety | monetary | reputation |`,
        `                       behavioral); earns budget, warns the human`,
        `  --severity better  — code idealism / maintenance; the floor, never earns budget`,
      ].join('\n'),
      { stone: input.stone },
    );

  // the graded severity — the driver's explicit grade on a concede (required above); a dispute
  // concedes naught, so it grades naught
  const severity: 'better' | 'urgent' | undefined =
    input.as === 'conceded' ? input.severity : undefined;

  // the concern ref is parsed before any i/o, so a typo fails fast and cheap
  const concern = asReviewConcernRef({ about: input.about });
  const about = asReviewConcernRefLabel({ ref: concern });

  // find the stone
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findOneStoneByPattern({
    stones,
    pattern: input.stone,
  });
  if (!stoneMatched)
    throw new BadRequestError('stone not found', { stone: input.stone });

  // the fulcrum path is checked BEFORE any state moves, so a refusal mutates naught
  if (input.why)
    assertFulcrumPathExists({
      why: input.why,
      route: input.route,
      repoRoot: await getRepoRootWithFallback({ from: input.route }),
    });

  // the shared readiness computation, scoped to this one reviewer. it reports every slug
  // that has SPOKEN, which the slug check reads — one corpus read rather than two
  const slug = asSanitizedPeerReviewSlug({ slug: input.with });
  const status = await getRouteGuardReviewPeerFeedbackAbsorptionStatus({
    route: input.route,
    stone: stoneMatched,
    scope: { slug },
  });

  assertValidPeerReviewSlug({
    slug,
    stone: stoneMatched,
    slugsSpoken: status.slugsSpoken,
  });

  // R1 — answer first
  assertAbsorptionIsAnswered({
    stone: stoneMatched.name,
    slug,
    feedbackUnabsorbed: status.feedbackUnabsorbed,
  });

  // the stance corpus, read ONCE for this write — R2 below reads `givens`, R3 further down
  // reads `absorptions`. one communicator single-sources the pair so this write path folds
  // the same corpus every OTHER gate on the stone folds (r007 blocker.1, i006;
  // rule.forbid.behavior-hazards, rule.require.single-source-of-truth-for-render).
  const { absorptions, givens } = await getStoneReviewCorpus({
    route: input.route,
    stone: stoneMatched.name,
  });

  // the lane's latest given: its verdict is R2's subject, and its path is the stance's key.
  // 🔴 selected by getLatestPeerGivensPerSlug's TOTAL order, never `.find` over raw glob
  //    output — a plain find keys on whichever given globbed first, which is the
  //    filesystem's order, not the round's (rule.forbid.order-dependence). this is the one
  //    selector the debt and the tally already read through.
  const givenFound = getLatestPeerGivensPerSlug({ givens }).find(
    (one) => one.slug === slug,
  );

  // R2 — the verdict must hold the road, and the level must be unforgiven
  const peerReviews = stoneMatched.guard
    ? getGuardPeerReviews(stoneMatched.guard)
    : [];
  const reviewConfigured = asConfiguredReviewerBySanitizedSlug({
    peerReviews,
  }).get(slug);
  const overruledLevels = await getStoneGuardOverruledLevels({
    route: input.route,
    stone: stoneMatched,
  });

  // the thresholds the judge tallies against, so the stance keys on the same verdict
  const thresholds = getReviewedJudgeThresholds({
    judges: stoneMatched.guard?.judges ?? [],
  });
  // yields the narrowed non-null subject for every read past this point, so no `given!`
  // downstream — the `.assure` shape (throw, or return the narrowed value).
  // 🔴 it does NOT key on the verdict: EVERY concern is disputable regardless of reviewer
  //    status, because the judge tallies STONE-WIDE and an approved lane's nitpicks still count.
  //    the entrance gate still DEMANDS a stance only where the verdict rejects; this only PERMITS
  //    one wherever a readable concern counts (a fundamental invariant, 2026-09-15).
  const given = assertAbsorptionHasSubject(givenFound, {
    slug,
    isLevelForgiven: isLevelOverruled({
      level: reviewConfigured?.level ?? 1,
      overruledLevels,
    }),
  });

  // the ordinal must address a concern the given actually raised — `blocker.5` against a lane
  // that raised 3 blockers names no concern the driver can see (r001.n1 / r006.n1). the given's
  // own counts are the bound, so a typo fails loud rather than sheds a concern that never was
  const raisedOfKind =
    concern.kind === 'blocker' ? given.blockers : given.nitpicks;
  if (concern.ordinal > raisedOfKind)
    throw new BadRequestError(
      [
        `--about ${about} is out of range`,
        ``,
        `the reviewer ${slug} raised ${raisedOfKind} ${concern.kind}${
          raisedOfKind === 1 ? '' : 's'
        } in its latest given, so the ordinal must be 1..${raisedOfKind}.`,
      ].join('\n'),
      { stone: stoneMatched.name, about, raised: raisedOfKind },
    );

  // R3 — a contrary stance on this concern of this given is refused
  assertAbsorptionIsNotContrary({
    absorptions,
    reviewer: slug,
    about,
    given: given.pathGiven,
    intent: input.as,
    stone: stoneMatched.name,
    // the GRADE and the ARGUMENT are part of what the stance says, so a re-declaration that
    // changes one is a re-grade rather than a repeat, and R3 refuses it loud (r7 b1)
    severity,
    why: input.why,
  });

  // every gate passed — record the stance, keyed to the given it answers.
  // 🔴 an IDENTICAL stance already on record writes NO second row (r6 b2 / r7 b2). R3 above
  //    already refused a CONTRARY one — and, since r7 b1, a RE-GRADED or RE-CITED one too —
  //    so a hit here can only be the same stance again, with the same grade and the same
  //    fulcrum. `rule.require.idempotent-operations`. the ledger is append-only, so an
  //    unconditional re-append would leave two rows a council reads as two acts where one
  //    was declared.
  const alreadyOnRecord = getAbsorptionOnConcern({
    absorptions,
    reviewer: slug,
    about,
    given: given.pathGiven,
  });
  if (!alreadyOnRecord)
    await setPassageReport({
      report: new PassageReport({
        stone: stoneMatched.name,
        status: input.as,
        reviewer: slug,
        about,
        given: given.pathGiven,
        fulcrum: input.why,
        severity,
        reason: `${input.as} review.peer: ${slug} ${about}${
          severity ? ` (${severity})` : ''
        }`,
      }),
      route: input.route,
    });

  // the meter, read HERE rather than at the top, so a REFUSED absorption pays no extra i/o.
  // .note = a concern absorption is rare where a feedback absorption is common, so the read
  //         lands on the rare path — the pressure setStoneAsFeedbackAbsorbed:131-134 argues
  //         for, honored
  const meter = await getOneRouteStoneGuardReviewPeerMeter({
    slug,
    stone: stoneMatched.name,
    route: input.route,
  });

  // what this lane still owes, AFTER this declaration — the same question the entrance gate
  // asks, so one operation answers both. `also` carries the row just written, since `absorptions`
  // was read before the write, which spares a second read of the ledger
  const concernsLeft = computeUndeclaredConcernLabels({
    absorptions,
    slug,
    pathGiven: given.pathGiven,
    blockers: given.blockers,
    nitpicks: given.nitpicks,
    also: [about],
  }).length;

  // what the STONE still owes on OTHER lanes — so a lane cleared here does not read as an
  // all-clear while another lane still owes a stance (r9 n2). the pre-write `absorptions` is
  // exact for other lanes: this write touched only THIS lane's concern, so no other lane's
  // remainder moved. reuses the pure operation the entrance gate folds through, so the two
  // grade the same corpus — no second read of the ledger (rule.forbid.redundant-expensive-operations)
  const levelBySlug = asPeerReviewLevelBySlug({ peerReviews });
  const concernsElsewhere = computeConcernsElsewhere({
    absorptions,
    givens,
    levelBySlug,
    overruledLevels,
    allowBlockers: thresholds?.allowBlockers ?? 0,
    allowNitpicks: thresholds?.allowNitpicks ?? 0,
    excludeSlug: slug,
  });

  return {
    ...(input.as === 'disputed' ? { disputed: true } : { conceded: true }),
    emit: {
      stdout: formatRouteGuardReviewPeerAbsorptionAck({
        absorption: input.as,
        stone: stoneMatched.name,
        slug,
        concern,
        why: input.why ?? null,
        severity: severity ?? null,
        meter: {
          level: reviewConfigured?.level ?? 1,
          rounds: meter?.rounds ?? 0,
          budget: reviewConfigured?.budget ?? 0,
        },
        concernsLeft,
        concernsElsewhere,
      }),
    },
  };
};
