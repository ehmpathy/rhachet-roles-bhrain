import { BadRequestError } from 'helpful-errors';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { setPassageReport } from '../passage/setPassageReport';
import { findOneStoneByPattern } from './asStoneGlob';
import { compareStonePrefix } from './compareStonePrefix';
import { computeStoneOrderPrefix } from './computeStoneOrderPrefix';
import { delStoneGuardArtifacts } from './delStoneGuardArtifacts';
import { getAllStones } from './getAllStones';

/**
 * .what = rewinds a stone and all subsequent stones by clear validation state
 * .why = enables fresh evaluation after handoff completion or artifact fix
 */
export const setStoneAsRewound = async (
  input: {
    stone: string;
    route: string;
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

  // get stone order prefix for cascade comparison
  const matchedPrefix = computeStoneOrderPrefix({ stone: stoneMatched });

  // find all stones at or after the matched stone (cascade)
  const affectedStones = stones.filter((s) => {
    const prefix = computeStoneOrderPrefix({ stone: s });
    return compareStonePrefix({ a: prefix, b: matchedPrefix }) >= 0;
  });

  // sort affected stones by prefix order
  affectedStones.sort((a, b) => {
    const prefixA = computeStoneOrderPrefix({ stone: a });
    const prefixB = computeStoneOrderPrefix({ stone: b });
    return compareStonePrefix({ a: prefixA, b: prefixB });
  });

  // track deletion counts for each stone
  const deletionResults: Array<{
    stone: string;
    reviews: number;
    judges: number;
    promises: number;
    triggers: number;
  }> = [];

  // rewind each affected stone
  for (const stone of affectedStones) {
    // delete guard artifacts
    const deleted = await delStoneGuardArtifacts({
      stone: stone.name,
      route: input.route,
    });

    deletionResults.push({
      stone: stone.name,
      ...deleted,
    });

    // append passage report with status: 'rewound'
    const report = new PassageReport({
      stone: stone.name,
      status: 'rewound',
    });
    await setPassageReport({ report, route: input.route });
  }

  // format stdout
  const stdout = formatRouteStoneEmit({
    operation: 'route.stone.set',
    stone: stoneMatched.name,
    action: 'rewound',
    cascade: deletionResults.map((r) => ({
      stone: r.stone,
      deleted: `${r.reviews} reviews, ${r.judges} judges, ${r.promises} promises, ${r.triggers} triggers`,
      passage: 'rewound',
    })),
  });

  return {
    rewound: true,
    affectedStones: affectedStones.map((s) => s.name),
    emit: { stdout },
  };
};
