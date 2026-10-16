import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = clears the repairs-in-flight watermark
 * .why = a stone that moves (arrived, passed, blocked) ends the round the watermark
 *        described, so the watermark must not outlive it
 *
 * .note = idempotent: an absent watermark is a no-op
 */
export const delRouteInflight = async (input: {
  route: string;
}): Promise<void> => {
  await fs.rm(path.join(input.route, '.route', 'inflight.json'), {
    force: true,
  });
};
