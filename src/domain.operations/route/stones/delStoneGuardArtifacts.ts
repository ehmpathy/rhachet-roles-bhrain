import {
  asPeerReviewOutputName,
  SEGMENTS_OF_PEER_REVIEWS_DIR,
} from '@src/domain.operations/asPeerReviewOutputName';
import { delAllRouteFiles } from '@src/domain.operations/route/guard/artifact/delAllRouteFiles';
import { enumRouteFiles } from '@src/domain.operations/route/guard/artifact/enumRouteFiles';
import { enumRouteGuardJudgeFiles } from '@src/domain.operations/route/guard/judge/enumRouteGuardJudgeFiles';
import { enumRouteGuardReviewPeerFiles } from '@src/domain.operations/route/guard/review/peer/enumRouteGuardReviewPeerFiles';
import { asStonePromiseGlob } from '@src/domain.operations/route/guard/review/self/getStonePromisePaths';

import { archiveStoneSelfReviewTriggers } from './archiveStoneSelfReviewTriggers';

/**
 * .what = deletes all guard artifacts for a stone
 * .why = enables rewind to clear validation state but preserve the artifact
 */
export const delStoneGuardArtifacts = async (input: {
  stone: string;
  route: string;
}): Promise<{
  reviews: number;
  judges: number;
  promises: number;
  /**
   * 🔴 .what = the trigger MARKERS, by kind — never by what they relate to.
   * .why = both keys were overloads of words this repo already spends elsewhere, and both
   *        appear beside their other sense in one rendered line. `promises` meant the
   *        self-review ASK markers while the neighbour `promises` above means promise
   *        ARTIFACTS, so `rewindAffectedStones` printed the word twice, three tokens apart,
   *        for two concepts. `blockers` meant the blocked-state marker while `blocker` means
   *        a review concern's severity everywhere else in this subsystem
   * .note = the tell was a disambiguation comment: `delStoneGuardArtifacts.test.ts` had to
   *         state in prose which sense `triggers.promises` carried. a name that needs that
   *         is the overload (rule.forbid.domain-term-ambiguity)
   */
  triggers: {
    /** the `$stone.blocked.triggered` marker — at most one per stone. DELETED */
    blocked: number;
    /** the `$stone.guard.selfreview.$slug.triggered.*` markers — M per stone. ARCHIVED */
    selfReviews: number;
  };
}> => {
  // collect review files from .reviews/peer/
  const reviewFiles = await enumRouteGuardReviewPeerFiles({
    route: input.route,
    stone: input.stone,
  });

  // collect each lane's `$targets` list from .reviews/peer/
  // .note = a `.txt` tail, so the `*.md` review enumerator never sees it — and no
  //         other lifecycle path does either, so without this glob a list piled up
  //         one per lane per round, forever. it is a derived input, never a review,
  //         so it is deleted and left out of the `reviews` count
  // .note = the glob is composed by the one grammar the guard writes by, with a
  //         wildcard per varied part, so a rename of the grammar moves this glob too
  const targetsFiles = await enumRouteFiles({
    route: input.route,
    glob: [
      ...SEGMENTS_OF_PEER_REVIEWS_DIR,
      asPeerReviewOutputName({
        parts: {
          stone: input.stone,
          iteration: '*',
          hash: '*',
          index: '*',
          slug: '*',
        },
        kind: 'targets',
      }),
    ].join('/'),
  });

  // collect judge files from .route/
  const judgeFiles = await enumRouteGuardJudgeFiles({
    route: input.route,
    stone: input.stone,
  });

  // collect promise files from .route/
  const promiseFiles = await enumRouteFiles({
    route: input.route,
    glob: asStonePromiseGlob({ stone: input.stone }),
  });

  // collect blocked trigger files from .route/
  const blockedTriggerFiles = await enumRouteFiles({
    route: input.route,
    glob: `.route/${input.stone}.blocked.triggered`,
  });

  // delete all found files
  await delAllRouteFiles({
    paths: [
      ...reviewFiles,
      ...targetsFiles,
      ...judgeFiles,
      ...promiseFiles,
      ...blockedTriggerFiles,
    ],
  });

  // archive the self-review triggers, rather than delete them.
  // .why = the trigger is invalidated by the REWIND, never by a hash — the key is now
  //        (stone, slug), so no new generation retires a report on its own. this is the
  //        explicit replacement for what the hash key used to do by accident.
  // .note = archived, never removed: the marker's mtime is the only record of when a review
  //         was asked for, and the freshness bar reads it
  const triggersArchived = await archiveStoneSelfReviewTriggers({
    stone: input.stone,
    route: input.route,
  });

  return {
    reviews: reviewFiles.length,
    judges: judgeFiles.length,
    promises: promiseFiles.length,
    triggers: {
      blocked: blockedTriggerFiles.length,
      selfReviews: triggersArchived.count,
    },
  };
};
