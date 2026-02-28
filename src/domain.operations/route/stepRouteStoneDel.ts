import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';

import { formatRouteStoneEmit } from './formatRouteStoneEmit';
import { asStoneGlob, isStoneInGlob } from './stones/asStoneGlob';
import { delStone } from './stones/delStone';
import { getAllStoneArtifacts } from './stones/getAllStoneArtifacts';
import { getAllStones } from './stones/getAllStones';

/**
 * .what = orchestrates deletion of unused stones from a route
 * .why = enables route to be pruned without loss of history
 */
export const stepRouteStoneDel = async (input: {
  stones: string[];
  route: string;
  mode: 'plan' | 'apply';
}): Promise<{
  patterns: { glob: string; raw: string }[];
  deleted: string[];
  retained: string[];
  stones: {
    name: string;
    status: 'delete' | 'retain' | 'deleted' | 'retained';
    reason: string | null;
  }[];
  emit: { stdout: string } | null;
}> => {
  // validate at least one stone pattern provided
  if (input.stones.length === 0) {
    throw new BadRequestError('at least one --stone required', {});
  }

  // validate route dir found
  try {
    await fs.access(input.route);
  } catch {
    throw new BadRequestError('route not found', { route: input.route });
  }

  // collect patterns from all stone inputs
  const patterns = input.stones.map((s) => asStoneGlob({ pattern: s }));

  // gather all stones
  const allStones = await getAllStones({ route: input.route });

  // collect matched stone names via Set for deduplication
  const matchedNames = new Set<string>();
  for (const { glob } of patterns) {
    for (const stone of allStones) {
      if (isStoneInGlob({ name: stone.name, glob })) {
        matchedNames.add(stone.name);
      }
    }
  }

  // get Stone objects for matched names
  const stonesMatched = allStones.filter((s) => matchedNames.has(s.name));

  // handle no matches
  if (stonesMatched.length === 0) {
    return {
      patterns,
      deleted: [],
      retained: [],
      stones: [],
      emit: { stdout: 'no stones matched patterns' },
    };
  }

  // branch on mode
  if (input.mode === 'plan') {
    // classify each stone: check artifacts via getAllStoneArtifacts
    const stoneResults: {
      name: string;
      status: 'delete' | 'retain';
      reason: string | null;
    }[] = [];
    for (const stone of stonesMatched) {
      const artifacts = await getAllStoneArtifacts({
        stone,
        route: input.route,
      });
      if (artifacts.length > 0) {
        stoneResults.push({
          name: stone.name,
          status: 'retain',
          reason: 'artifact found',
        });
      } else {
        stoneResults.push({ name: stone.name, status: 'delete', reason: null });
      }
    }

    const countDelete = stoneResults.filter(
      (s) => s.status === 'delete',
    ).length;
    const countRetain = stoneResults.filter(
      (s) => s.status === 'retain',
    ).length;

    // format output via formatRouteStoneEmit
    const stdout = formatRouteStoneEmit({
      operation: 'route.stone.del',
      mode: 'plan',
      patterns,
      route: input.route,
      stones: stoneResults,
      countDelete,
      countRetain,
    });

    return {
      patterns,
      deleted: [],
      retained: stoneResults
        .filter((s) => s.status === 'retain')
        .map((s) => s.name),
      stones: stoneResults,
      emit: { stdout },
    };
  }

  // apply mode: attempt deletion for each matched stone
  const deleted: string[] = [];
  const retained: string[] = [];
  const stoneResults: {
    name: string;
    status: 'deleted' | 'retained';
    reason: string | null;
  }[] = [];

  for (const stone of stonesMatched) {
    try {
      await delStone({ stone, route: input.route });
      deleted.push(stone.name);
      stoneResults.push({ name: stone.name, status: 'deleted', reason: null });
    } catch (error) {
      // delStone throws BadRequestError if artifact found
      if (error instanceof BadRequestError) {
        retained.push(stone.name);
        stoneResults.push({
          name: stone.name,
          status: 'retained',
          reason: 'artifact found',
        });
      } else {
        throw error;
      }
    }
  }

  const countDelete = deleted.length;
  const countRetain = retained.length;

  // format output via formatRouteStoneEmit
  const stdout = formatRouteStoneEmit({
    operation: 'route.stone.del',
    mode: 'apply',
    patterns,
    route: input.route,
    stones: stoneResults,
    countDelete,
    countRetain,
  });

  return {
    patterns,
    deleted,
    retained,
    stones: stoneResults,
    emit: { stdout },
  };
};
