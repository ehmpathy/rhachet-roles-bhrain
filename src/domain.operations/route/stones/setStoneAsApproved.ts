import { BadRequestError } from 'helpful-errors';

import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { setStoneGuardApproval } from '../judges/setStoneGuardApproval';
import { findOneStoneByPattern } from './asStoneGlob';
import { getAllStones } from './getAllStones';

/**
 * .what = marks a stone as approved by human
 * .why = enables human approval gates for milestones
 */
export const setStoneAsApproved = async (input: {
  stone: string;
  route: string;
}): Promise<{
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

  // set approval marker
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
};
