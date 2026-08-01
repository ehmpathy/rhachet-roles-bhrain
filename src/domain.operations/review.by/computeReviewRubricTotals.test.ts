import { given, then, when } from 'test-fns';

import { computeReviewRubricTotals } from './computeReviewRubricTotals';
import type { ReviewRubricResult } from './ReviewByResult';

const asResult = (input: {
  slug: string;
  blockers: number;
  nitpicks: number;
  outcome: ReviewRubricResult['verdict']['outcome'];
}): ReviewRubricResult => ({
  slug: input.slug,
  verdict: {
    blockers: input.blockers,
    nitpicks: input.nitpicks,
    outcome: input.outcome,
    tallier: 'deterministic',
  },
  outputPath: `.reviews/${input.slug}.md`,
  durationMs: null,
  stdout: '',
});

describe('computeReviewRubricTotals', () => {
  given('[case1] a mix of pass + findings', () => {
    const results = [
      asResult({ slug: 'a', blockers: 0, nitpicks: 0, outcome: 'passed' }),
      asResult({ slug: 'b', blockers: 2, nitpicks: 1, outcome: 'rejected' }),
      asResult({ slug: 'c', blockers: 1, nitpicks: 3, outcome: 'rejected' }),
    ];

    when('[t0] summed', () => {
      then('it totals the blockers', () => {
        expect(computeReviewRubricTotals({ results }).blockersTotal).toEqual(3);
      });

      then('it totals the nitpicks', () => {
        expect(computeReviewRubricTotals({ results }).nitpicksTotal).toEqual(4);
      });
    });
  });

  given('[case2] an empty results list', () => {
    when('[t0] summed', () => {
      then('it totals to 0 / 0', () => {
        const totals = computeReviewRubricTotals({ results: [] });
        expect(totals.blockersTotal).toEqual(0);
        expect(totals.nitpicksTotal).toEqual(0);
      });
    });
  });

  given('[case3] nitpicks only, no blockers', () => {
    const results = [
      asResult({ slug: 'a', blockers: 0, nitpicks: 5, outcome: 'passed' }),
    ];

    when('[t0] summed', () => {
      then('blockers total is 0', () => {
        expect(computeReviewRubricTotals({ results }).blockersTotal).toEqual(0);
      });

      then('nitpicks total carries', () => {
        expect(computeReviewRubricTotals({ results }).nitpicksTotal).toEqual(5);
      });
    });
  });
});
