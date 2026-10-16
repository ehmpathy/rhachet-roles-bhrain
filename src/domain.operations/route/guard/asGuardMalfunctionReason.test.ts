import { given, then, when } from 'test-fns';

import { asGuardMalfunctionReason } from './asGuardMalfunctionReason';
import { asGuardMalfunctionReasonLines } from './asGuardMalfunctionReasonLines';

const laneTimeout = {
  index: 14,
  path: '.behavior/x/.reviews/peer/5.1._.review.i005.abc.r014._.given.by_peer.repo-rules-briefs.md',
  exitCode: 1,
  stderr:
    'MalfunctionError [ReviewTimeoutError]: 💥 MalfunctionError: review timed out after 20 minutes\n\n{ ... }',
};
const laneSocket = {
  index: 22,
  path: '.behavior/x/.reviews/peer/5.1._.review.i005.abc.r022._.given.by_peer.behavior-intent-coverage-review-ops.md',
  exitCode: 1,
  stderr:
    'MalfunctionError [ReviewBrainCallError]: 💥 MalfunctionError: the brain call failed — terminated\n',
};
const laneBare = {
  index: 3,
  path: '.route/odd-path.md',
  exitCode: 137,
  stderr: 'Killed',
};

describe('asGuardMalfunctionReason', () => {
  given(
    '[case1] two of twenty-three reviewers broke, four others rejected',
    () => {
      when('[t0] the reason is built', () => {
        const reason = asGuardMalfunctionReason({
          reviews: [laneTimeout, laneSocket],
          judges: [],
          reviewTotal: 23,
          rejectedTotal: 4,
        });

        then('the header names the partial count and the owed answers', () => {
          expect(reason.split('\n')[0]).toEqual(
            '2 of 23 reviewers malfunctioned; 4 reviewers rejected and await your answer',
          );
        });

        then('each broken lane is named with its slug and cause', () => {
          expect(reason.split('\n').slice(1)).toEqual([
            'r14 repo-rules-briefs: review timed out after 20 minutes',
            'r22 behavior-intent-coverage-review-ops: the brain call failed — terminated',
          ]);
        });

        then('the reader parts header from lanes', () => {
          expect(asGuardMalfunctionReasonLines({ reason })).toEqual({
            header:
              '2 of 23 reviewers malfunctioned; 4 reviewers rejected and await your answer',
            lanes: [
              'r14 repo-rules-briefs: review timed out after 20 minutes',
              'r22 behavior-intent-coverage-review-ops: the brain call failed — terminated',
            ],
          });
        });

        then('the reason never reads as a budget exhaustion', () => {
          expect(reason).not.toContain('budget exhausted');
        });
      });
    },
  );

  given(
    '[case2] a lane whose stderr names no cause, and a broken judge',
    () => {
      when('[t0] the reason is built', () => {
        const reason = asGuardMalfunctionReason({
          reviews: [laneBare],
          judges: [{ index: 1, path: '.route/j1.md', exitCode: 1, stderr: '' }],
          reviewTotal: 1,
          rejectedTotal: 0,
        });

        then('the fallbacks name the exit code and peer-N', () => {
          expect(reason).toEqual(
            [
              '1 of 1 reviewer malfunctioned; 1 judge malfunctioned',
              'r3 peer-3: exit code 137',
              'j1: exit code 1',
            ].join('\n'),
          );
        });
      });
    },
  );

  given('[case4] one reviewer broke, one other rejected', () => {
    when('[t0] the reason is built', () => {
      const reason = asGuardMalfunctionReason({
        reviews: [laneTimeout],
        judges: [],
        reviewTotal: 2,
        rejectedTotal: 1,
      });

      then('the verb agrees with a count of one', () => {
        expect(reason.split('\n')[0]).toEqual(
          '1 of 2 reviewers malfunctioned; 1 reviewer rejected and awaits your answer',
        );
      });
    });
  });

  given('[case3] a record persisted with no reason', () => {
    when('[t0] the reader reads it', () => {
      then('it returns null, so the render keeps only the levers', () => {
        expect(asGuardMalfunctionReasonLines({ reason: null })).toBeNull();
        expect(asGuardMalfunctionReasonLines({ reason: '' })).toBeNull();
      });
    });
  });
});
