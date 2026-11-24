import * as path from 'path';

import { getRepoRootOrNull } from '../getRepoRootOrNull';

/**
 * .what = the dir a clone's RouteReminder handle anchors on — the git root of `from`, else `from`
 * .why = the handle is keyed on the clone alone, so every caller that names one clone must land
 *        on one dir: the drive sync (from its route), the cli (from its cwd or its route), the
 *        daemon (from its --repo-root). the git root is that common anchor in a real repo, since
 *        every route of a worktree sits under it
 *
 * .note = a path in no git repo anchors on itself. that keeps a hermetic test (a temp route in
 *         os.tmpdir) inside its own temp dir, never in the repo the test runs from
 */
export const getRouteReminderRepoRoot = async (input: {
  from: string;
}): Promise<string> =>
  (await getRepoRootOrNull({ from: input.from })) ?? path.resolve(input.from);
