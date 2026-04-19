import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { setPassageReport } from '../passage/setPassageReport';
import { archiveStoneYield } from './archiveStoneYield';
import { delStoneGuardArtifacts } from './delStoneGuardArtifacts';

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
    deleted: string;
    yield: 'archived' | 'preserved' | 'absent';
    passage: 'rewound';
  }>;
}> => {
  const cascade: Array<{
    stone: string;
    deleted: string;
    yield: 'archived' | 'preserved' | 'absent';
    passage: 'rewound';
  }> = [];

  for (const stone of input.affectedStones) {
    // delete guard artifacts
    const deleted = await delStoneGuardArtifacts({
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
      // check if any yield files exist (via same glob as archiveStoneYield)
      const yieldGlob = `${stone.name}.yield*`;
      const yieldFiles = await enumFilesFromGlob({
        glob: yieldGlob,
        cwd: input.route,
      });
      yieldOutcome = yieldFiles.length > 0 ? 'preserved' : 'absent';
    }

    // build cascade item with all info together
    cascade.push({
      stone: stone.name,
      deleted: `${deleted.reviews} reviews, ${deleted.judges} judges, ${deleted.promises} promises, ${deleted.triggers.promises + deleted.triggers.blockers} triggers`,
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
