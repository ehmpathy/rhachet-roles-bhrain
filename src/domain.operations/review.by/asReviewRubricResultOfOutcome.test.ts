import { given, then, when } from 'test-fns';

import { asReviewRubricResultOfOutcome } from './asReviewRubricResultOfOutcome';
import type { ReviewRubricResult } from './ReviewByResult';

const RUBRIC = { slug: 'gamma', purpose: 'the third lens', rules: [] };
const OUTPUT_PATH = '.reviews/by=demo/rubric=gamma.md';

describe('asReviewRubricResultOfOutcome', () => {
  given('[case1] a rubric that returned its row', () => {
    const row: ReviewRubricResult = {
      slug: 'gamma',
      purpose: 'the third lens',
      verdict: {
        blockers: 1,
        nitpicks: 0,
        outcome: 'rejected',
        tallier: 'deterministic',
        talliedBy: null,
      },
      outputPath: OUTPUT_PATH,
      durationMs: 1200,
      stdout: '1 blocker\n0 nitpicks',
      stderr: '',
    };

    when('[t0] its fulfilled outcome is read', () => {
      then('the row comes back untouched', () => {
        expect(
          asReviewRubricResultOfOutcome({
            outcome: { status: 'fulfilled', value: row },
            rubric: RUBRIC,
            outputPath: OUTPUT_PATH,
          }),
        ).toBe(row);
      });
    });
  });

  given('[case2] a rubric whose run threw a defect', () => {
    const result = asReviewRubricResultOfOutcome({
      outcome: { status: 'rejected', reason: new TypeError('x is undefined') },
      rubric: RUBRIC,
      outputPath: OUTPUT_PATH,
    });

    when('[t0] its rejected outcome is read', () => {
      then('it answers as a malfunctioned row, never a dropped one', () => {
        expect(result.slug).toEqual('gamma');
        expect(result.outputPath).toEqual(OUTPUT_PATH);
        expect(result.verdict.outcome).toEqual('malfunctioned');
      });

      then(
        'the reason names the defect as review.by own, not a reviewer verdict',
        () => {
          expect(result.verdict.reason).toContain('a defect in review.by');
          expect(result.verdict.reason).toContain('x is undefined');
        },
      );

      then(
        'the stack rides on stderr, so the defect reaches the human as itself',
        () => {
          expect(result.stderr).toContain('💥 UnexpectedCodePathError:');
          expect(result.stderr).toContain('TypeError: x is undefined');
        },
      );
    });
  });
});
