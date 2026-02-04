import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';

import { delStone } from './stones/delStone';
import { getAllStones } from './stones/getAllStones';

/**
 * .what = orchestrates deletion of unused stones from a route
 * .why = enables route to be pruned without loss of history
 */
export const stepRouteStoneDel = async (input: {
  stone: string;
  route: string;
}): Promise<{
  deleted: string[];
  skipped: string[];
  emit: { stdout: string } | null;
}> => {
  // validate route dir found
  try {
    await fs.access(input.route);
  } catch {
    throw new BadRequestError('route not found', { route: input.route });
  }

  // gather all stones
  const stones = await getAllStones({ route: input.route });

  // filter by glob pattern
  const pattern = input.stone;
  const stonesMatched = stones.filter((s) => matchGlob(s.name, pattern));

  if (stonesMatched.length === 0) {
    return {
      deleted: [],
      skipped: [],
      emit: { stdout: 'no stones matched pattern' },
    };
  }

  const deleted: string[] = [];
  const skipped: string[] = [];

  // attempt deletion for each matched stone
  for (const stone of stonesMatched) {
    try {
      await delStone({ stone, route: input.route });
      deleted.push(stone.name);
    } catch (error) {
      // delStone throws BadRequestError if artifact found
      if (error instanceof BadRequestError) {
        skipped.push(stone.name);
      } else {
        throw error;
      }
    }
  }

  // prepare emit output
  const lines: string[] = [];
  if (deleted.length > 0) {
    lines.push(`deleted: ${deleted.join(', ')}`);
  }
  if (skipped.length > 0) {
    lines.push(`skipped (artifact found): ${skipped.join(', ')}`);
  }

  return {
    deleted,
    skipped,
    emit: { stdout: lines.join('\n') },
  };
};

/**
 * .what = matches a stone name against a glob pattern
 * .why = enables filter of stones by glob
 */
const matchGlob = (name: string, pattern: string): boolean => {
  // convert glob pattern to regex
  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(name);
};
