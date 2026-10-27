import { asTokenRepaidTotal } from './asTokenRepaidTotal';

const TEST_CASES = [
  {
    description: 'sums every span a row was paid at',
    tokens: {
      cacheRead: 20_000,
      cacheWrite5m: 10_000,
      cacheWrite1h: 500,
      input: 7,
    },
    output: 30_507,
  },
  {
    description: 'a row paid at no span totals zero',
    tokens: { cacheRead: 0, cacheWrite5m: 0, cacheWrite1h: 0, input: 0 },
    output: 0,
  },
  {
    description: 'a row paid only as raw input counts that input',
    tokens: { cacheRead: 0, cacheWrite5m: 0, cacheWrite1h: 0, input: 42 },
    output: 42,
  },
];

describe('asTokenRepaidTotal', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asTokenRepaidTotal({ tokens: thisCase.tokens })).toEqual(
        thisCase.output,
      );
    }),
  );
});
