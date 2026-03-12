import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import type { GuardProgressEvent } from '@src/domain.objects/Driver/GuardProgressEvent';
import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import {
  getGuardPeerReviews,
  getGuardSelfReviews,
} from '@src/domain.objects/Driver/RouteStoneGuard';
import type { RouteStoneGuardJudgeArtifact } from '@src/domain.objects/Driver/RouteStoneGuardJudgeArtifact';
import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { computeRouteBouncerCache } from '../bouncer/computeRouteBouncerCache';
import { setRouteBouncerCache } from '../bouncer/setRouteBouncerCache';
import { delStoneGuardBlockerReport } from '../drive/delStoneGuardBlockerReport';
import { setStoneGuardBlockerReport } from '../drive/setStoneGuardBlockerReport';
import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { computeStoneReviewInputHash } from '../guard/computeStoneReviewInputHash';
import { getAllStoneGuardArtifactsByHash } from '../guard/getAllStoneGuardArtifactsByHash';
import { runStoneGuardReviews } from '../guard/runStoneGuardReviews';
import { runStoneGuardJudges } from '../judges/runStoneGuardJudges';
import { setPassageReport } from '../passage/setPassageReport';
import { getStonePromises } from '../promise/getStonePromises';
import { setSelfReviewTriggeredReport } from '../promise/setSelfReviewTriggeredReport';
import { findOneStoneByPattern } from './asStoneGlob';
import { getAllStoneArtifacts } from './getAllStoneArtifacts';
import { getAllStones } from './getAllStones';
import { setStonePassage } from './setStonePassage';

/**
 * .what = attempts to mark a stone as passed after guard validation
 * .why = enables robots to complete milestones with guard verification
 */
export const setStoneAsPassed = async (
  input: {
    stone: string;
    route: string;
  },
  context: ContextCliEmit,
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
  if (!stoneMatched) {
    throw new BadRequestError('stone not found', { stone: input.stone });
  }

  // check artifact found
  const artifactFiles = await getAllStoneArtifacts({
    stone: stoneMatched,
    route: input.route,
  });
  if (artifactFiles.length === 0) {
    throw new BadRequestError(
      `artifact not found; run route.stone.get --stone ${stoneMatched.name} --say to see instructions`,
      { stone: stoneMatched.name },
    );
  }

  // if no guard, auto-pass
  if (!stoneMatched.guard) {
    await setStonePassage({ stone: stoneMatched, route: input.route });

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

  // check for review.selfs (must be promised before peer reviews)
  const selfReviews = getGuardSelfReviews(stoneMatched.guard);
  if (selfReviews.length > 0) {
    // compute hash for triggered report
    const promiseHash = await computeStoneReviewInputHash({
      stone: stoneMatched,
      route: input.route,
    });

    // get all promises (hashless — firm checkpoints)
    const promises = await getStonePromises({
      stone: stoneMatched,
      route: input.route,
    });
    const promisedSlugs = new Set(promises.map((p) => p.slug));

    // find first unpromised review.self
    const unpromised = selfReviews.filter((r) => !promisedSlugs.has(r.slug));
    if (unpromised.length > 0) {
      const nextReview = unpromised[0]!;
      const nextIndex = selfReviews.findIndex(
        (r) => r.slug === nextReview.slug,
      );

      // record that self-review was triggered (for time enforcement only)
      // note: sinceOnly prevents .uptil creation, which would trigger rush on first promise
      await setSelfReviewTriggeredReport(
        {
          stone: stoneMatched.name,
          slug: nextReview.slug,
          hash: promiseHash,
          route: input.route,
        },
        { sinceOnly: true },
      );

      // record blocker report: blocked on review.self
      await setStoneGuardBlockerReport({
        stone: stoneMatched.name,
        route: input.route,
        blocker: 'review.self',
        reason: `review.self required: ${nextReview.slug}`,
      });

      return {
        passed: false,
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
              index: nextIndex + 1,
              total: selfReviews.length,
            },
          }),
        },
      };
    }
  }

  // if guard has no reviews and no judges, auto-pass (guard only customizes artifact detection)
  const peerReviews = getGuardPeerReviews(stoneMatched.guard);
  if (peerReviews.length === 0 && stoneMatched.guard.judges.length === 0) {
    await setStonePassage({ stone: stoneMatched, route: input.route });

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
      stone: stoneMatched.name,
      guard: stoneMatched.guard.path,
    });
  }

  // compute review input hash for cache lookup
  //
  // hash principle: each component hashes its inputs
  // - reviews hash on artifacts (their input) → this review input hash
  // - judges hash on reviews + approvals (their input) → computed internally by runStoneGuardJudges
  //
  // cascade scenarios:
  // - artifact change → review input hash changes → fresh reviews → judge input hash changes → fresh judge
  // - approval granted → review input hash unchanged → cached reviews → judge input hash changes → fresh judge
  // - review re-run after fix → review content changes → judge input hash changes → fresh judge
  const hash = await computeStoneReviewInputHash({
    stone: stoneMatched,
    route: input.route,
  });

  // check for prior artifacts to determine iteration number
  const priorArtifacts = await getAllStoneGuardArtifactsByHash({
    stone: stoneMatched,
    hash,
    route: input.route,
  });

  // determine current iteration (shared for both reviews and judges)
  const maxPriorIteration = Math.max(
    0,
    ...priorArtifacts.reviews.map((r) => r.iteration),
    ...priorArtifacts.judges.map((j) => j.iteration),
  );
  const iteration = maxPriorIteration + 1;

  // collect progress events for guard tree output
  const events: GuardProgressEvent[] = [];
  const totalReviews = peerReviews.length;
  const totalJudges = stoneMatched.guard.judges.length;
  const totalItems = totalReviews + totalJudges;

  // create context that enriches events with position for branch format
  const collectContext: ContextCliEmit = {
    cliEmit: {
      onGuardProgress: (event) => {
        events.push(event);

        // compute global position across reviews + judges
        const globalIndex =
          event.step.phase === 'review'
            ? event.step.index
            : totalReviews + event.step.index;

        context.cliEmit.onGuardProgress(event, {
          index: globalIndex,
          total: totalItems,
        });
      },
    },
  };

  // run reviews (reuses prior artifacts internally, only runs incomplete ones)
  const reviewArtifacts =
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
      : [];

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

  // check for malfunctions (exit code != 0 and != 2)
  const reviewMalfunctions = reviewArtifacts.filter(
    (r) => r.exitClass === 'malfunction',
  );
  const judgeMalfunctions = judgeArtifacts.filter(
    (j) => j.exitClass === 'malfunction',
  );
  const hasMalfunction =
    reviewMalfunctions.length > 0 || judgeMalfunctions.length > 0;

  if (hasMalfunction) {
    // record malfunction status in passage.jsonl
    await setPassageReport({
      report: new PassageReport({
        stone: stoneMatched.name,
        status: 'malfunction',
      }),
      route: input.route,
    });

    // build guard data for output
    const guardData = computeGuardData({
      stone: stoneMatched,
      artifactFiles,
      reviewArtifacts,
      judgeArtifacts,
      events,
      route: input.route,
    });

    // collect malfunction details for stderr
    const stderrLines: string[] = [];
    for (const review of reviewMalfunctions) {
      if (stderrLines.length > 0) stderrLines.push('');
      stderrLines.push(`🔎 review ${review.index}`);
      try {
        const content = await fs.readFile(review.path, 'utf-8');
        for (const line of content.split('\n')) {
          stderrLines.push(`   ${line}`);
        }
      } catch {
        stderrLines.push(`   └─ malfunction (exit code ${review.exitCode})`);
      }
    }
    for (const judge of judgeMalfunctions) {
      if (stderrLines.length > 0) stderrLines.push('');
      stderrLines.push(`🪶 judge ${judge.index}`);
      try {
        const content = await fs.readFile(judge.path, 'utf-8');
        for (const line of content.split('\n')) {
          stderrLines.push(`   ${line}`);
        }
      } catch {
        stderrLines.push(`   └─ malfunction (exit code ${judge.exitCode})`);
      }
    }

    return {
      passed: false,
      refs: {
        reviews: reviewArtifacts.map((r) => r.path),
        judges: judgeArtifacts.map((j) => j.path),
      },
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'malfunction',
          reason: 'reviewer or judge malfunctioned',
          guard: guardData,
        }),
        stderr: stderrLines.length > 0 ? stderrLines.join('\n') : undefined,
      },
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
  });

  // check if all judges pass
  const allJudgesPassed = judgeArtifacts.every((j) => j.passed);

  if (allJudgesPassed) {
    await setStonePassage({ stone: stoneMatched, route: input.route });

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

    return {
      passed: true,
      refs: {
        reviews: reviewArtifacts.map((r) => r.path),
        judges: judgeArtifacts.map((j) => j.path),
      },
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'allowed',
          guard: guardData,
        }),
      },
    };
  }

  // collect rejection reasons
  const failedJudges = judgeArtifacts.filter((j) => !j.passed);
  const reasons = failedJudges
    .map((j) => j.reason || `judge ${j.index} failed`)
    .join('; ');

  // determine blocker type from failed judges
  const blocker = computeBlockedOn({
    failedJudges,
    guard: stoneMatched.guard,
  });

  // record blocker report
  await setStoneGuardBlockerReport({
    stone: stoneMatched.name,
    route: input.route,
    blocker,
    reason: reasons,
  });

  // build detailed stderr for failed judges as tree bucket
  const stderrLines: string[] = [];
  for (const judge of failedJudges) {
    // blank line between judges (not before first)
    if (stderrLines.length > 0) {
      stderrLines.push('');
    }

    stderrLines.push(`🪶 judge ${judge.index}`);

    // read artifact content (already formatted with tree buckets)
    try {
      const artifactContent = await fs.readFile(judge.path, 'utf-8');
      // indent each line by 3 spaces to nest under 🔎 judge N
      for (const line of artifactContent.split('\n')) {
        stderrLines.push(`   ${line}`);
      }
    } catch {
      // fallback to reason if file read fails
      if (judge.reason) {
        stderrLines.push(`   └─ ${judge.reason}`);
      }
    }
  }

  return {
    passed: false,
    refs: {
      reviews: reviewArtifacts.map((r) => r.path),
      judges: judgeArtifacts.map((j) => j.path),
    },
    emit: {
      stdout: formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: stoneMatched.name,
        action: 'passed',
        passage: 'blocked',
        reason: reasons,
        guard: guardData,
      }),
      stderr: stderrLines.length > 0 ? stderrLines.join('\n') : undefined,
    },
  };
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

  return {
    artifactFiles: input.artifactFiles.map((f) => path.basename(f)),
    reviews: input.reviewArtifacts.map((r) => {
      // match event by step.index (0-based) to artifact.index (1-based)
      const event = reviewEventsCompleted.find(
        (e) => e.step.index === r.index - 1,
      );
      const durationSec = computeDuration(event);
      return {
        index: r.index,
        cmd: stonePeerReviews[r.index - 1] ?? '',
        cached: !event,
        durationSec,
        blockers: r.blockers,
        nitpicks: r.nitpicks,
        path: path.relative(input.route, r.path),
      };
    }),
    judges: input.judgeArtifacts.map((j) => {
      const event = judgeEventsCompleted.find(
        (e) => e.step.index === j.index - 1,
      );
      const durationSec = computeDuration(event);
      return {
        index: j.index,
        cmd: input.stone.guard?.judges[j.index - 1] ?? '',
        cached: !event,
        durationSec,
        passed: j.passed,
        reason: j.reason,
        path: path.relative(input.route, j.path),
      };
    }),
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
