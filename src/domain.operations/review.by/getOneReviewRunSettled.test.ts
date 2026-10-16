import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, useThen, when } from 'test-fns';

import type { ReviewRun } from '../review/runOneReview';
import { asReviewVerdict } from './asReviewVerdict';
import { getOneReviewRunSettled } from './getOneReviewRunSettled';

const RUN_REJECTED: ReviewRun = {
  stdout: '1 blocker\n0 nitpicks',
  stderr: '',
  exitCode: 2,
  durationMs: 1000,
  blockers: 1,
  nitpicks: 0,
  tallier: 'deterministic',
  talliedBy: null,
  detected: true,
};

describe('getOneReviewRunSettled', () => {
  given('[case1] a rubric review that returns its run', () => {
    when('[t0] it is settled', () => {
      const run = useThen('it resolves', async () =>
        getOneReviewRunSettled({ operation: async () => RUN_REJECTED }),
      );

      then('the run passes through untouched', () => {
        expect(run).toEqual(RUN_REJECTED);
      });
    });
  });

  given(
    '[case2] a rubric review that throws a system fault before it returns',
    () => {
      when('[t0] it is settled', () => {
        const run = useThen('it resolves, never rejects', async () =>
          getOneReviewRunSettled({
            operation: async () => {
              throw Object.assign(new Error('spawn ENOENT'), {
                code: 'ENOENT',
              });
            },
          }),
        );

        then('🔴 the run is undetected, so it reads as a malfunction', () => {
          expect(run.detected).toEqual(false);
          expect(asReviewVerdict({ run }).outcome).toEqual('malfunctioned');
        });

        then('the malfunction names the fault that dropped it', () => {
          const verdict = asReviewVerdict({ run });
          expect(verdict.outcome).toEqual('malfunctioned');
          expect(verdict.reason).toContain('MalfunctionError');
          expect(verdict.reason).toContain('spawn ENOENT');
        });
      });
    },
  );

  given(
    '[case3] a rubric review that throws a HelpfulError before it returns',
    () => {
      when('[t0] it is settled', () => {
        const run = useThen('it resolves, never rejects', async () =>
          getOneReviewRunSettled({
            operation: async () => {
              throw new MalfunctionError('brain call failed');
            },
          }),
        );

        then('the run reads as a malfunction that names the fault', () => {
          const verdict = asReviewVerdict({ run });
          expect(verdict.outcome).toEqual('malfunctioned');
          expect(verdict.reason).toContain('brain call failed');
        });
      });
    },
  );

  given('[case4] a rubric review that throws a defect of our own code', () => {
    when('[t0] it is settled', () => {
      then(
        '🔴 the defect rethrows as itself, never graded a reviewer malfunction',
        async () => {
          const error = await getError(
            getOneReviewRunSettled({
              operation: async () => {
                throw new TypeError('cannot read properties of undefined');
              },
            }),
          );
          expect(error).toBeInstanceOf(TypeError);
          expect(error.message).toContain('cannot read properties');
        },
      );
    });
  });
});
