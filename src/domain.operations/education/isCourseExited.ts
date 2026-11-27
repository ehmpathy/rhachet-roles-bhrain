import { getAllLatestPassageByStone } from '@src/domain.operations/route/passage/getAllLatestPassageByStone';

import { STONE_OF_EXIT } from './STONE_OF_EXIT';

/**
 * .what = whether a course has exited: `6.exit`'s latest passage is `passed`
 * .why = only `course exit` appends that passage. a hand `route.stone.set --as passed` runs
 *        the `exited` judge before it appends, and the judge reads this same fact, so a hand
 *        pass is refused. a yield is a file any hand can write, so it is never the proof
 */
export const isCourseExited = async (input: {
  route: string;
}): Promise<boolean> => {
  const latest = await getAllLatestPassageByStone({ route: input.route });
  return latest.some(
    (report) => report.stone === STONE_OF_EXIT && report.status === 'passed',
  );
};
