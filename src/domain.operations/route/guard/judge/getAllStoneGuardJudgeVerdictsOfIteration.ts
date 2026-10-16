import * as path from 'path';

import { compareStrings } from '@src/utils/compareStrings';

import { asGuardJudgeVerdictMarks } from '../../judges/asGuardJudgeVerdictMarks';
import { getOneJudgeArtifactContent } from '../../judges/getOneJudgeArtifactContent';
import { asGuardArtifactIteration } from '../artifact/asGuardArtifactIteration';
import { asGuardJudgeIndex } from '../artifact/asGuardJudgeIndex';
import { enumRouteFiles } from '../artifact/enumRouteFiles';

/**
 * .what = the judge verdicts a stone recorded for one review iteration — one per judge index,
 *         the latest pass of each
 * .why = a summary of a past round (route.drive's latest-round block) must name what the judge
 *        ruled on that round. the judge files carry the review iteration they judged (`iNNNpM`),
 *        so the round is found by that marker, across every hash
 *
 * .note = within one index, the latest pass wins by a total order over the path, so the pick
 *         is free of glob order (rule.forbid.order-dependence). the path order reads `p10`
 *         before `p9`; ten judge passes over one review iteration is not a shape a round takes
 *
 * .note = a file that vanished since enumeration is skipped, never a fault — a rewind may
 *         delete it in that window (getOneJudgeArtifactContent)
 */
export const getAllStoneGuardJudgeVerdictsOfIteration = async (input: {
  stone: { name: string };
  route: string;
  iteration: number;
}): Promise<
  { index: number; passed: boolean | null; reason: string | null }[]
> => {
  // every judge file of this stone, any hash
  const files = await enumRouteFiles({
    route: input.route,
    glob: `.route/${input.stone.name}.guard.judge.*.md`,
  });

  // keep the files of this iteration, latest pass per judge index
  const latestByIndex = asLatestJudgeFilePerIndex({
    files,
    iteration: input.iteration,
  });

  // read each one's marks
  const verdicts = await Promise.all(
    latestByIndex.map(async (entry) => {
      const content = await getOneJudgeArtifactContent({ path: entry.path });
      if (content === null) return null;
      return { index: entry.index, ...asGuardJudgeVerdictMarks({ content }) };
    }),
  );
  return verdicts.filter(
    (verdict): verdict is NonNullable<typeof verdict> => verdict !== null,
  );
};

/**
 * .what = of the judge files, those of one iteration, the latest per index, sorted by index
 * .why = names the pick, so the reader above reads as enumerate → pick → read
 */
const asLatestJudgeFilePerIndex = (input: {
  files: string[];
  iteration: number;
}): { index: number; path: string }[] => {
  // the files of this iteration, each with its index
  const candidates = input.files
    .map((file) => {
      const filename = path.basename(file);
      return {
        iteration: asGuardArtifactIteration({ filename }),
        index: asGuardJudgeIndex({ filename }),
        path: file,
      };
    })
    .filter(
      (entry): entry is { iteration: number; index: number; path: string } =>
        entry.iteration === input.iteration && entry.index !== null,
    );

  // the latest per index: sort by path, then the last write per index wins
  const sorted = [...candidates].sort((a, b) => compareStrings(a.path, b.path));
  const byIndex = new Map(sorted.map((entry) => [entry.index, entry]));
  return [...byIndex.values()]
    .sort((a, b) => a.index - b.index)
    .map((entry) => ({ index: entry.index, path: entry.path }));
};
