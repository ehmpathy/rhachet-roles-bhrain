import { getError, given, then, when } from 'test-fns';

import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

import { asIsoPriceOfRunArtifact } from './asIsoPriceOfRunArtifact';

describe('asIsoPriceOfRunArtifact', () => {
  given('[case1] a recorded total that is a price', () => {
    when('[t0] it is cast', () => {
      then('it reads as the price', () => {
        expect(
          asIsoPriceOfRunArtifact({ dir: '/run', costTotal: 'USD 0.25' }),
        ).toEqual('USD 0.25');
      });
    });
  });

  given('[case2] 🔴 a recorded total that is no price', () => {
    when('[t0] it is cast', () => {
      then(
        'it names the artifact torn, so the meter grades only this run unknown',
        async () => {
          const error = await getError(async () =>
            asIsoPriceOfRunArtifact({ dir: '/run', costTotal: '$abc' }),
          );
          expect(error).toBeInstanceOf(ReviewRunArtifactError);
          expect((error as Error).message).toContain(
            'states a cost.total that is no price',
          );
        },
      );
    });
  });
});
