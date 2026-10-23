import { getError, given, then, useThen, when } from 'test-fns';

import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

import { asReviewRunMeterOfDefectOrRethrow } from './asReviewRunMeterOfDefectOrRethrow';

const DIR = '/repo/.log/bhrain/review/2026-09-26T00-00-00-000Z.pid1.aaa';

describe('asReviewRunMeterOfDefectOrRethrow', () => {
  given('[case1] an error the meter raised over a corrupt artifact', () => {
    when('[t0] it is cast', () => {
      const run = useThen('it answers', async () =>
        asReviewRunMeterOfDefectOrRethrow({
          dir: DIR,
          error: new ReviewRunArtifactError(
            'review log artifact is present but unparseable',
          ),
        }),
      );

      then('it becomes an `unknown` row that names its defect', () => {
        expect(run.dir).toEqual(DIR);
        expect(run.grade).toEqual('unknown');
        expect(run.cost).toEqual(null);
        expect(run.defect).toContain('unparseable');
      });
    });
  });

  given('[case2] a defect in the meter code itself', () => {
    when('[t0] it is cast', () => {
      const result = useThen('it rejects', async () => {
        const error = await getError(async () =>
          asReviewRunMeterOfDefectOrRethrow({
            dir: DIR,
            error: new TypeError('cannot read properties of undefined'),
          }),
        );
        return { isTypeError: error instanceof TypeError };
      });

      then(
        '🔴 it rethrows as itself — never one plausible `unknown` row',
        () => {
          expect(result.isTypeError).toEqual(true);
        },
      );
    });
  });
});
