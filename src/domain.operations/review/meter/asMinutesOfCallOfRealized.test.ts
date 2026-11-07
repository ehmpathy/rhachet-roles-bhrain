import { getError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

import { asMinutesOfCallOfRealized } from './asMinutesOfCallOfRealized';

const DIR = '/r/run';

describe('asMinutesOfCallOfRealized', () => {
  given('[case1] a realized record that names its time', () => {
    when('[t0] the time is an iso duration, in either shape', () => {
      then('it reads the minutes', () => {
        expect(
          asMinutesOfCallOfRealized({
            realized: { time: { seconds: 90 } },
            dir: DIR,
          }),
        ).toEqual(1.5);
        expect(
          asMinutesOfCallOfRealized({ realized: { time: 'PT2M' }, dir: DIR }),
        ).toEqual(2);
      });
    });
  });

  given('[case2] a record with no time, or no record', () => {
    when('[t0] the time is read', () => {
      then('it reads null, never a guess', () => {
        expect(asMinutesOfCallOfRealized({ realized: {}, dir: DIR })).toEqual(
          null,
        );
        expect(asMinutesOfCallOfRealized({ realized: null, dir: DIR })).toEqual(
          null,
        );
      });
    });
  });

  given('[case3] a record whose time is torn', () => {
    when('[t0] the time is not a duration', () => {
      then(
        '🔴 it raises the artifact defect the meter isolates per run, never a plain error',
        async () => {
          const error = await getError(async () =>
            asMinutesOfCallOfRealized({
              realized: { time: 'soon' },
              dir: DIR,
            }),
          );
          expect(error).toBeInstanceOf(ReviewRunArtifactError);
          expect(error.message).toContain(DIR);
        },
      );
    });

    when('[t1] the time reads as no finite figure', () => {
      then('🔴 it raises the artifact defect, never a NaN gap', async () => {
        const error = await getError(async () =>
          asMinutesOfCallOfRealized({
            realized: { time: { seconds: Number.NaN } },
            dir: DIR,
          }),
        );
        expect(error).toBeInstanceOf(ReviewRunArtifactError);
      });
    });
  });
});
