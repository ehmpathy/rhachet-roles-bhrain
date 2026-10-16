import * as path from 'path';

import { getOneFileTextOrNull } from '@src/utils/fs/getOneFileTextOrNull';

/**
 * .what = tells whether a blocked stone has its articulation file on disk
 * .why = a `blocked` row may come from the driver (`--as blocked`, which writes
 *        `$route/blocker/$stone.md`) or from the guard (which writes no file). route.drive
 *        must cite the path only when the file is there, else it sends the reader to a path
 *        that names naught on disk (hazard.a-status-read-cannot-report-absence)
 */
export const isRouteStoneBlockerArticulated = async (input: {
  route: string;
  stone: string;
}): Promise<boolean> => {
  const text = await getOneFileTextOrNull({
    path: path.join(input.route, 'blocker', `${input.stone}.md`),
  });
  return text !== null;
};
