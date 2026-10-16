import { BadRequestError } from 'helpful-errors';

import { asWarmerRefusalBody } from './asWarmerRefusalBody';

const TEST_CASES = [
  {
    description: 'cuts the class label off a refusal with a metadata bag',
    given: { error: new BadRequestError('--warmer "x" is bad', { flag: 'x' }) },
    expect: { output: '--warmer "x" is bad\n\n{\n  "flag": "x"\n}' },
  },
  {
    description: 'cuts the class label off a refusal with no bag',
    given: { error: new BadRequestError('--warmer was given no value') },
    expect: { output: '--warmer was given no value' },
  },
];

describe('asWarmerRefusalBody', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asWarmerRefusalBody({ error: thisCase.given.error })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
