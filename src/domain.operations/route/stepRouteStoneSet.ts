import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import { getGuardSelfReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { delDriveBlockerState } from './drive/delDriveBlockerState';
import { formatRouteStoneEmit } from './formatRouteStoneEmit';
import type { ContextReviewBrainSupply } from './genReviewBrainSupply';
import { computeStoneReviewInputHash } from './guard/review/computeStoneReviewInputHash';
import { computePromisedReviewCount } from './guard/review/self/computePromisedReviewCount';
import { findNextUnpromisedReview } from './guard/review/self/findNextUnpromisedReview';
import { findSelfReviewBySlug } from './guard/review/self/findSelfReviewBySlug';
import { getPromisedSlugsSet } from './guard/review/self/getPromisedSlugsSet';
import { getSelfReviewChallengeDecision } from './guard/review/self/getSelfReviewChallengeDecision';
import { getSelfReviewIndex } from './guard/review/self/getSelfReviewIndex';
import { getSelfReviewSlugs } from './guard/review/self/getSelfReviewSlugs';
import { getStonePromises } from './guard/review/self/getStonePromises';
import { isInvalidSelfReviewSlug } from './guard/review/self/isInvalidSelfReviewSlug';
import { findOneStoneByPattern } from './stones/asStoneGlob';
import { getAllStones } from './stones/getAllStones';
import { setStoneAsApproved } from './stones/setStoneAsApproved';
import { setStoneAsBlocked } from './stones/setStoneAsBlocked';
import { setStoneAsContemplated } from './stones/setStoneAsContemplated';
import { setStoneAsForced } from './stones/setStoneAsForced';
import { setStoneAsOverruled } from './stones/setStoneAsOverruled';
import { setStoneAsPassed } from './stones/setStoneAsPassed';
import { setStoneAsPromised } from './stones/setStoneAsPromised';
import { setStoneAsRewound } from './stones/setStoneAsRewound';

/**
 * .what = orchestrates set of stone status (passed, approved, promised, or rewound)
 * .why = enables robots and humans to mark milestones complete or rewind for fresh evaluation
 */
export const stepRouteStoneSet = async (
  inputRaw: {
    stone: string;
    route: string;
    as:
      | 'passed'
      | 'approved'
      | 'promised'
      | 'contemplated'
      | 'rewound'
      | 'blocked'
      | 'arrived'
      | 'overruled'
      | 'forced';
    that?: string;
    yield?: 'keep' | 'drop';
  },
  context: ContextCliEmit & ContextReviewBrainSupply & { isTTY: boolean },
): Promise<{
  passed?: boolean;
  approved?: boolean;
  promised?: boolean;
  contemplated?: boolean;
  rewound?: boolean;
  blocked?: boolean;
  overruled?: boolean;
  forced?: boolean;
  challenged?: boolean;
  refs?: { reviews: string[]; judges: string[] };
  emit: { stdout: string; stderr?: string } | null;
}> => {
  // alias translator: 'arrived' maps to 'passed' (creates immutable copy)
  const input =
    inputRaw.as === 'arrived'
      ? { ...inputRaw, as: 'passed' as const }
      : inputRaw;

  // dispatch to appropriate operation
  if (input.as === 'approved') {
    const result = await setStoneAsApproved(
      {
        stone: input.stone,
        route: input.route,
      },
      { isTTY: context.isTTY },
    );
    return {
      approved: result.approved,
      emit: result.emit,
    };
  }

  if (input.as === 'rewound') {
    const result = await setStoneAsRewound(
      {
        stone: input.stone,
        route: input.route,
        yield: input.yield,
      },
      context,
    );
    return {
      rewound: result.rewound,
      emit: result.emit,
    };
  }

  if (input.as === 'passed') {
    const result = await setStoneAsPassed(
      {
        stone: input.stone,
        route: input.route,
      },
      context,
    );

    // if passed successfully, clear drive blocker state (progress made)
    if (result.passed) {
      await delDriveBlockerState({ route: input.route });
    }

    return {
      passed: result.passed,
      refs: result.refs,
      emit: result.emit,
    };
  }

  if (input.as === 'promised') {
    // validate --that is provided
    if (!input.that) {
      throw new BadRequestError('--that is required for --as promised', {
        stone: input.stone,
      });
    }

    // find the stone
    const stones = await getAllStones({ route: input.route });
    const stoneMatched = findOneStoneByPattern({
      stones,
      pattern: input.stone,
    });
    if (!stoneMatched) {
      throw new BadRequestError('stone not found', { stone: input.stone });
    }

    // validate slug exists in stone's review.selfs
    const selfReviews = stoneMatched.guard
      ? getGuardSelfReviews(stoneMatched.guard)
      : [];
    const validSlugs = getSelfReviewSlugs({ selfReviews });
    if (isInvalidSelfReviewSlug({ slug: input.that, validSlugs })) {
      throw new BadRequestError(
        `invalid review.self slug: "${input.that}". valid options: ${validSlugs.join(', ')}`,
        { stone: input.stone, slug: input.that, validSlugs },
      );
    }

    // compute hash for promise
    const hash = await computeStoneReviewInputHash({
      stone: stoneMatched,
      route: input.route,
    });

    // check time enforcement and hashbar threshold for self-review
    const reviewSelf = findSelfReviewBySlug({ selfReviews, slug: input.that });
    const reviewIndex = getSelfReviewIndex({ selfReviews, slug: input.that });
    const challengeDecision = await getSelfReviewChallengeDecision({
      stone: stoneMatched.name,
      slug: input.that,
      hash,
      route: input.route,
      index: reviewIndex, // 1-based (computed by getSelfReviewIndex)
      hashbar: reviewSelf?.hashbar,
    });

    // if challenged, return early with patience message (and optionally absent or rush confrontation)
    if (challengeDecision.decision !== 'allowed') {
      return {
        challenged: true,
        emit: {
          stdout: formatRouteStoneEmit({
            operation: 'route.stone.set',
            stone: stoneMatched.name,
            action: challengeDecision.decision,
            slug: input.that,
            route: input.route,
            articulationPath: challengeDecision.articulationPath,
            selfReview: reviewSelf
              ? {
                  reviewSelf,
                  index: reviewIndex,
                  total: selfReviews.length,
                }
              : undefined,
          }),
        },
      };
    }

    // record promise (all promises are hashless — firm checkpoints)
    await setStoneAsPromised({
      stone: stoneMatched,
      slug: input.that,
      route: input.route,
    });

    // get all promises after record (includes the one just made)
    const promisesAfter = await getStonePromises({
      stone: stoneMatched,
      route: input.route,
    });
    const promisedSlugs = getPromisedSlugsSet({ promises: promisesAfter });

    // compute progress: how many promised out of total
    const total = selfReviews.length;
    const promisedCount = computePromisedReviewCount({
      selfReviews,
      promisedSlugs,
    });

    // find next unpromised review (if any)
    const nextReview =
      findNextUnpromisedReview({ selfReviews, promisedSlugs }) ?? undefined;

    return {
      promised: true,
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'promised',
          slug: input.that,
          route: input.route,
          progress: { index: promisedCount, total },
          nextReview,
        }),
      },
    };
  }

  if (input.as === 'contemplated') {
    // validate --that is provided (which reviewer's critique this contemplates)
    if (!input.that)
      throw new BadRequestError('--that is required for --as contemplated', {
        stone: input.stone,
      });

    const result = await setStoneAsContemplated({
      stone: input.stone,
      route: input.route,
      slug: input.that,
    });
    return {
      contemplated: result.contemplated,
      emit: result.emit,
    };
  }

  if (input.as === 'blocked') {
    const result = await setStoneAsBlocked({
      stone: input.stone,
      route: input.route,
    });
    return {
      blocked: result.blocked,
      challenged: result.challenged,
      emit: result.emit,
    };
  }

  if (input.as === 'overruled') {
    const result = await setStoneAsOverruled(
      {
        stone: input.stone,
        route: input.route,
      },
      { isTTY: context.isTTY },
    );
    return {
      overruled: result.overruled,
      emit: result.emit,
    };
  }

  if (input.as === 'forced') {
    const result = await setStoneAsForced(
      {
        stone: input.stone,
        route: input.route,
      },
      { isTTY: context.isTTY },
    );
    return {
      forced: result.forced,
      emit: result.emit,
    };
  }

  throw new UnexpectedCodePathError('unsupported --as value', { as: input.as });
};
