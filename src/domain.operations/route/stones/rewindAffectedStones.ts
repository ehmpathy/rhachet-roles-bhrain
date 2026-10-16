import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { resetRouteStoneGuardReviewPeerMeters } from '../guard/review/peer/meter/resetRouteStoneGuardReviewPeerMeters';
import { archiveStoneYield } from './archiveStoneYield';
import { asClearedTriggerTotal } from './asClearedTriggerTotal';
import { delStoneGuardArtifacts } from './delStoneGuardArtifacts';
import { getStoneYieldGlob } from './getStoneYieldGlob';

/**
 * .what = applies the rewind's yield mode to one stone, and reports what became of its yield
 * .why = one early return per mode, so the rewind loop reads one named act rather than a
 *        `let` reassigned across an if/else (r009 nitpick.4, i013)
 */
const setStoneYieldOfRewind = async (input: {
  stone: string;
  route: string;
  yieldMode: 'keep' | 'drop';
}): Promise<'archived' | 'preserved' | 'absent'> => {
  // drop → archive the yield, and report what the archive found
  if (input.yieldMode === 'drop') {
    const yieldResult = await archiveStoneYield({
      stone: input.stone,
      route: input.route,
    });
    return yieldResult.outcome;
  }

  // keep → leave the yield in place; report whether any was there
  // 🔴 the SAME glob the 'drop' branch above reaches through `archiveStoneYield`, and it is
  //    the same operation rather than a twin literal. the two branches answer one question —
  //    which files are this stone's yield? — so a convention that moved in one and not the
  //    other would make `preserved` and `archived` disagree about their subject
  const yieldFiles = await enumFilesFromGlob({
    glob: getStoneYieldGlob({ stone: input.stone }),
    cwd: input.route,
  });
  return yieldFiles.length > 0 ? 'preserved' : 'absent';
};

/**
 * .what = rewinds each affected stone: clears its guard artifacts, meters, and yield
 * .why = extracts for-of loop to named operation for narrative flow
 *
 * .note = the `rewound` passage row is NOT written here. it is the stone's rewind
 *         generation, so the caller bumps it first, under the stone's hold, before this
 *         deletes aught (setStoneRewindGeneration)
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
  // .note = deliberate mutation, scoped to this call: the loop below rewinds each stone in
  //         order (a filesystem act per stone) and records it here; the array is born in this
  //         call and only the returned report escapes (rule.require.immutable-vars)
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
    const yieldOutcome = await setStoneYieldOfRewind({
      stone: stone.name,
      route: input.route,
      yieldMode: input.yieldMode,
    });

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
  }

  return { cascade: cascade };
};
