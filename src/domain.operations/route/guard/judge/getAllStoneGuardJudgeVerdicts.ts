import type { ExitCodeClass } from '@src/domain.objects/Driver/ExitCodeClass';

import { enumRouteFiles } from '../artifact/enumRouteFiles';
import { getAllStoneGuardJudgeVerdictsFromFiles } from './getAllStoneGuardJudgeVerdictsFromFiles';

/**
 * .what = reads the persisted judge verdicts for a stone at a given review-input hash
 * .why = the level-state must know whether the judge rung holds, WITHOUT a re-run of the judge —
 *        overrule/force query it before the driver's next `--as passed`
 *
 * a production judge file carries two hashes:
 *   $stone.guard.judge.i$rp$j.$reviewHash.$judgeHash.j$index.md
 * so it is enumerated by the review hash with the judge hash left as a wildcard. only the
 * iteration and exit class are read here — the full artifact parse lives in
 * getAllStoneGuardArtifactsByHash and is not needed to decide a hold.
 */
export const getAllStoneGuardJudgeVerdicts = async (input: {
  stone: { name: string };
  route: string;
  hash: string;
}): Promise<{ iteration: number; exitClass: ExitCodeClass }[]> => {
  // enumerate judge files for this stone at this review hash (any judge hash)
  const files = await enumRouteFiles({
    route: input.route,
    glob: `.route/${input.stone.name}.guard.judge.*.${input.hash}.*.md`,
  });

  // read each file's iteration + exit class
  return getAllStoneGuardJudgeVerdictsFromFiles({ files });
};
