import * as path from 'path';

import { setOneFileAtomic } from '@src/infra/fs/setOneFileAtomic';

import type { RouteInflight } from './RouteInflight';

/**
 * .what = writes the repairs-in-flight watermark to `$route/.route/inflight.json`
 * .why = a driver who delegates a round's repairs records that wait, so the stop hook
 *        reads it as honest work in flight rather than a refusal
 *
 * .note = one whole-file write, an upsert: a second mark replaces the first. no lock is
 *         owed — there is no read-check-write (rule.require.locks-via-with-simple-mutex)
 * .note = `since` rides the file's mtime, never the json body, so the route persistence
 *         holds no time-precision field (rule.forbid.timestamps-in-route-artifacts)
 * .note = 🔴 the body and its mtime land in ONE step, via `setOneFileAtomic`: a draft, then
 *         a rename onto `inflight.json`. so the stop hook's reader (`getRouteInflight`,
 *         another process) sees the prior watermark or the new one whole — never a truncated
 *         body that fails its parse, and never a new body with the prior mtime
 */
export const setRouteInflight = async (input: {
  route: string;
  inflight: RouteInflight;
}): Promise<{ inflight: RouteInflight }> => {
  // write what is in flight, for which stone, with `since` as the file's mtime
  await setOneFileAtomic({
    path: path.join(input.route, '.route', 'inflight.json'),
    content: JSON.stringify(
      { stone: input.inflight.stone, what: input.inflight.what },
      null,
      2,
    ),
    mtime: input.inflight.since,
  });
  return { inflight: input.inflight };
};
