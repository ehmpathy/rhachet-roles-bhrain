import { BadRequestError } from 'helpful-errors';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import type { ContextStoneGuardRound } from '@src/domain.objects/Driver/ContextStoneGuardRound';
import type { GuardProgressEvent } from '@src/domain.objects/Driver/GuardProgressEvent';
import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import {
  getGuardPeerReviews,
  getGuardSelfReviews,
  getReviewPeerRunCmd,
} from '@src/domain.objects/Driver/RouteStoneGuard';
import type { RouteStoneGuardJudgeArtifact } from '@src/domain.objects/Driver/RouteStoneGuardJudgeArtifact';
import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import type { ContextReviewBrainSupply } from '@src/domain.operations/brain/genReviewBrainSupply'; // brain/ is a declared shared subdomain (its .readme.md)

import { computeRouteBouncerCache } from '../bouncer/computeRouteBouncerCache';
import { setRouteBouncerCache } from '../bouncer/setRouteBouncerCache';
import { delStoneGuardBlockerReport } from '../drive/delStoneGuardBlockerReport';
import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { getAllStoneGuardArtifactsByHash } from '../guard/artifact/getAllStoneGuardArtifactsByHash';
import { getMaxStoneGuardIteration } from '../guard/artifact/getMaxStoneGuardIteration';
import { asFailedJudgeReasons } from '../guard/asFailedJudgeReasons';
import { asGuardDisplayPath } from '../guard/asGuardDisplayPath';
import { asGuardHaltCombinedReason } from '../guard/asGuardHaltCombinedReason';
import { asGuardMalfunctionReason } from '../guard/asGuardMalfunctionReason';
import { getAllFailedJudges } from '../guard/getAllFailedJudges';
import { getAllJudgeMalfunctions } from '../guard/getAllJudgeMalfunctions';
import { getAllReviewConstraints } from '../guard/getAllReviewConstraints';
import { getAllReviewMalfunctions } from '../guard/getAllReviewMalfunctions';
import { getOneRejectedUnforgivenTotal } from '../guard/getOneRejectedUnforgivenTotal';
import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import { asStoneGuardPartitionGapLines } from '../guard/partition/asStoneGuardPartitionGapLines';
import { asStoneGuardPartitionGapReason } from '../guard/partition/asStoneGuardPartitionGapReason';
import { asStoneGuardPartitionGapsOfCoverage } from '../guard/partition/asStoneGuardPartitionGapsOfCoverage';
import { getAllStoneGuardPartitionCoverage } from '../guard/partition/getAllStoneGuardPartitionCoverage';
import { computeStoneReviewInputHash } from '../guard/review/computeStoneReviewInputHash';
import { asRouteGuardReviewPeerSlugList } from '../guard/review/peer/asRouteGuardReviewPeerSlugList';
import { computeTotalUndeclaredConcerns } from '../guard/review/peer/computeTotalUndeclaredConcerns';
import { genRouteGuardExhaustedReason } from '../guard/review/peer/genRouteGuardExhaustedReason';
import { getAllStoneGuardReviewPeerFeedbackUnabsorbedUnforgiven } from '../guard/review/peer/getAllStoneGuardReviewPeerFeedbackUnabsorbedUnforgiven';
import { getAllStoneUndeclaredConcerns } from '../guard/review/peer/getAllStoneUndeclaredConcerns';
import { getOneRouteGuardReviewPeerConstraintLever } from '../guard/review/peer/getOneRouteGuardReviewPeerConstraintLever';
import { getStoneConcessionExhaustionKind } from '../guard/review/peer/getStoneConcededLaneSlugs';
import { getAllReviewLevelsByIndex } from '../guard/review/peer/meter/getAllReviewLevelsByIndex';
import { getAllReviewPeerMeterStatuses } from '../guard/review/peer/meter/getAllReviewPeerMeterStatuses';
import { getExhaustionHaltReviewerSlugs } from '../guard/review/peer/meter/getExhaustionHaltReviewerSlugs';
import { getOneReviewLevelByIndex } from '../guard/review/peer/meter/getOneReviewLevelByIndex';
import { isEveryReviewLevelTerminal } from '../guard/review/peer/meter/isEveryReviewLevelTerminal';
import { isLevelOverruled } from '../guard/review/peer/meter/isLevelOverruled';
import { JUDGE_LEVEL } from '../guard/review/peer/meter/JUDGE_LEVEL';
import { runStoneGuardReviews } from '../guard/review/runStoneGuardReviews';
import { asHashbarDeclaredReviews } from '../guard/review/self/asHashbarDeclaredReviews';
import { getOneNextUnpromisedReview } from '../guard/review/self/getOneNextUnpromisedReview';
import { getPromisedSlugsSet } from '../guard/review/self/getPromisedSlugsSet';
import { getStonePromises } from '../guard/review/self/getStonePromises';
import { isSelfReviewPromised } from '../guard/review/self/isSelfReviewPromised';
import { setSelfReviewTriggeredReport } from '../guard/review/self/setSelfReviewTriggeredReport';
import { getOneStoneRewindGeneration } from '../guard/round/getOneStoneRewindGeneration';
import { setStoneGuardRoundOutput } from '../guard/round/setStoneGuardRoundOutput';
import { setStoneGuardStamp } from '../guard/stamp/setStoneGuardStamp';
import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';
import { formatRouteGuardReviewPeerAbsorptionPrompt } from '../guard/tree/formatRouteGuardReviewPeerAbsorptionPrompt';
import { formatRouteGuardReviewPeerFeedbackAbsorbPrompt } from '../guard/tree/formatRouteGuardReviewPeerFeedbackAbsorbPrompt';
import { getStoneGuardOverruledLevels } from '../judges/getStoneGuardOverruledLevels';
import { runStoneGuardJudges } from '../judges/runStoneGuardJudges';
import { getOnePassageReport } from '../passage/getOnePassageReport';
import { setPassageReport } from '../passage/setPassageReport';
import { asGlobalStepIndex } from './asGlobalStepIndex';
import { findOneStoneByPattern } from './asStoneGlob';
import { asStoneNotFoundError } from './asStoneNotFoundError';
import { delBlockedTriggeredReport } from './blocked/delBlockedTriggeredReport';
import { genStoneGuardBlockedEmit } from './genStoneGuardBlockedEmit';
import { getAllStoneArtifacts } from './getAllStoneArtifacts';
import { getAllStones } from './getAllStones';
import { getOneArtifactContentForDisplay } from './getOneArtifactContentForDisplay';
import { setStonePassage } from './setStonePassage';

/**
 * .what = renders one artifact (review or judge) as a stderr tree bucket
 * .why = the exhaustion, malfunction, constraint, and failed-judge branches each need the
 *        same "read a file, indent under a header" shape; one shared leaf keeps them
 *        identical (rule.require.single-source-of-truth-for-render, rule.prefer.wet-over-dry).
 * .note = an orchestrator of two grains: the read is the named communicator
 *         `getOneArtifactContentForDisplay` (absence + unreadable allowlist, rethrow on all else),
 *         and the indent is the pure `asArtifactStderrBlock`. each of its five call sites
 *         stays one call.
 * .note = fallback = null emits no fallback line (a failed-judge with no reason contributes
 *         only its header).
 */
const formatArtifactStderrBlock = async (input: {
  emoji: string;
  label: string;
  index: number;
  path: string;
  fallback: string | null;
}): Promise<string[]> => {
  const content = await getOneArtifactContentForDisplay({ path: input.path });
  return asArtifactStderrBlock({ ...input, content });
};

/**
 * .what = renders one artifact's text as a stderr bucket: a header, then each line indented
 *         under it — or the fallback line when the artifact could not be read
 * .why = the pure half of `formatArtifactStderrBlock`, apart from its read, so the render
 *        holds no i/o (rule.prefer.decomposable-architecture)
 */
const asArtifactStderrBlock = (input: {
  emoji: string;
  label: string;
  index: number;
  content: string | null;
  fallback: string | null;
}): string[] => {
  const header = `${input.emoji} ${input.label} ${input.index}`;

  // an unread artifact contributes its header, plus the fallback line when one is given
  if (input.content === null)
    return input.fallback !== null
      ? [header, `   └─ ${input.fallback}`]
      : [header];

  // indent each line of the artifact under the header
  return [header, ...input.content.split('\n').map((line) => `   ${line}`)];
};

/**
 * .what = joins per-artifact stderr blocks into one string, a blank line between each block
 * .why = every blocked-passage branch renders the same shape; one builder keeps them
 *        identical, expressed functionally (rule.require.immutable-vars). returns undefined
 *        when empty so the caller omits stderr.
 */
const joinArtifactStderrBlocks = (blocks: string[][]): string | undefined =>
  blocks.length === 0
    ? undefined
    : blocks
        .flatMap((block, i) => (i === 0 ? block : ['', ...block]))
        .join('\n');

/**
 * .what = attempts to mark a stone as passed after guard validation
 * .why = enables robots to complete milestones with guard verification
 *
 * .note = a guarded round reads the stone's rewind generation at its start, and each
 *         write it makes lands only while that generation holds. a rewind mid-round bumps
 *         it, so the superseded round discards its output and ends with a ConstraintError
 *         rather than write over what the rewind cleared (setStoneGuardRoundOutput)
 */
export const setStoneAsPassed = async (
  input: {
    stone: string;
    route: string;
  },
  context: ContextCliEmit & ContextReviewBrainSupply,
): Promise<{
  passed: boolean;
  refs: { reviews: string[]; judges: string[] };
  emit: { stdout: string; stderr?: string } | null;
}> => {
  // find the stone
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findOneStoneByPattern({
    stones,
    pattern: input.stone,
  });
  if (!stoneMatched)
    throw asStoneNotFoundError({
      act: 'passed',
      route: input.route,
      pattern: input.stone,
      stones,
    });

  // git root for path relativization; the shared resolver, never a local try/catch,
  // so a permissions error or a corrupt .git surfaces loud rather than silently
  // relativized against cwd (rule.forbid.failhide)
  const gitRoot = await getRepoRootWithFallback({ from: input.route });

  // check artifact found
  const artifactFiles = await getAllStoneArtifacts({
    stone: stoneMatched,
    route: input.route,
  });
  if (artifactFiles.length === 0) {
    throw new BadRequestError(
      `artifact not found; run route.stone.get --stone ${stoneMatched.name} --say to see instructions`,
    );
  }

  // if no guard, auto-pass
  if (!stoneMatched.guard) {
    await setStonePassage({ stone: stoneMatched, route: input.route });

    // clear blocked triggers for this stone and all earlier stones
    await clearBlockedTriggersUpTo({
      stone: stoneMatched,
      stones,
      route: input.route,
    });

    // update bouncer cache (stone passage may release protected artifacts)
    const bouncerCache = await computeRouteBouncerCache({
      cwd: process.cwd(),
      route: input.route,
    });
    await setRouteBouncerCache({ cache: bouncerCache, route: input.route });

    return {
      passed: true,
      refs: { reviews: [], judges: [] },
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'allowed',
          note: 'unguarded',
        }),
      },
    };
  }

  // the guard round begins: read the stone's rewind generation, the watermark every
  // write of this round checks
  // .why = a rewind bumps the generation before it deletes the round's outputs; each
  //        write below lands only while the generation is unchanged, so a round a rewind
  //        superseded writes naught after the rewind (setStoneGuardRoundOutput)
  const generation = await getOneStoneRewindGeneration({
    route: input.route,
    stone: stoneMatched.name,
  });
  const setRoundOutput = <TOutput>(
    write: () => Promise<TOutput>,
  ): Promise<TOutput> =>
    setStoneGuardRoundOutput({
      route: input.route,
      stone: stoneMatched.name,
      generation,
      write,
    });
  const genRoundBlockedEmit = (
    blocked: Parameters<typeof genStoneGuardBlockedEmit>[0],
  ): ReturnType<typeof genStoneGuardBlockedEmit> =>
    setRoundOutput(() => genStoneGuardBlockedEmit(blocked));

  // on entry to the guard's reviews, before any review runs, record 'arrived'
  // .why = a --as arrived/passed is forward motion, so a stale escalation halt must
  //        clear at once, not after the (slow) peer reviews finish. the latest entry
  //        wins, so this in-flight 'arrived' supersedes a prior blocked at guard entry
  //        (rule.require.forward-motion-clears-blocker)
  await setRoundOutput(() =>
    setPassageReport({
      report: new PassageReport({
        stone: stoneMatched.name,
        status: 'arrived',
        reason: 'entered guard reviews',
      }),
      route: input.route,
    }),
  );

  // check for review.selfs (must be promised before peer reviews)
  const selfReviews = getGuardSelfReviews(stoneMatched.guard);
  if (selfReviews.length > 0) {
    // get all promises (hashless — firm checkpoints)
    const promises = await getStonePromises({
      stone: stoneMatched,
      route: input.route,
    });
    // 🔴 the named operation, never a second hand-typed scan. `getPromisedSlugsSet` owns
    //    this quantity and `stepRouteStoneSet.ts` already reads it through the name; a
    //    second inline derivation here was correct by coincidence rather than by
    //    construction — the exact shape whose three instances this round has already
    //    repaired (the ordinal that printed two files, the regex that dropped dotted
    //    slugs, the glob that matched zero of 13 markers). found by a peer lane at i011
    const promisedSlugs = getPromisedSlugsSet({ promises });

    // find every unpromised review.self
    // .note = the predicate is the shared one — the `getOneNextUnpromisedReview` call below
    //         reads the same source, so its non-null holds by construction rather than by
    //         a comment that asserts two hand-typed scans agree
    const unpromised = selfReviews.filter(
      (review) => !isSelfReviewPromised({ review, promisedSlugs }),
    );
    if (unpromised.length > 0) {
      // the emit names the first of them, so the driver has one concrete place to start.
      // 🔴 the ordinal comes from the named finder, never a second derivation here: this
      // quantity had THREE derivations at three call sites and they disagreed — measured
      // first-party this round, where two emits named two different files for one owed review.
      // .note = non-null is sound BY CONSTRUCTION: this branch is guarded by
      //         `unpromised.length > 0`, and the finder reads the very predicate the filter
      //         above read (isSelfReviewPromised), so the two cannot select from different
      //         sets. it rested on a comment that asserted two hand-typed scans agree until
      //         2026-09-20 — an agreement no type held, and the exact trust the neighbour
      //         call on the next line argues against
      const next = getOneNextUnpromisedReview({ selfReviews, promisedSlugs })!;
      const nextReview = next.reviewSelf;

      // 🔴 mint a trigger for THIS review alone, never for every unpromised one.
      // .why = `.since` is the ASK, and the haste cue reads elapsed-since-the-ask. a mint of
      //        all N stamps slug N's ask at the moment slug 1 was asked, so by the time the
      //        driver is told about slug N its `.since` is forty minutes old and
      //        `elapsed < window` can never hold ⇒ the cue would fire on the first review of
      //        a stone and be dead for every other one.
      // 🟡 .why it was all-N until the fork was withdrawn = under a true fork the stamp was
      //        correct, because every lane really was asked at once. the fork premise held
      //        weight HERE too, one call away from the roster that advertised it — so the
      //        withdrawal turns a correct mint into a wrong one
      // 🔴 .what it also buys = the serial contract gains a TOOTH. a promise for a slug that
      //        was never asked finds no report and meets `challenge:unasked`, which refuses
      //        rather than mints (a mint there would launder the ask). so out-of-order is not
      //        merely undiscoverable now, it is refused
      // .note = sinceOnly leaves .uptil absent, which would otherwise read as a prior attempt
      // .note = idempotent — a re-ask of a slug already asked is a no-op, so the ask that
      //         re-emits this stone does not restamp a clock the driver is already inside
      // .note = the write lands only while this round's rewind generation holds
      await setRoundOutput(() =>
        setSelfReviewTriggeredReport(
          {
            stone: stoneMatched.name,
            slug: nextReview.slug,
            route: input.route,
          },
          { sinceOnly: true },
        ),
      );

      // blocked on review.self — persist + return via the shared blocked tail
      // .note = raw emit (no stamp): peer reviews have not run at this point
      return genRoundBlockedEmit({
        stone: stoneMatched.name,
        route: input.route,
        blocker: 'review.self',
        reason: `review.self required: ${nextReview.slug}`,
        refs: { reviews: [], judges: [] },
        emit: {
          stdout: formatRouteStoneEmit({
            operation: 'route.stone.set',
            stone: stoneMatched.name,
            action: 'passed',
            passage: 'blocked',
            note: 'review.self required',
            selfReview: {
              reviewSelf: nextReview,
              // .note = the route is REQUIRED here. omitted, this emit printed
              //         `/review/self/…` while the guard read `$route/review/self/…`,
              //         so a driver who obeyed was refused at the path they were told
              route: input.route,
              index: next.index,
              total: next.total,
            },
            // 🔴 .note = ONE review is named, and the others are deliberately withheld. this
            //    carried a roster of every other unpromised slug until the fork was
            //    withdrawn — see `formatRouteStoneEmit`'s note at the ask branch for why.
            //    the short form: the roster invited a fork the guide layer could not serve
            // the retired `hashbar:` key, if this stone's guard still declares it
            hashbarFound: asHashbarDeclaredReviews({
              stone: stoneMatched.name,
              selfReviews,
            }),
          }),
        },
      });
    }
  }

  // if guard has no reviews and no judges, auto-pass (guard only customizes artifact detection)
  const peerReviews = getGuardPeerReviews(stoneMatched.guard);
  if (peerReviews.length === 0 && stoneMatched.guard.judges.length === 0) {
    await setStonePassage({ stone: stoneMatched, route: input.route });

    // clear blocked triggers for this stone and all earlier stones
    await clearBlockedTriggersUpTo({
      stone: stoneMatched,
      stones,
      route: input.route,
    });

    // update bouncer cache (stone passage may release protected artifacts)
    const bouncerCache = await computeRouteBouncerCache({
      cwd: process.cwd(),
      route: input.route,
    });
    await setRouteBouncerCache({ cache: bouncerCache, route: input.route });

    return {
      passed: true,
      refs: { reviews: [], judges: [] },
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'allowed',
          note: 'artifacts only',
        }),
      },
    };
  }

  // if guard has reviews but no judges, that's an error
  if (peerReviews.length > 0 && stoneMatched.guard.judges.length === 0) {
    throw new BadRequestError('guard has reviews but no judges', {
      guard: stoneMatched.guard.path,
    });
  }

  // the entrance gate — a driver may not enter a review round while it owes an answer
  // to a prior blocker.
  // .why = the exit gate below (inside allJudgesPassed) fires only at passage, and a
  //        re-run is not passage — so without this a driver could edit the artifact,
  //        re-roll, and let the reviewer forget the point instead of answering it.
  //        `computeStoneReviewInputHash` covers the whole artifact set, so one edited
  //        line anywhere moves the hash a hash-keyed debt was filed against.
  // .note = it sits after the zero-reviewer auto-pass, before `stampGuardReport` is in
  //         scope (so this halt never stamps a report for reviews that never ran), and
  //         before the hash + subprocess round, so a halt costs only a directory read.
  // .note = needs no hash — the debt is keyed to the reviewer, so readiness does not
  //         depend on the current generation.
  const unforgivenAtEntrance =
    await getAllStoneGuardReviewPeerFeedbackUnabsorbedUnforgiven({
      stone: stoneMatched,
      route: input.route,
    });
  if (unforgivenAtEntrance.length > 0) {
    // refs are empty by construction — no review and no judge ran this call
    return genRoundBlockedEmit({
      stone: stoneMatched.name,
      route: input.route,
      blocker: 'review.peer.unabsorbed',
      reason: `peer review awaits feedbackAbsorption: ${asRouteGuardReviewPeerSlugList(
        { reviewers: unforgivenAtEntrance },
      )}`,
      refs: { reviews: [], judges: [] },
      emit: {
        stdout: formatRouteGuardReviewPeerFeedbackAbsorbPrompt({
          case: 'reply-prompt',
          stone: stoneMatched.name,
          root: gitRoot,
          reviewers: unforgivenAtEntrance,
        }),
      },
    });
  }

  // the stance gate — a driver may not enter a review round while a concern that holds
  // the road stands with no stance declared on it.
  // .why = a review budget ends a disagreement by exhaustion rather than judgment, so
  //        the cheapest exit from a real defect and the cheapest exit from a bad
  //        critique are the same exit. a stance says which it is, and records that
  //        judgment where a council can rule on it.
  // .why after the feedbackAbsorption gate = a stance declared before the driver
  //        answered the critique is a verdict on an argument they never engaged; the
  //        answer is owed first.
  // .why per concern, never per lane = a lane at 3 blockers owes 3 declarations, and a
  //        driver may concede one and dispute two — a lane-grain gate cannot express
  //        that (rule.forbid.suppression-of-undeclared-concerns).
  const undeclaredAtEntrance = await getAllStoneUndeclaredConcerns({
    stone: stoneMatched,
    route: input.route,
  });
  if (undeclaredAtEntrance.length > 0) {
    const concernsTotal = computeTotalUndeclaredConcerns({
      lanes: undeclaredAtEntrance,
    });
    return genRoundBlockedEmit({
      stone: stoneMatched.name,
      route: input.route,
      blocker: 'review.peer.undeclared',
      reason: `peer review awaits absorption: ${concernsTotal} concern${
        concernsTotal === 1 ? '' : 's'
      } unabsorbed`,
      refs: { reviews: [], judges: [] },
      emit: {
        stdout: formatRouteGuardReviewPeerAbsorptionPrompt({
          stone: stoneMatched.name,
          lanes: undeclaredAtEntrance,
        }),
      },
    });
  }

  // the partition gate — a driver may not enter a review round while the route's partitions
  // leave a changed file unclaimed, or lack the route spec.
  // .why = 🔴 the same check `rhx review` runs per lane, run ONCE here. per lane, one stale
  //        glob refused every lane that split — one cause, many refusals, each after the
  //        pour began. here it refuses once, before the hash and before any brain, and
  //        prints the repaired set as one command (rule.forbid.workarounds)
  // .why after the stance gate = the debts a driver already owes are answered first; this
  //        gate guards the round that is about to run, not the ones that ran
  // .note = the gaps are read off the ONE coverage computation a driver's
  //         `route.guard.partition --peer @all --stone <s>` read renders, so the two agree
  const partitionCoverage = await getAllStoneGuardPartitionCoverage({
    stone: stoneMatched,
    route: input.route,
    cwd: gitRoot,
  });
  const partitionGaps = asStoneGuardPartitionGapsOfCoverage({
    coverages: partitionCoverage,
  });
  if (partitionGaps.length > 0)
    return genRoundBlockedEmit({
      stone: stoneMatched.name,
      route: input.route,
      blocker: 'review.peer.malpartitioned',
      reason: asStoneGuardPartitionGapReason({ gaps: partitionGaps }),
      refs: { reviews: [], judges: [] },
      emit: {
        stdout: asStoneGuardPartitionGapLines({
          stone: stoneMatched.name,
          gaps: partitionGaps,
        }).join('\n'),
      },
    });

  // stamp the guard report next to the stone when peer reviews ran
  // .why = persists the latest border-gate result so folks can review it without a
  //        guard re-run
  // .note = stamps only when peer reviews ran; judges-only guards leave no stamp.
  //         passes the emit through unchanged so each branch can return
  //         `{ ..., emit: await stampGuardReport(...) }`
  const stampGuardReport = async (emit: {
    stdout: string;
    stderr?: string;
  }): Promise<{ stdout: string; stderr?: string }> => {
    if (peerReviews.length > 0)
      await setRoundOutput(() =>
        setStoneGuardStamp({
          stone: stoneMatched,
          route: input.route,
          emit,
        }),
      );
    return emit;
  };

  // compute review input hash for cache lookup.
  // hash principle: each component hashes its inputs — reviews hash on artifacts,
  // judges hash on reviews + approvals (computed internally by runStoneGuardJudges).
  // so an artifact change, an approval grant, or a review re-run each cascades a
  // fresh judge input hash even where the review side stays cached.
  const hash = await computeStoneReviewInputHash({
    stone: stoneMatched,
    route: input.route,
  });

  // check for prior artifacts for cache lookup
  const priorArtifacts = await getAllStoneGuardArtifactsByHash({
    stone: stoneMatched,
    hash,
    route: input.route,
  });

  // determine current iteration across all artifacts for this stone (not just per-hash)
  // .note = iteration increments globally so filenames show progression even when hash changes
  const maxPriorIteration = await getMaxStoneGuardIteration({
    stone: stoneMatched,
    route: input.route,
  });
  const iteration = maxPriorIteration + 1;

  // collect progress events for guard tree output
  // .note = deliberate mutation, and a SCOPED ZONE: `events` is born in this call and grows
  //         only via the onGuardProgress callback below, one event per guard progress step, as
  //         reviews and judges report in. no caller holds it while it grows; the guard tree
  //         render reads it only once the steps it records have settled
  //         (rule.require.immutable-vars, scoped zone)
  const events: GuardProgressEvent[] = [];
  const totalReviews = peerReviews.length;
  const totalJudges = stoneMatched.guard.judges.length;
  const totalItems = totalReviews + totalJudges;

  // create context that enriches events with position for branch format
  // .note = forwards getReviewBrain so the guard's fallback tactic can build the sub-brain
  const collectContext: ContextCliEmit &
    ContextReviewBrainSupply &
    ContextStoneGuardRound = {
    guardRound: { generation },
    cliEmit: {
      onGuardProgress: (event) => {
        events.push(event);

        // stamp the event with its position across reviews + judges
        context.cliEmit.onGuardProgress(event, {
          index: asGlobalStepIndex({ step: event.step, totalReviews }),
          total: totalItems,
        });
      },
      onGuardHalted: context.cliEmit.onGuardHalted,
    },
    getReviewBrain: context.getReviewBrain,
  };

  // run reviews (reuses prior artifacts internally, only runs incomplete ones)
  const reviewResult =
    peerReviews.length > 0
      ? await runStoneGuardReviews(
          {
            stone: stoneMatched,
            guard: stoneMatched.guard,
            hash,
            iteration,
            route: input.route,
          },
          collectContext,
        )
      : { artifacts: [], exhaustedReviewerSlugs: [] };
  const reviewArtifacts = reviewResult.artifacts;

  // load human overrules first, so the meter statuses below are overrule-aware
  // .why = an overruled level is terminal-for-unlock; the meter tree must not paint a
  //        false "awaits l<overruled> terminal" on the level above it, and each
  //        overruled level must be stamped so the tree + footer render the forgiveness
  const overruledLevels = await getStoneGuardOverruledLevels({
    stone: stoneMatched,
    route: input.route,
  });

  // the judge is the top rung of the guard ladder; a human overrule of it (JUDGE_LEVEL)
  // forgives a failed or malfunctioned judge exactly as an overrule forgives a peer
  // level (getOneStoneGuardLevelState surfaces the judge rung so a human can overrule it)
  const judgeRungForgiven = overruledLevels.has(JUDGE_LEVEL);

  // compute peer meter statuses for guard tree output
  // pass skipped slugs so wasExhausted can be computed correctly
  const peerMeters = await getAllReviewPeerMeterStatuses({
    stone: stoneMatched,
    hash,
    route: input.route,
    exhaustedReviewerSlugs: reviewResult.exhaustedReviewerSlugs,
    overruledLevels,
  });

  // check for peer review exhaustion. halt only if a review was skipped due to
  // exhaustion, never if it ran and depleted budget — a review that ran at 2/2 and got
  // blockers proceeds to judge (blocked), not this halt. skip this check entirely if
  // the stone is already approved (human already signed off).
  const approvalPrior = await getOnePassageReport({
    stone: stoneMatched.name,
    status: 'approved',
    route: input.route,
  });
  // overruledLevels was loaded above (before the meter statuses), so an
  // exhausted-but-overruled level does not halt and the judge forgives its blockers.

  // map review index -> level, to scope error forgiveness per level. an overrule at
  // level N forgives that level's malfunction/constraint, but a higher level's error
  // still surfaces (it was not waved through)
  const peerReviewsForLevel = stoneMatched.guard
    ? getGuardPeerReviews(stoneMatched.guard)
    : [];
  const levelByReviewIndex = getAllReviewLevelsByIndex({
    peerReviews: peerReviewsForLevel,
  });
  // per-index wrapper: map the review index to its level, then read the shared
  // overruled check, so "is this level overruled" is decided in one place
  // (rule.require.single-source-of-truth-for-render)
  const isReviewLevelOverruled = (index: number): boolean =>
    isLevelOverruled({
      level: getOneReviewLevelByIndex({ levels: levelByReviewIndex, index }),
      overruledLevels,
    });
  // slugs of reviews that were skipped (not ran) due to exhaustion
  // .note = verdict 'exhausted' is only set when wasExhausted = true
  //         (define.invariant.review.peer.exhausted). exhausted reviewers at overruled
  //         levels are excluded — they are forgiven.
  // a disputed lane drives on this generation, so its exhaustion does not halt the
  // road — the exhaustion-halt set excludes both dispute-skipped lanes (S15) and
  // overruled levels, so a fully-disputed exhausted lane does not block the passage
  // the dispute was meant to grant.
  const skippedSlugs = getExhaustionHaltReviewerSlugs({
    meters: peerMeters,
    overruledLevels,
  });
  // every level terminal, overrule-aware, so an overruled lower level (whose raw
  // verdict stays 'rejected') still counts as terminal. without this, an overruled l1
  // leaves allTerminal false and skips this exhaustion halt, so an exhausted higher
  // level would pass without the human approval the invariant requires
  // (define.invariant.review.peer.passage).
  const allTerminal = isEveryReviewLevelTerminal({
    reviewers: peerMeters.map((m) => ({ level: m.level, verdict: m.verdict })),
    overruledLevels,
  });
  const exhaustionCheck = {
    anySkippedDueToExhaustion: skippedSlugs.length > 0,
    allTerminal,
    skippedSlugs,
  };

  // whose halt is this (S12/S16)? computed here, before the halt condition, because a
  // `better`-only exhaustion is not a halt at all — it falls through to the judge,
  // which subtracts the `better` concessions and passes. `better` is hard-capped by
  // budget by design: what remains at exhaustion is tech debt, earning no budget
  // increase and no human (define.invariant.review.peer.budget.urgent-earns-budget,
  // S16). only `none` (a lane never conceded → human wait) and `urgent` (ships harm →
  // budget + a human warn) halt here.
  const concession = await getStoneConcessionExhaustionKind({
    route: input.route,
    stone: stoneMatched.name,
    slugs: exhaustionCheck.skippedSlugs,
  });
  if (
    exhaustionCheck.anySkippedDueToExhaustion &&
    exhaustionCheck.allTerminal &&
    !approvalPrior &&
    concession !== 'better'
  ) {
    // build guard data for output
    const guardData = computeGuardData({
      stone: stoneMatched,
      artifactFiles,
      reviewArtifacts,
      judgeArtifacts: [],
      events,
      route: input.route,
      gitRoot,
      peerMeters,
      judgeRungForgiven,
    });

    // emit tree terminator since no judge will follow
    context.cliEmit.onGuardHalted?.({
      reason: 'peer reviewer budget exhausted',
    });

    // exhausted peer budget → its own passage status (not a 'blocked' + blocker)
    // .why = by phase an exhausted peer review looks like ordinary review.peer (a calm
    //        push), but it is truly a human-wait: a halt(exhausted) where a human must
    //        approve or extend. it maps direct to that halt with no phase-inference,
    //        and is ephemeral — the next --as <status> supersedes it (latest-entry-wins).
    // .note = writes the status directly (like malfunction/constraint), not via
    //         genStoneGuardBlockedEmit, which persists a 'blocked' status + blocker.
    // whose halt is this (S12)? the condition is a conjunction of three clauses: every
    // level terminal, a lane skipped for exhaustion, and — asked here — does a live
    // concession stand against the current generation? it asks about EVERY skipped
    // lane, never any: one lane the driver never conceded still awaits a human, so a
    // concession-worded halt would name the wrong owner and send a driver to top up a
    // budget and re-arrive into the same wall (rule.always.spend-own-levers-before-escalation).
    // the verdict is three-way (F028/S14/S16): a `better` set never reaches here (it
    // fell through above), so `concession` here is either `none` or `urgent`.
    const exhaustedReason = genRouteGuardExhaustedReason({
      slugs: exhaustionCheck.skippedSlugs,
      concession,
    });

    // detect a malfunction/constraint that unlocked and broke in this same pass — a
    // higher level that ran the instant the exhausted lower level went terminal.
    // .why = the guard has three gates (malfunction > constraint > exhaustion) that can
    //        concur; a halt that named only the exhaustion would send a human down a
    //        path that hits a second, unwarned block on re-arrive. so when a concurrent
    //        failure exists, one halt names every reason and persists the
    //        highest-precedence status.
    // .note = only review failures can concur here: judges never ran (the exhaustion
    //         halt returns before them), so a concurrent break is always a higher
    //         review level that unlocked. a review at an overruled level is forgiven.
    const concurrentMalfunctions = getAllReviewMalfunctions({
      reviews: reviewArtifacts,
      isLevelOverruled: isReviewLevelOverruled,
    });
    const concurrentConstraints = getAllReviewConstraints({
      reviews: reviewArtifacts,
      isLevelOverruled: isReviewLevelOverruled,
    });
    const hasConcurrentMalfunction = concurrentMalfunctions.length > 0;
    const hasConcurrentConstraint = concurrentConstraints.length > 0;

    if (hasConcurrentMalfunction || hasConcurrentConstraint) {
      // precedence: malfunction outranks constraint outranks exhaustion — the highest
      // drives the persisted status + the emit's headline passage kind
      const passage = hasConcurrentMalfunction ? 'malfunction' : 'blocked';

      // name every concurrent reason in precedence order, exhaustion last — the
      // render and the replay both key off this one combined reason string
      const combinedReason = asGuardHaltCombinedReason({
        hasMalfunction: hasConcurrentMalfunction,
        hasConstraint: hasConcurrentConstraint,
        exhaustedReason,
      });

      // persist the highest-precedence status + the full combined reason, so the
      // onBoot/onStop replay reconstructs every reason + remedy
      await setRoundOutput(() =>
        setPassageReport({
          report: new PassageReport({
            stone: stoneMatched.name,
            status: passage === 'malfunction' ? 'malfunction' : 'blocked',
            reason: combinedReason,
          }),
          route: input.route,
        }),
      );

      // collect the broken reviewers' detail into a stderr bucket (same shape the
      // standalone malfunction/constraint gates emit)
      const stderrBlocks = await Promise.all(
        [...concurrentMalfunctions, ...concurrentConstraints].map((review) =>
          formatArtifactStderrBlock({
            emoji: '🔎',
            label: 'review',
            index: review.index,
            path: review.path,
            fallback: `${review.exitClass} (exit code ${review.exitCode})`,
          }),
        ),
      );

      return {
        passed: false,
        refs: {
          reviews: reviewArtifacts.map((r) => r.path),
          judges: [],
        },
        emit: await stampGuardReport({
          stdout: formatRouteStoneEmit({
            operation: 'route.stone.set',
            stone: stoneMatched.name,
            action: 'passed',
            passage,
            reason: combinedReason,
            guard: guardData,
          }),
          stderr: joinArtifactStderrBlocks(stderrBlocks),
        }),
      };
    }

    // pure exhaustion (no concurrent failure) → its own passage status
    // .note = writes the status directly, not via genStoneGuardBlockedEmit
    await setRoundOutput(() =>
      setPassageReport({
        report: new PassageReport({
          stone: stoneMatched.name,
          status: 'exhausted',
          reason: exhaustedReason,
        }),
        route: input.route,
      }),
    );

    return {
      passed: false,
      refs: {
        reviews: reviewArtifacts.map((r) => r.path),
        judges: [],
      },
      emit: await stampGuardReport({
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'blocked',
          reason: exhaustedReason,
          guard: guardData,
        }),
      }),
    };
  }

  // run judges (reuses prior artifacts internally, only runs incomplete ones)
  const judgeArtifacts =
    stoneMatched.guard.judges.length > 0
      ? await runStoneGuardJudges(
          {
            stone: stoneMatched,
            guard: stoneMatched.guard,
            hash,
            iteration,
            route: input.route,
          },
          collectContext,
        )
      : [];

  // a judge is forgiven only when the human overruled the judge rung and that judge
  // malfunctioned — the single per-judge forgiveness rule every consumer reads, so a
  // rung overrule forgives a broken judge but never a co-judge that legitimately holds
  // (e.g. approved? still awaiting sign-off) — the "one gate, not the corridor"
  // invariant at the judge tier (define.review.human-forgiveness.md).
  const isJudgeForgivenByRung = (
    judge: RouteStoneGuardJudgeArtifact,
  ): boolean => judgeRungForgiven && judge.exitClass === 'malfunction';

  // check for malfunctions (exit code != 0 and != 2)
  // .note = a malfunction at an overruled level is forgiven (human waved it through)
  const reviewMalfunctions = getAllReviewMalfunctions({
    reviews: reviewArtifacts,
    isLevelOverruled: isReviewLevelOverruled,
  });
  const judgeMalfunctions = getAllJudgeMalfunctions({
    judges: judgeArtifacts,
    isForgiven: isJudgeForgivenByRung,
  });
  const hasMalfunction =
    reviewMalfunctions.length > 0 || judgeMalfunctions.length > 0;

  if (hasMalfunction) {
    // record malfunction status in passage.jsonl, with which lanes broke and why
    // .why = a malfunction is often partial; every later surface (route.drive on stop and on
    //        boot) reads only this record, so without the lanes it can say no more than
    //        "it broke" and misroutes driver work to a human
    const malfunctionReason = asGuardMalfunctionReason({
      reviews: reviewMalfunctions,
      judges: judgeMalfunctions,
      reviewTotal: reviewArtifacts.length,
      rejectedTotal: getOneRejectedUnforgivenTotal({
        reviews: reviewArtifacts,
        isLevelOverruled: isReviewLevelOverruled,
      }),
    });
    await setRoundOutput(() =>
      setPassageReport({
        report: new PassageReport({
          stone: stoneMatched.name,
          status: 'malfunction',
          reason: malfunctionReason,
        }),
        route: input.route,
      }),
    );

    // build guard data for output
    const guardData = computeGuardData({
      stone: stoneMatched,
      artifactFiles,
      reviewArtifacts,
      judgeArtifacts,
      events,
      route: input.route,
      gitRoot,
      peerMeters,
      judgeRungForgiven,
    });

    // collect malfunction details for stderr — reviews first, then judges
    const reviewStderrBlocks = await Promise.all(
      reviewMalfunctions.map((review) =>
        formatArtifactStderrBlock({
          emoji: '🔎',
          label: 'review',
          index: review.index,
          path: review.path,
          fallback: `malfunction (exit code ${review.exitCode})`,
        }),
      ),
    );
    const judgeStderrBlocks = await Promise.all(
      judgeMalfunctions.map((judge) =>
        formatArtifactStderrBlock({
          emoji: '🪶',
          label: 'judge',
          index: judge.index,
          path: judge.path,
          fallback: `malfunction (exit code ${judge.exitCode})`,
        }),
      ),
    );

    return {
      passed: false,
      refs: {
        reviews: reviewArtifacts.map((r) => r.path),
        judges: judgeArtifacts.map((j) => j.path),
      },
      emit: await stampGuardReport({
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'malfunction',
          // the whole reason — the tree shows its header, and names each broken part beneath
          reason: malfunctionReason || 'reviewer or judge malfunctioned',
          guard: guardData,
        }),
        stderr: joinArtifactStderrBlocks([
          ...reviewStderrBlocks,
          ...judgeStderrBlocks,
        ]),
      }),
    };
  }

  // check for genuine constraints (exit code 2 without blockers)
  // .note = exit 2 with blockers = review completed, found issues (not a constraint)
  // .note = exit 2 without blockers = genuine constraint (e.g., absent API key)
  // .note = a constraint at an overruled level is forgiven (human waved it through)
  const reviewConstraints = getAllReviewConstraints({
    reviews: reviewArtifacts,
    isLevelOverruled: isReviewLevelOverruled,
  });
  const hasConstraint = reviewConstraints.length > 0;

  if (hasConstraint) {
    // record blocked status in passage.jsonl, with the guard blocker that names it
    // .note = never a bare `blocked` row: a row with no blocker is the driver's own wall
    //         (`--as blocked`), and the drive surfaces would halt it as one and demand an
    //         articulation the driver never wrote
    await setRoundOutput(() =>
      setPassageReport({
        report: new PassageReport({
          stone: stoneMatched.name,
          status: 'blocked',
          blocker: 'review.peer.constraint',
          reason: 'reviewer constraint',
        }),
        route: input.route,
      }),
    );

    // build guard data for output
    const guardDataForConstraint = computeGuardData({
      stone: stoneMatched,
      artifactFiles,
      reviewArtifacts,
      judgeArtifacts,
      events,
      route: input.route,
      gitRoot,
      peerMeters,
      judgeRungForgiven,
    });

    // the lever each refusal named, so the halt offers a partition only to an overflow
    const constraintLever = await getOneRouteGuardReviewPeerConstraintLever({
      paths: reviewConstraints.map((review) => review.path),
    });

    // collect constraint details for stderr
    const stderrBlocks = await Promise.all(
      reviewConstraints.map((review) =>
        formatArtifactStderrBlock({
          emoji: '🔎',
          label: 'review',
          index: review.index,
          path: review.path,
          fallback: `constraint (exit code ${review.exitCode})`,
        }),
      ),
    );

    return {
      passed: false,
      refs: {
        reviews: reviewArtifacts.map((r) => r.path),
        judges: judgeArtifacts.map((j) => j.path),
      },
      emit: await stampGuardReport({
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'blocked',
          reason: 'reviewer constraint',
          guard: { ...guardDataForConstraint, constraintLever },
        }),
        stderr: joinArtifactStderrBlocks(stderrBlocks),
      }),
    };
  }

  // build guard data from artifacts and events for tree output
  const guardData = computeGuardData({
    stone: stoneMatched,
    artifactFiles,
    reviewArtifacts,
    judgeArtifacts,
    events,
    route: input.route,
    gitRoot,
    peerMeters,
    judgeRungForgiven,
  });

  // check if all judges pass — each judge either passed on merit or was forgiven
  // per-judge by a rung overrule (a malfunction only). a stone-wide
  // `judgeRungForgiven || every(passed)` would also forgive an awaited approval, the
  // skeleton-key defect this behavior closes one tier up. scope stays to the malfunction
  // via the shared predicate above.
  const allJudgesPassed = judgeArtifacts.every(
    (judge) => judge.passed || isJudgeForgivenByRung(judge),
  );

  if (allJudgesPassed) {
    // gate: peer reviews must be absorbed before passage
    // .why = a driver may not progress until it has written a .taken response to
    //        every live peer critique that carries blockers
    // .note = slots between allJudgesPassed and setStonePassage so it runs only when
    //         judges would pass, and before the report is cleared below.
    //         both gates stay: the entrance gate above catches debt carried into a
    //         round; this one catches debt created by it — a given that did not exist
    //         when the entrance gate ran

    // forgive feedbackAbsorption for reviewers at an overruled level
    // .why = an admin escape (--as overruled / --as forced) must not be re-gated by a
    //        requirement a driver must satisfy; the human took responsibility for the
    //        passage, so a waved-through level's critique needs no .taken
    //        (design-note B6; mirrors the malfunction/constraint per-level forgiveness).
    //        reads the one source of truth for "unabsorbed and not forgiven by an
    //        overrule" — the same primitive the overrule short-circuits
    //        (setStoneAsOverruled / setStoneAsForced via getOneStoneGuardOverruleTarget)
    //        reads, so this gate cannot drift from them on which reviewers a waved
    //        level forgives.
    const feedbackUnabsorbedToBlock =
      await getAllStoneGuardReviewPeerFeedbackUnabsorbedUnforgiven({
        stone: stoneMatched,
        route: input.route,
      });

    if (feedbackUnabsorbedToBlock.length > 0) {
      // no onGuardHalted here — the feedbackAbsorption gate runs only inside
      // allJudgesPassed, so the judge event already closed the tree; the
      // reply-prompt below states the halt reason
      return genRoundBlockedEmit({
        stone: stoneMatched.name,
        route: input.route,
        blocker: 'review.peer.unabsorbed',
        reason: `peer review awaits feedbackAbsorption: ${asRouteGuardReviewPeerSlugList(
          { reviewers: feedbackUnabsorbedToBlock },
        )}`,
        refs: {
          reviews: reviewArtifacts.map((r) => r.path),
          judges: judgeArtifacts.map((j) => j.path),
        },
        emit: await stampGuardReport({
          stdout: formatRouteGuardReviewPeerFeedbackAbsorbPrompt({
            case: 'reply-prompt',
            stone: stoneMatched.name,
            root: gitRoot,
            reviewers: feedbackUnabsorbedToBlock,
          }),
        }),
      });
    }

    await setRoundOutput(() =>
      setStonePassage({ stone: stoneMatched, route: input.route }),
    );

    // clear blocked triggers for this stone and all earlier stones
    await clearBlockedTriggersUpTo({
      stone: stoneMatched,
      stones,
      route: input.route,
    });

    // update bouncer cache (stone passage may release protected artifacts)
    const bouncerCache = await computeRouteBouncerCache({
      cwd: process.cwd(),
      route: input.route,
    });
    await setRouteBouncerCache({ cache: bouncerCache, route: input.route });

    // clear any prior blocker report
    await delStoneGuardBlockerReport({
      stone: stoneMatched.name,
      route: input.route,
    });

    // determine passage reason
    // .note = if any rung was overruled (a peer level or the judge rung), passage was
    //         enabled by overrule; else it passed the judges cleanly
    const passageReason = overruledLevels.size > 0 ? 'overruled' : 'allowed';

    return {
      passed: true,
      refs: {
        reviews: reviewArtifacts.map((r) => r.path),
        judges: judgeArtifacts.map((j) => j.path),
      },
      emit: await stampGuardReport({
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: passageReason,
          guard: guardData,
        }),
      }),
    };
  }

  // collect rejection reasons — a judge forgiven by a rung overrule (a malfunction the
  // human waved) is no longer a failure, so it drops out; only a judge that
  // genuinely holds stays, so the blocked reason names the real gate, not the crash
  const failedJudges = getAllFailedJudges({
    judges: judgeArtifacts,
    isForgiven: isJudgeForgivenByRung,
  });
  const reasons = asFailedJudgeReasons({ judges: failedJudges });

  // determine blocker type from failed judges
  const blocker = computeBlockedOn({
    failedJudges,
    guard: stoneMatched.guard,
  });

  // build detailed stderr for failed judges as tree bucket
  const stderrBlocks = await Promise.all(
    failedJudges.map((judge) =>
      formatArtifactStderrBlock({
        emoji: '🪶',
        label: 'judge',
        index: judge.index,
        path: judge.path,
        fallback: judge.reason ?? null,
      }),
    ),
  );

  // blocked on failed judges — persist + return via the shared blocked tail
  return genRoundBlockedEmit({
    stone: stoneMatched.name,
    route: input.route,
    blocker,
    reason: reasons,
    refs: {
      reviews: reviewArtifacts.map((r) => r.path),
      judges: judgeArtifacts.map((j) => j.path),
    },
    emit: await stampGuardReport({
      stdout: formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: stoneMatched.name,
        action: 'passed',
        passage: 'blocked',
        reason: reasons,
        guard: guardData,
      }),
      stderr: joinArtifactStderrBlocks(stderrBlocks),
    }),
  });
};

/**
 * .what = builds guard data for tree output from artifacts and events
 * .why = bridges review/judge artifacts with progress events for display
 */
const computeGuardData = (input: {
  stone: RouteStone;
  artifactFiles: string[];
  reviewArtifacts: RouteStoneGuardReviewArtifact[];
  judgeArtifacts: RouteStoneGuardJudgeArtifact[];
  events: GuardProgressEvent[];
  route: string;
  gitRoot: string;
  peerMeters?: GuardPeerMeterStatus[];
  /** whether the human overruled the judge rung (JUDGE_LEVEL), so a forgiven judge
   *  reads "overruled ✓ — forgiven by human" rather than a bare "✗ blocked" that
   *  contradicts the top-line `passage = overruled`
   *  (rule.require.single-source-of-truth-for-render) */
  judgeRungForgiven?: boolean;
}) => {
  // find events that completed (have endedAt)
  const reviewEventsCompleted = input.events.filter(
    (e) => e.step.phase === 'review' && e.inflight?.endedAt,
  );
  const judgeEventsCompleted = input.events.filter(
    (e) => e.step.phase === 'judge' && e.inflight?.endedAt,
  );

  // extract peer reviews for command lookup
  const stonePeerReviews = input.stone.guard
    ? getGuardPeerReviews(input.stone.guard)
    : [];

  // use original artifact globs for display (not expanded file paths) — otherwise a
  // guard declaring src/**/* would print hundreds of lines
  const artifactGlobs = input.stone.guard?.artifacts ?? [];

  return {
    artifactFiles: artifactGlobs,
    reviews: input.reviewArtifacts.map((r) => {
      // match event by step.index (0-based) to artifact.index (1-based)
      const event = reviewEventsCompleted.find(
        (e) => e.step.index === r.index - 1,
      );
      const isCached = !event;
      // for cached reviews, use duration from artifact (parsed from stdout);
      // for fresh reviews, use duration from event time
      const durationSec = isCached
        ? r.durationMs !== null
          ? r.durationMs / 1000
          : null
        : computeDuration(event);
      const peerReview = stonePeerReviews[r.index - 1];

      // build peer info from review + meter state
      const peer = peerReview
        ? {
            slug: peerReview.slug,
            level: peerReview.level,
            rounds:
              input.peerMeters?.find((m) => m.slug === peerReview.slug)
                ?.rounds ?? 0,
            budget: peerReview.budget,
          }
        : undefined;

      return {
        index: r.index,
        cmd: peerReview ? getReviewPeerRunCmd(peerReview) : '',
        cached: isCached
          ? ({ hit: true, on: artifactGlobs } as { hit: true; on: string[] })
          : (false as const),
        durationSec,
        blockers: r.blockers,
        nitpicks: r.nitpicks,
        tallier: r.tallier,
        talliedBy: r.talliedBy,
        path: asGuardDisplayPath({ pathAbsolute: r.path, root: input.gitRoot }),
        exitClass: r.exitClass,
        peer,
      };
    }),
    judges: input.judgeArtifacts.map((j) => {
      const event = judgeEventsCompleted.find(
        (e) => e.step.index === j.index - 1,
      );
      const durationSec = computeDuration(event);
      const isCached = !event;
      // a judge reads as overruled only when the rung was forgiven AND this judge
      // malfunctioned — the same per-judge scope allJudgesPassed uses, so a co-judge
      // that legitimately holds never falsely paints as forgiven
      const overruled =
        (input.judgeRungForgiven ?? false) && j.exitClass === 'malfunction';
      return {
        index: j.index,
        cmd: input.stone.guard?.judges[j.index - 1] ?? '',
        cached: isCached
          ? ({ hit: true, on: artifactGlobs } as { hit: true; on: string[] })
          : (false as const),
        durationSec,
        passed: j.passed,
        reason: j.reason,
        // the same root as the review branch above, and as
        // getAllReviewPeerMeterStatuses, so one artifact never carries two path forms
        // keyed on which array it lands in
        // (rule.require.single-source-of-truth-for-render)
        path: asGuardDisplayPath({ pathAbsolute: j.path, root: input.gitRoot }),
        overruled,
      };
    }),
    // peerMeters as-is (source of truth — getAllReviewPeerMeterStatuses already
    // computed verdict with full context: exitClass, nitpicks, allowBlockers,
    // allowNitpicks)
    peerMeters: input.peerMeters,
  };
};

/**
 * .what = computes duration in seconds from a completed progress event
 * .why = derives display duration from event timestamps
 */
const computeDuration = (
  event: GuardProgressEvent | undefined,
): number | null => {
  if (!event?.inflight?.endedAt) return null;
  const beganMs = new Date(event.inflight.beganAt).getTime();
  const endedMs = new Date(event.inflight.endedAt).getTime();
  return (endedMs - beganMs) / 1000;
};

/**
 * .what = determines blocker type from failed judges
 * .why = enables hook mode to determine if agent can stop
 *
 * priority:
 * 1. review failures (agent can fix code)
 * 2. approval failures (agent must wait for human)
 * 3. other judge failures (agent may be able to fix)
 */
const computeBlockedOn = (input: {
  failedJudges: RouteStoneGuardJudgeArtifact[];
  guard: RouteStone['guard'];
}): 'review.self' | 'review.peer' | 'approval' | 'judge' => {
  if (!input.guard) return 'judge';

  // classify each failed judge
  let hasReviewFailure = false;
  let hasApprovalFailure = false;
  let hasOtherFailure = false;

  for (const judge of input.failedJudges) {
    const judgeCmd = input.guard.judges[judge.index - 1] ?? '';

    if (judgeCmd.includes('--mechanism reviewed?')) {
      hasReviewFailure = true;
    } else if (judgeCmd.includes('--mechanism approved?')) {
      hasApprovalFailure = true;
    } else {
      hasOtherFailure = true;
    }
  }

  // priority: review > approval > other
  if (hasReviewFailure) return 'review.peer';
  if (hasApprovalFailure && !hasOtherFailure) return 'approval';
  return 'judge';
};

/**
 * .what = clears blocked triggers for a stone and all earlier stones
 * .why = when a later stone is passed, earlier blocked states are resolved
 */
const clearBlockedTriggersUpTo = async (input: {
  stone: RouteStone;
  stones: RouteStone[];
  route: string;
}): Promise<void> => {
  // find index of current stone
  const stoneIndex = input.stones.findIndex((s) => s.name === input.stone.name);
  if (stoneIndex < 0) return;

  // clear blocked triggers for this stone and all earlier stones
  const stonesToClear = input.stones.slice(0, stoneIndex + 1);
  for (const stone of stonesToClear) {
    await delBlockedTriggeredReport({ stone: stone.name, route: input.route });
  }
};
