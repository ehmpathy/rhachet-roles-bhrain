import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

/**
 * .what = marks a stone as passed via passage marker file
 * .why = enables route progress to be persisted
 */
export const setStonePassage = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{ path: string }> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // write passage marker
  const passagePath = path.join(routeDir, `${input.stone.name}.passed`);
  await fs.writeFile(passagePath, '');

  return { path: passagePath };
};
