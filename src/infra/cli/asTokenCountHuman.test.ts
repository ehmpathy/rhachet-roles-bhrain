import { asTokenCountHuman } from './asTokenCountHuman';

const TEST_CASES = [
  {
    description: 'a count under a thousand stays whole',
    tokens: 950,
    output: '950',
  },
  { description: 'zero stays whole', tokens: 0, output: '0' },
  { description: 'a thousand reads as k', tokens: 1_000, output: '1.0k' },
  {
    description: 'thousands read as k, one decimal',
    tokens: 20_049,
    output: '20.0k',
  },
  { description: 'a million reads as M', tokens: 1_000_000, output: '1.0M' },
  {
    description: 'millions read as M, one decimal',
    tokens: 122_700_000,
    output: '122.7M',
  },
];

describe('asTokenCountHuman', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asTokenCountHuman({ tokens: thisCase.tokens })).toEqual(
        thisCase.output,
      );
    }),
  );
});
