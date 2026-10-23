import { given, then, when } from 'test-fns';

import type { ReviewRun } from '../review/runOneReview';
import { asReviewVerdict } from './asReviewVerdict';

const asRun = (input: Partial<ReviewRun>): ReviewRun => ({
  stdout: '',
  stderr: '',
  exitCode: 0,
  durationMs: 1,
  blockers: 0,
  nitpicks: 0,
  tallier: 'deterministic',
  talliedBy: null,
  detected: true,
  ...input,
});

describe('asReviewVerdict', () => {
  given('[case1] a detected run with blockers', () => {
    const run = asRun({ detected: true, blockers: 2, nitpicks: 1 });

    when('[t0] mapped to a verdict', () => {
      then('outcome is rejected', () => {
        expect(asReviewVerdict({ run }).outcome).toEqual('rejected');
      });

      then('it carries the blocker + nitpick counts', () => {
        const verdict = asReviewVerdict({ run });
        expect(verdict.blockers).toEqual(2);
        expect(verdict.nitpicks).toEqual(1);
      });
    });
  });

  given('[case2] a detected run with nitpicks but no blockers', () => {
    const run = asRun({ detected: true, blockers: 0, nitpicks: 3 });

    when('[t0] mapped to a verdict', () => {
      then('outcome is passed — nitpicks alone do not reject', () => {
        expect(asReviewVerdict({ run }).outcome).toEqual('passed');
      });
    });
  });

  given('[case3] an undetected run with a stderr reason', () => {
    const run = asRun({
      detected: false,
      exitCode: 2,
      stderr: '\n✋ could not tally review\nmore detail',
    });

    when('[t0] mapped to a verdict', () => {
      then('outcome is malfunctioned, never a clean 0/0', () => {
        const verdict = asReviewVerdict({ run });
        expect(verdict.outcome).toEqual('malfunctioned');
        expect(verdict.tallier).toEqual(null);
      });

      then('reason is the first non-empty stderr line', () => {
        expect(asReviewVerdict({ run }).reason).toEqual(
          '✋ could not tally review',
        );
      });
    });
  });

  given('[case4] an undetected run with empty stderr', () => {
    const run = asRun({ detected: false, exitCode: 137, stderr: '' });

    when('[t0] mapped to a verdict', () => {
      then('reason falls back to the exit-code phrase', () => {
        expect(asReviewVerdict({ run }).reason).toEqual(
          'review exited 137 with no verdict',
        );
      });
    });
  });

  given(
    '[case5] 🔴 an undetected run whose stderr opens with harness chrome and a source frame',
    () => {
      // the exact shape a `rhx review` child prints on an uncaught throw: a styled dispatch
      // banner, its status tree, then node's source frame and code line ahead of the message
      const run = asRun({
        detected: false,
        exitCode: 1,
        stderr: [
          '\u001b[2m🪨 run solid skill repo=bhrain/role=reviewer/skill=review\u001b[0m',
          '   └─ 💥 failed with an error',
          '',
          '/x/node_modules/rhachet/dist/genContextBrain.js:108',
          '    throw new BrainChoiceNotFoundError(`brain not found: ${choice}`);',
          '    ^',
          '',
          // node prints `name: message`, and this error's message carries its name too
          'BrainChoiceNotFoundError: BrainChoiceNotFoundError: brain not found: nonexistent/broken/brain',
          '    at genContextBrain (/x/genContextBrain.js:108:11)',
        ].join('\n'),
      });

      when('[t0] mapped to a verdict', () => {
        then(
          'the reason is the line that names the error, its class named once, never the chrome',
          () => {
            expect(asReviewVerdict({ run }).reason).toEqual(
              'BrainChoiceNotFoundError: brain not found: nonexistent/broken/brain',
            );
          },
        );
      });
    },
  );
});
