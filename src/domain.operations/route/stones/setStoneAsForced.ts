import { BadRequestError } from 'helpful-errors';

import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { getDecisionIsCallerHuman } from '../getDecisionIsCallerHuman';
import { getStoneReviewLevelState } from '../guard/review/getStoneReviewLevelState';
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

  // compute level state to scope the force to the active level
  // .why = force overrules the active level, but only grants approval once the
  //        active level is the terminal level — approval of unseen levels is
  //        illogical (a later level may dramatically change the design)
  const levelState = await getStoneReviewLevelState({
    stone: stoneMatched,
    route: input.route,
  });

  // determine which level to overrule
  // .note = no peer reviews = legacy stone-wide overrule (level undefined)
  // .note = all levels resolved = fall back to the terminal level (harmless)
  const levelToOverrule = !levelState.hasLevels
    ? undefined
    : (levelState.activeLevel ?? levelState.terminalLevel ?? undefined);

  // grant approval only when at the terminal level
  // .why = withhold approval until the highest level has been reached
  // .note = no peer reviews, or all levels resolved, counts as "at terminal"
  const atTerminalLevel =
    !levelState.hasLevels ||
    levelState.activeLevel === null ||
    levelState.activeLevel === levelState.terminalLevel;

  // always overrule the active level
  await setStoneGuardOverrule({
    stone: stoneMatched,
    route: input.route,
    level: levelToOverrule,
  });

  // approve only when at the terminal level
  if (atTerminalLevel) {
    await setStoneGuardApproval({ stone: stoneMatched, route: input.route });
  }

  // build output details
  // .note = when approval is withheld, omit the approval line entirely — its
  //         absence is the signal (no "withheld" placeholder)
  const overruledLine =
    levelToOverrule !== undefined
      ? `overruled = ✓ (level ${levelToOverrule})`
      : `overruled = ✓`;
  const detailLines = atTerminalLevel
    ? [overruledLine, `approved  = ✓`]
    : [overruledLine];

  return {
    forced: true,
    emit: {
      stdout: formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: stoneMatched.name,
        action: 'forced',
        details: detailLines.join('\n'),
      }),
    },
  };
};
