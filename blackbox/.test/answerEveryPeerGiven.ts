import * as fs from 'fs/promises';
import * as path from 'path';

import { getRouteGuardReviewPeerPathMeta } from '../../src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerPathMeta';
import {
  getRouteGuardReviewPeerPathTaken,
  isRouteGuardReviewPeerGivenPath,
} from '../../src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerPathTaken';
import { invokeRouteSkill } from './invokeRouteSkill';

/**
 * .what = writes a .taken.by_self beside every .given.by_peer on a stone, then
 *         signals `--as contemplated --that <slug>` once per reviewer, exactly as
 *         a driver converses between two review rounds
 * .why = the entrance gate refuses a new review round while an articulation is
 *        owed, so any blackbox journey that drives more than one round must
 *        converse between them. without this the second arrival halts at the
 *        door — and that halt is CORRECT, since an edit alone can no longer buy
 *        re-entry (the wish's whole contract)
 *
 * .note = 🔴 this is the blackbox twin of
 *         `src/domain.operations/route/__test_assets__/answerEveryPeerGiven.ts`.
 *         they are deliberately NOT shared: that one writes files in-process
 *         against absolute paths from the production enumerator, while this one
 *         drives the real cli in a temp dir and must therefore go through
 *         `route.stone.set --as contemplated` so the passage ledger records the
 *         conversation the way a real driver's would.
 *
 * .note = 🔴 every read of the peer filename grammar here goes through the PRODUCTION
 *         transformers — `isRouteGuardReviewPeerGivenPath` to select,
 *         `getRouteGuardReviewPeerPathTaken` to derive the pair, and
 *         `getRouteGuardReviewPeerPathMeta` to read the slug. this file used to carry the
 *         `._.given.by_peer.` literal three times over, which made it a THIRD home for a
 *         grammar the repo had already centralized in this same change — so a rename of
 *         any segment could desync the blackbox pair silently while the src twin tracked
 *         it (r1 nitpick.1, i016; rule.require.single-source-of-truth-for-render).
 *
 * .note = to import pure transformers across the boundary is the extant pattern here, not a
 *         new one — the four `driver.route.*` suites already import
 *         `getSelfReviewArticulationPath` from src for exactly this reason. what stays
 *         unshared is the ASSET above, which drives the real cli; a path transform carries
 *         no such coupled state.
 */
export const answerEveryPeerGiven = async (input: {
  cwd: string;
  stone: string;
  route?: string;
  reply?: string;
}): Promise<string[]> => {
  const peerDir = path.join(input.cwd, '.reviews', 'peer');

  // an absent dir means no round has run yet, so no articulation is owed
  const entries = await fs.readdir(peerDir).catch(() => [] as string[]);

  const namesGiven = entries.filter(
    (name) =>
      name.startsWith(`${input.stone}._.`) &&
      isRouteGuardReviewPeerGivenPath({ pathGiven: name }),
  );

  const slugs: string[] = [];

  for (const nameGiven of namesGiven) {
    const nameTaken = getRouteGuardReviewPeerPathTaken({
      pathGiven: nameGiven,
    });

    await fs.writeFile(
      path.join(peerDir, nameTaken),
      input.reply ?? '[REPAIR] answered — the repair is in the artifact\n',
    );

    const { slug } = getRouteGuardReviewPeerPathMeta({ path: nameGiven });
    if (!slugs.includes(slug)) slugs.push(slug);
  }

  // signal one contemplation per reviewer, as a driver does
  for (const slug of slugs) {
    await invokeRouteSkill({
      skill: 'route.stone.set',
      args: {
        stone: input.stone,
        route: input.route ?? '.',
        as: 'contemplated',
        that: slug,
      },
      cwd: input.cwd,
    });
  }

  return slugs;
};
