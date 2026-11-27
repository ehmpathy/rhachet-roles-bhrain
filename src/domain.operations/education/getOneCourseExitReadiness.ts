import { getAllStonesUnpassed } from './getAllStonesUnpassed';
import { STONE_OF_EXIT } from './STONE_OF_EXIT';

/**
 * .what = whether a course may exit: every stone before `6.exit` passed
 * .why = one rule for the verb that exits and the judge that guards the exit stone, so the two
 *        never word the same gap two ways
 */
export const getOneCourseExitReadiness = async (input: {
  route: string;
}): Promise<{ ready: boolean; reason: string; stonesUnpassed: string[] }> => {
  const stonesUnpassed = await getAllStonesUnpassed({
    route: input.route,
    stonesOmitted: [STONE_OF_EXIT],
  });
  if (stonesUnpassed.length > 0)
    return {
      ready: false,
      reason: `stones not yet passed: ${stonesUnpassed.join(', ')}; run: rhx route.drive`,
      stonesUnpassed,
    };
  return {
    ready: true,
    reason: 'every stone before the exit passed',
    stonesUnpassed,
  };
};
