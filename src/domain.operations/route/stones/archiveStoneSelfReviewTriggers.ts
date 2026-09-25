import { enumRouteFiles } from '@src/domain.operations/route/guard/artifact/enumRouteFiles';
import { asSelfReviewTriggeredGlob } from '@src/domain.operations/route/guard/review/self/getSelfReviewTriggeredPaths';

import { archiveRouteFiles } from './archiveRouteFiles';

/**
 * .what = archive every self-review trigger marker for a stone to .route/.archive/
 * .why = the trigger is invalidated by the REWIND, never by a hash
 *
 * .note = this is the replacement for what the hash key used to do implicitly. a new
 *         generation minted a new report, so a report was scoped to one generation by
 *         accident of its filename. drop the hash and that invalidation goes with it —
 *         so it is made explicit here, as a lifecycle event rather than a cache key.
 * .note = it ARCHIVES rather than deletes. the marker's mtime is the only record of when a
 *         review was asked for, and the freshness bar reads it; a rewound round that left no
 *         trace would make its own history unauditable.
 * .note = the markers are `.since` and `.uptil`, never `.md`. the extant cleanup globbed
 *         `…triggered.*.md` and matched zero of them, so a rewind cleared the promise and
 *         kept the clock — measured at 13 live markers on one route.
 * 🔴 .note = the glob is NOT typed here. it comes from `asSelfReviewTriggeredGlob`, beside the
 *            operation that builds the paths it must match, so the two cannot drift. the
 *            repair above fixed the glob's VALUE; this fixes the mechanism that let a
 *            hand-typed literal diverge from the real filenames in the first place.
 */
export const archiveStoneSelfReviewTriggers = async (input: {
  stone: string;
  route: string;
}): Promise<{ outcome: 'archived' | 'absent'; count: number }> => {
  // enumerate both marker kinds for this stone, across every slug
  const markers = await enumRouteFiles({
    route: input.route,
    glob: asSelfReviewTriggeredGlob({ stone: input.stone }),
  });
  // the move, and the collision shape it carries, are owned by archiveRouteFiles —
  // the same owner archiveStoneYield delegates to, so the two cannot drift apart
  return archiveRouteFiles({ route: input.route, files: markers });
};
