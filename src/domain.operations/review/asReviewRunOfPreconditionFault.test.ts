import { given, then, when } from 'test-fns';

import { asReviewRunOfPreconditionFault } from '@src/domain.operations/review/asReviewRunOfPreconditionFault';
import { asReviewVerdict } from '@src/domain.operations/review.by/asReviewVerdict';
import { asExitCodeClass } from '@src/domain.operations/route/guard/asExitCodeClass';

describe('asReviewRunOfPreconditionFault', () => {
  given('[case1] a review whose precondition faulted', () => {
    const run = asReviewRunOfPreconditionFault({
      reason:
        '💥 MalfunctionError: the $targets list could not be read (EACCES)',
    });

    when('[t0] it is read the way the runner reads its own runs', () => {
      then('🔴 the verdict is a malfunction, never a clean approval', () => {
        expect(asReviewVerdict({ run }).outcome).toEqual('malfunctioned');
      });

      then('the exit classes as a malfunction', () => {
        expect(asExitCodeClass({ code: run.exitCode })).toEqual('malfunction');
      });

      then('the reason rides on stderr, where a lane fault is read', () => {
        expect(run.stderr).toContain('the $targets list could not be read');
      });
    });
  });
});
