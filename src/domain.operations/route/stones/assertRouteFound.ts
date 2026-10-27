import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = asserts a route path exists, with the fix when it does not
 * .why = the stone ops refuse an absent route before any work; only absence reads as not
 *        found, so a permission or i/o fault surfaces as itself
 */
export const assertRouteFound = async (input: {
  route: string;
}): Promise<void> => {
  await fs.access(input.route).catch((error: unknown) => {
    if (!isErrorOfAbsence({ error })) throw error;
    throw new BadRequestError(
      `route not found: ${input.route}; check --route, or run rhx route.bind.get`,
      { route: input.route },
    );
  });
};
