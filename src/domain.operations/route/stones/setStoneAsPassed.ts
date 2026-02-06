import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import type { GuardProgressEvent } from '@src/domain.objects/Driver/GuardProgressEvent';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneGuardJudgeArtifact } from '@src/domain.objects/Driver/RouteStoneGuardJudgeArtifact';
import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { computeStoneReviewInputHash } from '../guard/computeStoneReviewInputHash';
import { getAllStoneGuardArtifactsByHash } from '../guard/getAllStoneGuardArtifactsByHash';
import { runStoneGuardReviews } from '../guard/runStoneGuardReviews';
import { runStoneGuardJudges } from '../judges/runStoneGuardJudges';
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
  emit: { stdout: string } | null;
}> => {
  // find the stone
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findStoneByGlob(stones, input.stone);
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

  // if guard has no reviews and no judges, auto-pass (guard only customizes artifact detection)
  if (
    stoneMatched.guard.reviews.length === 0 &&
    stoneMatched.guard.judges.length === 0
  ) {
    await setStonePassage({ stone: stoneMatched, route: input.route });
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
  if (
    stoneMatched.guard.reviews.length > 0 &&
    stoneMatched.guard.judges.length === 0
  ) {
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
  const collectContext: ContextCliEmit = {
    cliEmit: {
      onGuardProgress: (event) => {
        events.push(event);
        context.cliEmit.onGuardProgress(event);
      },
    },
  };

  // run reviews (reuses prior artifacts internally, only runs incomplete ones)
  const reviewArtifacts =
    stoneMatched.guard.reviews.length > 0
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
        cmd: input.stone.guard?.reviews[r.index - 1] ?? '',
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
 * .what = finds a stone by glob pattern
 * .why = enables flexible stone lookup
 */
const findStoneByGlob = (
  stones: RouteStone[],
  pattern: string,
): RouteStone | null => {
  // convert glob pattern to regex
  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexStr}$`);

  const matched = stones.filter((s) => regex.test(s.name));
  return matched[0] ?? null;
};
