import { BadRequestError } from 'helpful-errors';

import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { getDecisionIsCallerHuman } from '../getDecisionIsCallerHuman';
import { setStoneGuardOverrule } from '../judges/setStoneGuardOverrule';
import { findOneStoneByPattern } from './asStoneGlob';
import { getAllStones } from './getAllStones';

/**
 * .what = marks a stone as overruled by human
 * .why = enables human to bypass review thresholds for overzealous reviewers
 */
export const setStoneAsOverruled = async (
  input: {
    stone: string;
    route: string;
  },
  context: {
    isTTY: boolean;
  },
): Promise<{
  overruled: boolean;
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
      overruled: false,
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'blocked',
          reason: 'only humans can overrule',
          guidance: [
            'as a driver, you should:',
            '   ├─ `--as passed` to signal work complete, proceed',
            '   ├─ `--as arrived` to signal work complete, request review',
            '   └─ `--as blocked` to escalate if stuck',
            '',
            'the human will run `--as overruled` when ready.',
          ].join('\n'),
        }),
      },
    };
  }

  // set overrule marker
  await setStoneGuardOverrule({ stone: stoneMatched, route: input.route });

  return {
    overruled: true,
    emit: {
      stdout: formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: stoneMatched.name,
        action: 'overruled',
      }),
    },
  };
};
