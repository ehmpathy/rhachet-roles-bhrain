import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { computeNextStones } from './stones/computeNextStones';
import { getAllStoneDriveArtifacts } from './stones/getAllStoneDriveArtifacts';
import { getAllStones } from './stones/getAllStones';

/**
 * .what = orchestrates get of next stone(s) from a route
 * .why = enables robots to discover what milestone to work on next
 */
export const stepRouteStoneGet = async (input: {
  stone: '@next-one' | '@next-all' | string;
  route: string;
  say?: boolean;
}): Promise<{
  stones: RouteStone[];
  emit: { stdout: string } | null;
}> => {
  // validate route dir found
  try {
    await fs.access(input.route);
  } catch {
    throw new BadRequestError('route not found', { route: input.route });
  }

  // gather all stones and their artifacts
  const stones = await getAllStones({ route: input.route });
  const artifacts = await getAllStoneDriveArtifacts({ route: input.route });

  // determine which stones to return
  let stonesResult: RouteStone[];
  if (input.stone === '@next-one' || input.stone === '@next-all') {
    stonesResult = computeNextStones({
      stones,
      artifacts,
      query: input.stone,
    });
  } else {
    // filter by glob pattern
    const pattern = input.stone;
    stonesResult = stones.filter((stone) => matchGlob(stone.name, pattern));
  }

  // prepare emit output
  let emit: { stdout: string } | null = null;

  if (stonesResult.length === 0) {
    emit = { stdout: 'all stones passed' };
  } else if (input.say) {
    // read stone file content(s) and emit
    const contents: string[] = [];
    for (const stone of stonesResult) {
      const content = await fs.readFile(stone.path, 'utf-8');
      contents.push(`# ${stone.name}\n\n${content}`);
    }
    emit = { stdout: contents.join('\n\n---\n\n') };
  }

  return { stones: stonesResult, emit };
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
