import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { getDecisionIsCallerHuman } from '../getDecisionIsCallerHuman';
import { getStoneGuardLevelState } from '../guard/review/getStoneGuardLevelState';
import { getStoneGuardOverruleTarget } from '../guard/review/getStoneGuardOverruleTarget';
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

  // compute the level state to scope the overrule to the active level
  // .why = overrule applies only to the current active level, so higher levels
  //        still run after the human waves the stuck level through
  const levelState = await getStoneGuardLevelState({
    stone: stoneMatched,
    route: input.route,
  });

  // derive the overrule target via the shared single source — is there a level (or an
  // owed contemplation gate) left to forgive, and if so, which level?
  const { hasTarget, levelToOverrule } = await getStoneGuardOverruleTarget({
    stone: stoneMatched,
    route: input.route,
    levelState,
  });

  // short-circuit: no target means every level is already approved or overruled AND no
  // un-answered blocker remains — a fresh overrule would fall back to the terminal level
  // and mint a bogus "forgiven by human" record on a level that cleared on its own merit
  // (a false-provenance marker that flips a later passage label from `allowed` to
  // `overruled`). block it as a no-op the human should notice, not a silent success (an
  // idempotency + hidden-side-effect hazard).
  if (!hasTarget) {
    return {
      overruled: false,
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'blocked',
          reason:
            'no blocked level to overrule — every review level is already terminal',
          guidance: [
            'each peer-review level is approved or already overruled.',
            'there is no blocked level left to forgive.',
            '',
            'the stone is ready — run:',
            `   └─ rhx route.stone.set --stone ${stoneMatched.name} --as passed`,
          ].join('\n'),
        }),
      },
    };
  }

  // narrow: hasTarget guarantees a concrete level (a blocked active rung, or the lowest
  // owed contemplation level) — the pure target core never returns hasTarget with no level
  if (levelToOverrule === undefined) {
    throw new UnexpectedCodePathError(
      'overrule has a target but no level to forgive',
      { stone: stoneMatched.name, levelState },
    );
  }

  // set overrule marker scoped to the derived level
  // .note = the read-above → write-here pair needs no lock. setStoneGuardOverrule is an
  //         idempotent findsert (it re-reads the overruled levels and skips a level already
  //         forgiven, see setStoneGuardOverrule.ts:21-30); the passage log is append-only and
  //         read back as a Set, so a duplicate marker collapses; and both admin escapes are
  //         human-TTY-gated. the route model is single-driver over local files — no concurrent
  //         writer exists to race, and the idempotent write absorbs a re-drive either way
  //         (rule.require.fewer-paths-via-idempotency).
  await setStoneGuardOverrule({
    stone: stoneMatched,
    route: input.route,
    level: levelToOverrule,
  });

  return {
    overruled: true,
    emit: {
      stdout: formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: stoneMatched.name,
        action: 'overruled',
        level: levelToOverrule,
        readyLevel: levelState.nextActiveLevel,
      }),
    },
  };
};
