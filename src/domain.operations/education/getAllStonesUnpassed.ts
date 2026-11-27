import { getAllLatestPassageByStone } from '@src/domain.operations/route/passage/getAllLatestPassageByStone';
import { getAllStones } from '@src/domain.operations/route/stones/getAllStones';

import { asSlugsWithout } from './asSlugsWithout';

/**
 * .what = the names of every stone whose latest passage is `passed`
 * .why = only `passed` is passage (define.passage-statuses); `approved` or `arrived` is not
 */
const getAllStoneNamesPassed = async (input: {
  route: string;
}): Promise<string[]> =>
  (await getAllLatestPassageByStone({ route: input.route }))
    .filter((report) => report.status === 'passed')
    .map((report) => report.stone);

/**
 * .what = the stones of a route whose latest passage is not `passed`, in route order
 * .why = a course exits only once every stone before `6.exit` has passed
 * .note = the stones come from `getAllStones`, the one enumeration `route.drive` reads, so a
 *         `.src` stone or a sort quirk can never part this check from the drive
 */
export const getAllStonesUnpassed = async (input: {
  route: string;
  stonesOmitted: string[];
}): Promise<string[]> => {
  const stones = (await getAllStones({ route: input.route })).map(
    (stone) => stone.name,
  );
  return asSlugsWithout({
    slugs: stones,
    without: [
      ...input.stonesOmitted,
      ...(await getAllStoneNamesPassed({ route: input.route })),
    ],
  });
};
