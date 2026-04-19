import { BadRequestError } from 'helpful-errors';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';

import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { findOneStoneByPattern } from './asStoneGlob';
import { computeAffectedStonesForRewind } from './computeAffectedStonesForRewind';
import { getAllStones } from './getAllStones';
import { rewindAffectedStones } from './rewindAffectedStones';

/**
 * .what = rewinds a stone and all subsequent stones by clear validation state
 * .why = enables fresh evaluation after handoff completion or artifact fix
 */
export const setStoneAsRewound = async (
  input: {
    stone: string;
    route: string;
    yield?: 'keep' | 'drop';
  },
  _context: ContextCliEmit,
): Promise<{
  rewound: boolean;
  affectedStones: string[];
  emit: { stdout: string };
}> => {
  // find the stone by pattern
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findOneStoneByPattern({
    stones,
    pattern: input.stone,
  });

  // fail fast if stone not found
  if (!stoneMatched) {
    throw new BadRequestError('stone not found', { stone: input.stone });
  }

  // compute stones affected by this rewind (cascade)
  const affectedStones = computeAffectedStonesForRewind({
    stones,
    fromStone: stoneMatched,
  });

  // rewind each affected stone (delete artifacts, handle yield, set passage)
  const yieldMode = input.yield ?? 'keep';
  const { cascade } = await rewindAffectedStones({
    affectedStones,
    route: input.route,
    yieldMode,
  });

  // format stdout
  const stdout = formatRouteStoneEmit({
    operation: 'route.stone.set',
    stone: stoneMatched.name,
    action: 'rewound',
    cascade,
  });

  return {
    rewound: true,
    affectedStones: affectedStones.map((s) => s.name),
    emit: { stdout },
  };
};
