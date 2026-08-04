import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { getDecisionIsCallerHuman } from '../getDecisionIsCallerHuman';
import { getStoneGuardLevelState } from '../guard/review/getStoneGuardLevelState';
import { getStoneGuardOverruleTarget } from '../guard/review/getStoneGuardOverruleTarget';
import { asRungLabel } from '../guard/review/peer/meter/asRungLabel';
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
  const levelState = await getStoneGuardLevelState({
    stone: stoneMatched,
    route: input.route,
  });

  // derive the overrule target via the shared single source — force overrules a blocked
  // active level OR an owed contemplation gate (an un-overruled in-tolerance blocker that
  // awaits a .taken, design-note B6); a merit-clear stone has no target, so force skips the
  // overrule and grants only its approval below (the false-provenance guard).
  const { hasTarget, levelToOverrule } = await getStoneGuardOverruleTarget({
    stone: stoneMatched,
    route: input.route,
    levelState,
  });
  const shouldOverrule = hasTarget;

  // grant approval only when at the terminal level
  // .why = withhold approval until the highest level has been reached
  // .note = no peer reviews, or all levels resolved, counts as "at terminal"
  const atTerminalLevel =
    !levelState.hasLevels ||
    levelState.activeLevel === null ||
    levelState.activeLevel === levelState.terminalLevel;

  // overrule the active level — but only when a level genuinely blocks (the
  // shouldOverrule guard skips the spurious overrule of an already-clear stone)
  // .note = the read-above → write-here pair needs no lock. setStoneGuardOverrule is an
  //         idempotent findsert (it re-reads the overruled levels and skips a level already
  //         forgiven, see setStoneGuardOverrule.ts:21-30); the passage log is append-only and
  //         read back as a Set, so a duplicate marker collapses; and both admin escapes are
  //         human-TTY-gated. the route model is single-driver over local files — no concurrent
  //         writer exists to race, and the idempotent write absorbs a re-drive either way
  //         (rule.require.fewer-paths-via-idempotency).
  if (shouldOverrule) {
    // narrow: shouldOverrule (hasTarget) guarantees a concrete level to forgive
    if (levelToOverrule === undefined) {
      throw new UnexpectedCodePathError(
        'force has an overrule target but no level to forgive',
        { stone: stoneMatched.name, levelState },
      );
    }
    await setStoneGuardOverrule({
      stone: stoneMatched,
      route: input.route,
      level: levelToOverrule,
    });
  }

  // approve only when at the terminal level
  if (atTerminalLevel) {
    await setStoneGuardApproval({ stone: stoneMatched, route: input.route });
  }

  // build output details
  // .note = the overrule line appears only when an overrule actually happened; the
  //         approval line only when approval was granted. an omitted line's absence is
  //         the signal (no "withheld" placeholder).
  // render the forgiven rung via asRungLabel so a judge-rung force reads "(judge)" — never the
  // raw JUDGE_LEVEL sentinel. the same transformer serves the overrule confirmation, so a force
  // and an overrule name the judge rung identically (rule.require.single-source-of-truth-for-render).
  const overruledLine =
    levelToOverrule !== undefined
      ? `overruled = ✓ (${asRungLabel(levelToOverrule)})`
      : `overruled = ✓`;
  const detailLines = [
    ...(shouldOverrule ? [overruledLine] : []),
    ...(atTerminalLevel ? [`approved  = ✓`] : []),
  ];

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
