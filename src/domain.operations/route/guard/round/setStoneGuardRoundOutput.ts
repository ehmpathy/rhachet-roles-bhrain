import { ConstraintError } from 'helpful-errors';

import { asRouteStoneSetCommandHead } from '../review/peer/asRouteStoneSetCommandHead';
import { getOneStoneRewindGeneration } from './getOneStoneRewindGeneration';
import { withStoneGenerationHold } from './withStoneGenerationHold';

/**
 * .what = writes one output of a guard round — a given, a meter, a verdict, a passage —
 *         only if the stone's rewind generation still equals the one the round began at
 * .why = a rewind deletes the outputs a round writes. a round still aloft would write
 *        some lanes before the rewind and some after, so the stone would read lanes that
 *        "have not spoken" which the driver cannot answer. under the stone's hold, the
 *        write either precedes the rewind's bump (and the rewind then clears it) or
 *        follows it (and is discarded here). a superseded round never writes again
 *
 * .note = a discard throws, so the round ends at its first stale write with a message
 *         that names the rewind. the lanes a level poured at once settle first
 *         (runStoneGuardReviews), so no co-member write lands after the throw either
 * .note = the hold spans only the check and the write (withStoneGenerationHold)
 */
export const setStoneGuardRoundOutput = async <TOutput>(input: {
  route: string;
  stone: string;
  generation: number;
  write: () => Promise<TOutput>;
}): Promise<TOutput> =>
  withStoneGenerationHold({
    route: input.route,
    stone: input.stone,
    logic: async () => {
      // a rewind bumped the generation since the round began: discard the write
      const generationNow = await getOneStoneRewindGeneration({
        route: input.route,
        stone: input.stone,
      });
      if (generationNow !== input.generation)
        throw new ConstraintError(
          [
            `a rewind superseded this guard round of stone ${input.stone}; its output was discarded`,
            '',
            'the rewind cleared what the round had written, and the round wrote naught after it.',
            `re-run the round: ${asRouteStoneSetCommandHead({ stone: input.stone })} --as arrived`,
          ].join('\n'),
        );

      // the round is still current: write
      return input.write();
    },
  });
