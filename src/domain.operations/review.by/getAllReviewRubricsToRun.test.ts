import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import type { ReviewRubric } from './asReviewRubricsConfig';
import { getAllReviewRubricsToRun } from './getAllReviewRubricsToRun';

const asRubric = (slug: string): ReviewRubric => ({
  slug,
  rules: [`rule.${slug}.md`],
});

describe('getAllReviewRubricsToRun', () => {
  const rubrics = [
    asRubric('mech-failhides'),
    asRubric('mech-decode-friction'),
  ];

  given('[case1] no --for supplied', () => {
    when('[t0] narrowed', () => {
      then('it returns every rubric, in order', () => {
        expect(getAllReviewRubricsToRun({ rubrics, for: null })).toEqual(
          rubrics,
        );
      });
    });
  });

  given('[case2] a --for that matches a declared slug', () => {
    when('[t0] narrowed', () => {
      then('it returns exactly that one rubric', () => {
        const result = getAllReviewRubricsToRun({
          rubrics,
          for: 'mech-failhides',
        });
        expect(result).toHaveLength(1);
        expect(result[0]!.slug).toEqual('mech-failhides');
      });
    });
  });

  given('[case3] a --for that matches no declared slug', () => {
    when('[t0] narrowed', () => {
      then(
        'it fails loud with the absent slug + the available slugs',
        async () => {
          const error = await getError(() =>
            getAllReviewRubricsToRun({ rubrics, for: 'nope' }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('rubric not found: nope');
          // the message names the valid slugs so the human can pick one (names the fix)
          expect(error.message).toContain(
            'available rubrics: mech-failhides, mech-decode-friction',
          );
        },
      );
    });
  });
});
