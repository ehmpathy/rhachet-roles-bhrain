import { MalfunctionError } from 'helpful-errors';

import { asErrorHeadline } from './asErrorHeadline';

const TEST_CASES = [
  {
    description:
      'a helpful error keeps its headline, sans class label and metadata',
    given: new MalfunctionError(
      '💥 MalfunctionError: the brain call failed — terminated',
      {
        hint: 're-run the review',
      },
    ),
    expect: 'the brain call failed — terminated',
  },
  {
    description: 'a plain error keeps its message',
    given: new Error('spawn ENOENT'),
    expect: 'spawn ENOENT',
  },
  {
    description: 'stacked wrap labels are all cut',
    given: new Error(
      'UnexpectedCodePathError: ✋ ConstraintError: the plan is torn',
    ),
    expect: 'the plan is torn',
  },
  {
    description: 'a label mid-message stays, since it is prose',
    given: new Error('the call raised a TypeError: x is not a function'),
    expect: 'the call raised a TypeError: x is not a function',
  },
  {
    description: 'a thrown non-error renders as its string',
    given: 'socket closed',
    expect: 'socket closed',
  },
];

describe('asErrorHeadline', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const headline = asErrorHeadline({ error: thisCase.given });
      expect(headline).toEqual(thisCase.expect);
      expect(headline).not.toContain('\n');
    }),
  );
});
