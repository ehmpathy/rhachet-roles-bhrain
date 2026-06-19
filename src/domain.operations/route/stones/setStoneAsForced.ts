import { BadRequestError } from 'helpful-errors';

import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { getDecisionIsCallerHuman } from '../getDecisionIsCallerHuman';
import { setStoneGuardApproval } from '../judges/setStoneGuardApproval';
import { setStoneGuardOverrule } from '../judges/setStoneGuardOverrule';
import { findOneStoneByPattern } from './asStoneGlob';
import { getAllStones } from './getAllStones';

/**
 * .what = marks a stone as forced by human (approved + overruled)
 * .why = enables human to bypass both approval and review gates at once
 */
export const setStoneAsForced = async (
  input: {
    stone: string;
    route: string;
  },
  context: {
    isTTY: boolean;
  },
): Promise<{
  forced: boolean;
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
      forced: false,
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'blocked',
          reason: 'only humans can force',
          guidance: [
            'as a driver, you should:',
            '   ├─ `--as passed` to signal work complete, proceed',
            '   ├─ `--as arrived` to signal work complete, request review',
            '   └─ `--as blocked` to escalate if stuck',
            '',
            'the human will run `--as forced` when ready.',
          ].join('\n'),
        }),
      },
    };
  }

  // set both approval and overrule markers (composites approved + overruled)
  await setStoneGuardApproval({ stone: stoneMatched, route: input.route });
  await setStoneGuardOverrule({ stone: stoneMatched, route: input.route });

  return {
    forced: true,
    emit: {
      stdout: formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: stoneMatched.name,
        action: 'forced',
        details: ['approved = ✓', 'overruled = ✓'].join('\n'),
      }),
    },
  };
};
