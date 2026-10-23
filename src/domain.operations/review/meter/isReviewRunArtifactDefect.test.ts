import { UnexpectedCodePathError } from 'helpful-errors';

import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

import { isReviewRunArtifactDefect } from './isReviewRunArtifactDefect';

const TEST_CASES = [
  {
    description: 'an artifact defect the reader raises is isolated',
    given: {
      error: new ReviewRunArtifactError(
        'review log artifact is present but unparseable: metrics.realized.json',
      ),
    },
    expect: { output: true },
  },
  {
    // the clamp: an unhandled `never` branch raises the generic parent class, and
    // it is a code bug, never a corrupt run
    description:
      'a generic UnexpectedCodePathError in the meter code is not isolated',
    given: {
      error: new UnexpectedCodePathError('a grade was not handled'),
    },
    expect: { output: false },
  },
  {
    description: 'a TypeError in the meter code is not isolated',
    given: { error: new TypeError('cannot read properties of undefined') },
    expect: { output: false },
  },
  {
    description: 'a bare Error is not isolated',
    given: { error: new Error('boom') },
    expect: { output: false },
  },
  {
    description: 'a thrown string is not isolated',
    given: { error: 'boom' },
    expect: { output: false },
  },
];

describe('isReviewRunArtifactDefect', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        isReviewRunArtifactDefect({ error: thisCase.given.error }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
