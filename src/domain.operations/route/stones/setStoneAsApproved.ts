import { BadRequestError } from 'helpful-errors';

import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { getDecisionIsCallerHuman } from '../getDecisionIsCallerHuman';
import { setStoneGuardApproval } from '../judges/setStoneGuardApproval';
import { findOneStoneByPattern } from './asStoneGlob';
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

  // check if caller is human
  const { isHuman } = getDecisionIsCallerHuman({ isTTY: context.isTTY });
  if (!isHuman) {
    return {
      approved: false,
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'blocked',
          reason: 'only humans can approve',
          guidance: [
            'as a driver, you should:',
            '   ├─ `--as passed` to signal work complete, proceed',
            '   ├─ `--as arrived` to signal work complete, request review',
            '   └─ `--as blocked` to escalate if stuck',
            '',
            'the human will run `--as approved` when ready.',
          ].join('\n'),
        }),
      },
    };
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
