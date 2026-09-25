import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { resetRouteStoneGuardReviewPeerMeters } from '../guard/review/peer/meter/resetRouteStoneGuardReviewPeerMeters';
import { setPassageReport } from '../passage/setPassageReport';
import { archiveStoneYield } from './archiveStoneYield';
import { asClearedTriggerTotal } from './asClearedTriggerTotal';
import { delStoneGuardArtifacts } from './delStoneGuardArtifacts';
import { getStoneYieldGlob } from './getStoneYieldGlob';

/**
 * .what = rewinds each affected stone by clear guard artifacts and set passage
 * .why = extracts for-of loop to named operation for narrative flow
 */
export const rewindAffectedStones = async (input: {
  affectedStones: RouteStone[];
  route: string;
  yieldMode: 'keep' | 'drop';
}): Promise<{
  cascade: Array<{
    stone: string;
    /**
     * 🔴 .what = what the rewind CLEARED — never what it deleted.
     * .why = the triggers are ARCHIVED rather than removed (`archiveStoneSelfReviewTriggers`),
     *        so a field named `deleted` reported an archive as a deletion. one word, and it
     *        told a route author their ask was gone when it sat under `.archive/`
     */
    cleared: string;
    yield: 'archived' | 'preserved' | 'absent';
    passage: 'rewound';
  }>;
}> => {
  const cascade: Array<{
    stone: string;
    cleared: string;
    yield: 'archived' | 'preserved' | 'absent';
    passage: 'rewound';
  }> = [];

  for (const stone of input.affectedStones) {
    // clear guard artifacts — reviews and judges are removed, triggers are ARCHIVED
    const cleared = await delStoneGuardArtifacts({
      stone: stone.name,
      route: input.route,
    });

    // reset peer review meters to 0 rounds (fresh budget)
    await resetRouteStoneGuardReviewPeerMeters({
      stone: stone.name,
      route: input.route,
    });

    // handle yield based on mode
    let yieldOutcome: 'archived' | 'preserved' | 'absent';
    if (input.yieldMode === 'drop') {
      const yieldResult = await archiveStoneYield({
        stone: stone.name,
        route: input.route,
      });
      yieldOutcome = yieldResult.outcome;
    } else {
      // 🔴 the SAME glob the 'drop' branch above reaches through `archiveStoneYield`, and it is
      //    the same operation rather than a twin literal. the two branches answer one question —
      //    which files are this stone's yield? — so a convention that moved in one and not the
      //    other would make `preserved` and `archived` disagree about their subject
      const yieldGlob = getStoneYieldGlob({ stone: stone.name });
      const yieldFiles = await enumFilesFromGlob({
        glob: yieldGlob,
        cwd: input.route,
      });
      yieldOutcome = yieldFiles.length > 0 ? 'preserved' : 'absent';
    }

    // build cascade item with all info together
    cascade.push({
      stone: stone.name,
      // .note = the keys name the MARKER kind, so this line no longer renders "promises" twice,
      //         three tokens apart, for two concepts. why the two trigger kinds sum into one
      //         number, and why `cleared` is the honest verb for both, lives in
      //         `asClearedTriggerTotal`
      cleared: `${cleared.reviews} reviews, ${cleared.judges} judges, ${cleared.promises} promises, ${asClearedTriggerTotal(cleared.triggers)} triggers`,
      yield: yieldOutcome,
      passage: 'rewound',
    });

    // append passage report with status: 'rewound'
    const report = new PassageReport({
      stone: stone.name,
      status: 'rewound',
    });
    await setPassageReport({ report, route: input.route });
  }

  return { cascade: cascade };
};
