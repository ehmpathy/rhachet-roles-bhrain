import { BadRequestError } from 'helpful-errors';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getAllStones } from './getAllStones';
import { setStoneGuardApproval } from './guard/setStoneGuardApproval';

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
  const stoneMatched = findStoneByGlob(stones, input.stone);
  if (!stoneMatched) {
    throw new BadRequestError('stone not found', { stone: input.stone });
  }

  // set approval marker
  await setStoneGuardApproval({ stone: stoneMatched, route: input.route });

  return {
    approved: true,
    emit: { stdout: `stone ${stoneMatched.name} approved` },
  };
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
