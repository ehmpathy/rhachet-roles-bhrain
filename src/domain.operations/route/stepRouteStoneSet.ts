import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import { getGuardSelfReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { formatRouteStoneEmit } from './formatRouteStoneEmit';
import { computeStoneReviewInputHash } from './guard/computeStoneReviewInputHash';
import { getStonePromises } from './promise/getStonePromises';
import { setStoneAsPromised } from './promise/setStoneAsPromised';
import { getAllStones } from './stones/getAllStones';
import { setStoneAsApproved } from './stones/setStoneAsApproved';
import { setStoneAsPassed } from './stones/setStoneAsPassed';

/**
 * .what = orchestrates set of stone status (passed, approved, or promised)
 * .why = enables robots and humans to mark milestones complete
 */
export const stepRouteStoneSet = async (
  input: {
    stone: string;
    route: string;
    as: 'passed' | 'approved' | 'promised';
    that?: string;
  },
  context: ContextCliEmit,
): Promise<{
  passed?: boolean;
  approved?: boolean;
  promised?: boolean;
  refs?: { reviews: string[]; judges: string[] };
  emit: { stdout: string } | null;
}> => {
  // dispatch to appropriate operation
  if (input.as === 'approved') {
    const result = await setStoneAsApproved({
      stone: input.stone,
      route: input.route,
    });
    return {
      approved: result.approved,
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
    const stoneMatched = stones.find((s) =>
      s.name.toLowerCase().includes(input.stone.toLowerCase()),
    );
    if (!stoneMatched) {
      throw new BadRequestError('stone not found', { stone: input.stone });
    }

    // validate slug exists in stone's self-reviews
    const selfReviews = stoneMatched.guard
      ? getGuardSelfReviews(stoneMatched.guard)
      : [];
    const validSlugs = selfReviews.map((r) => r.slug);
    if (validSlugs.length > 0 && !validSlugs.includes(input.that)) {
      throw new BadRequestError(
        `invalid self-review slug: "${input.that}". valid options: ${validSlugs.join(', ')}`,
        { stone: input.stone, slug: input.that, validSlugs },
      );
    }

    // compute hash for promise
    const hash = await computeStoneReviewInputHash({
      stone: stoneMatched,
      route: input.route,
    });

    // record promise
    await setStoneAsPromised({
      stone: stoneMatched,
      slug: input.that,
      hash,
      route: input.route,
    });

    // get all promises after record (includes the one just made)
    const promisesAfter = await getStonePromises({
      stone: stoneMatched,
      hash,
      route: input.route,
    });
    const promisedSlugs = new Set(promisesAfter.map((p) => p.slug));

    // compute progress: how many promised out of total
    const total = selfReviews.length;
    const promisedCount = selfReviews.filter((r) =>
      promisedSlugs.has(r.slug),
    ).length;

    // find next unpromised review (if any)
    const nextUnpromised = selfReviews.find((r) => !promisedSlugs.has(r.slug));
    const nextReview = nextUnpromised
      ? {
          reviewSelf: nextUnpromised,
          index: selfReviews.indexOf(nextUnpromised),
          total,
        }
      : undefined;

    return {
      promised: true,
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'promised',
          slug: input.that,
          progress: { index: promisedCount, total },
          nextReview,
        }),
      },
    };
  }

  throw new UnexpectedCodePathError('unsupported --as value', { as: input.as });
};
