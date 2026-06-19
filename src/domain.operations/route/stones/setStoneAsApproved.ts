import { BadRequestError } from 'helpful-errors';

import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { getDecisionIsCallerHuman } from '../getDecisionIsCallerHuman';
import { getOneStoneGuardApproval } from '../judges/getOneStoneGuardApproval';
import { setStoneGuardApproval } from '../judges/setStoneGuardApproval';
import { findOneStoneByPattern } from './asStoneGlob';
import { formatGuidanceForAlreadyApproved } from './formatGuidanceForAlreadyApproved';
import { formatGuidanceForOnlyHumansCanApprove } from './formatGuidanceForOnlyHumansCanApprove';
import { getAllStones } from './getAllStones';

/**
 * .what = marks a stone as approved by human
 * .why = enables human approval gates for milestones
 */
export const setStoneAsApproved = async (
  input: {
    stone: string;
    route: string;
  },
  context: {
    isTTY: boolean;
  },
): Promise<{
  approved: boolean;
  emit: { stdout: string } | null;
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

  // check if already approved by human
  const approvalFound = await getOneStoneGuardApproval({
    stone: stoneMatched,
    route: input.route,
  });

  // check if caller is human
  const { isHuman } = getDecisionIsCallerHuman({ isTTY: context.isTTY });

  // human already approved -> idempotent success (no-op)
  if (isHuman && approvalFound) {
    return {
      approved: true,
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'approved',
        }),
      },
    };
  }

  // human not yet approved -> approve
  if (isHuman) {
    await setStoneGuardApproval({ stone: stoneMatched, route: input.route });
    return {
      approved: true,
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'approved',
        }),
      },
    };
  }

  // bot on already-approved stone -> guide to pass
  if (approvalFound) {
    return {
      approved: false,
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'blocked',
          reason: 'already approved',
          guidance: formatGuidanceForAlreadyApproved({
            stone: stoneMatched.name,
          }),
        }),
      },
    };
  }

  // not approved yet, tell bot only humans can approve
  return {
    approved: false,
    emit: {
      stdout: formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: stoneMatched.name,
        action: 'blocked',
        reason: 'only humans can approve',
        guidance: formatGuidanceForOnlyHumansCanApprove(),
      }),
    },
  };
};
