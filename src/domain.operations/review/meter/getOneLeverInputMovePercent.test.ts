import { getOneLeverInputMovePercent } from './getOneLeverInputMovePercent';

const asTokens = (input: { input: number; cacheGet: number }) => ({
  input: input.input,
  cacheSet: 0,
  cacheGet: input.cacheGet,
  output: 999, // output is never part of the prompt, so it must not move the lever
});

const TEST_CASES = [
  {
    description: 'a zero base → null (a move over zero is undefined)',
    given: {
      first: { tokens: asTokens({ input: 0, cacheGet: 0 }), metered: 1 },
      last: { tokens: asTokens({ input: 100, cacheGet: 0 }), metered: 1 },
    },
    expect: null,
  },
  {
    description: 'the same per-run prompt → zero move',
    given: {
      first: { tokens: asTokens({ input: 100, cacheGet: 100 }), metered: 2 },
      last: { tokens: asTokens({ input: 300, cacheGet: 0 }), metered: 3 },
    },
    expect: 0,
  },
  {
    description: 'half the per-run prompt → -50',
    given: {
      first: { tokens: asTokens({ input: 1000, cacheGet: 0 }), metered: 1 },
      last: { tokens: asTokens({ input: 500, cacheGet: 500 }), metered: 2 },
    },
    expect: -50,
  },
  {
    description:
      'more runs at a smaller prompt each → a drop, never a rise (per run, not total)',
    given: {
      first: { tokens: asTokens({ input: 400, cacheGet: 0 }), metered: 1 },
      last: { tokens: asTokens({ input: 800, cacheGet: 0 }), metered: 4 },
    },
    expect: -50,
  },
];

describe('getOneLeverInputMovePercent', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneLeverInputMovePercent(thisCase.given)).toEqual(
        thisCase.expect,
      );
    }),
  );
});
