import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { setPassageReport } from '../../passage/setPassageReport';
import { withStoneGenerationHold } from './withStoneGenerationHold';

/**
 * .what = bumps a stone's rewind generation — appends its `rewound` passage row — under
 *         the stone's hold
 * .why = the bump is what supersedes a guard round aloft on the stone: every later write
 *        that round attempts sees a new generation and is discarded
 *        (setStoneGuardRoundOutput). so a rewind bumps BEFORE it deletes aught, and a
 *        round write can never land between the delete and the bump
 *
 * .note = the `rewound` row is the generation (getOneStoneRewindGeneration); it is also
 *         the row every passage read already treats as the rewind, so one append serves
 *         both
 */
export const setStoneRewindGeneration = async (input: {
  route: string;
  stone: string;
}): Promise<{ stone: string }> =>
  withStoneGenerationHold({
    route: input.route,
    stone: input.stone,
    logic: async () => {
      await setPassageReport({
        report: new PassageReport({ stone: input.stone, status: 'rewound' }),
        route: input.route,
      });
      return { stone: input.stone };
    },
  });
