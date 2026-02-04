import { glob } from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { parseStoneGuard } from '../guard/parseStoneGuard';

/**
 * .what = enumerates all stones in a route directory
 * .why = enables route navigation via stone discovery
 */
export const getAllStones = async (input: {
  route: string;
}): Promise<RouteStone[]> => {
  // glob for all stone files: *.stone, *.src.stone, *.src
  const stoneFiles = await glob(['*.stone', '*.src.stone', '*.src'], {
    cwd: input.route,
    absolute: false,
  });

  // process each stone file
  const stones: RouteStone[] = [];
  for (const stoneFile of stoneFiles) {
    // extract stone name (strips extension)
    const stoneName = extractStoneName({ filename: stoneFile });

    // check for guard files
    const guardPath = await findGuardPath({
      route: input.route,
      stoneName,
    });

    // parse guard if found
    const guard = guardPath
      ? await parseStoneGuard({ path: path.join(input.route, guardPath) })
      : null;

    stones.push(
      new RouteStone({
        name: stoneName,
        path: path.join(input.route, stoneFile),
        guard,
      }),
    );
  }

  // sort alphanumerically by name
  return stones.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * .what = extracts stone name from filename
 * .why = removes extension variants to get base name
 */
const extractStoneName = (input: { filename: string }): string => {
  // order matters: longer extensions first
  const extensions = ['.src.stone', '.stone', '.src'];
  for (const ext of extensions) {
    if (input.filename.endsWith(ext)) {
      return input.filename.slice(0, -ext.length);
    }
  }
  return input.filename;
};

/**
 * .what = finds guard file path for a stone
 * .why = checks all guard extension variants
 */
const findGuardPath = async (input: {
  route: string;
  stoneName: string;
}): Promise<string | null> => {
  // check guard extension variants in order
  const guardVariants = [
    `${input.stoneName}.guard`,
    `${input.stoneName}.src.guard`,
    `${input.stoneName}.stone.guard`,
  ];

  for (const guardFile of guardVariants) {
    const fullPath = path.join(input.route, guardFile);
    if (fs.existsSync(fullPath)) {
      return guardFile;
    }
  }

  return null;
};
