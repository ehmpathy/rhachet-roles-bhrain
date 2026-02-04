import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getAllStoneArtifacts } from './getAllStoneArtifacts';

/**
 * .what = deletes a stone and its guard file
 * .why = enables unused stones to be pruned from a route
 */
export const delStone = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<void> => {
  // guard: refuse to delete stones that have artifacts
  const artifacts = await getAllStoneArtifacts({
    stone: input.stone,
    route: input.route,
  });
  if (artifacts.length > 0) {
    throw new BadRequestError('cannot del; artifact found', {
      stone: input.stone.name,
      artifacts,
    });
  }

  // remove stone file
  await fs.rm(input.stone.path);

  // remove guard file if present
  if (input.stone.guard) {
    await fs.rm(input.stone.guard.path);
  }
};
