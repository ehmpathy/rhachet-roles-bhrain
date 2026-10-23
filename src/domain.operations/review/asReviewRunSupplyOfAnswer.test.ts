import { given, then } from 'test-fns';

import { asReviewRunSupplyOfAnswer } from './asReviewRunSupplyOfAnswer';

const TEST_CASES = [
  {
    description: 'an openrouter answer carries its provider and generation id',
    given: {
      answer: {
        output: {},
        supply: {
          provider: 'DeepSeek',
          generationId: 'gen-1759770000-abc',
          attempts: [],
          choice: null,
        },
      },
    },
    expect: { provider: 'DeepSeek', generationId: 'gen-1759770000-abc' },
  },
  {
    description: 'an answer with no supply (another brain) reads as unreported',
    given: { answer: { output: {} } },
    expect: { provider: null, generationId: null },
  },
  {
    description: 'a supply that names no provider keeps its generation id',
    given: {
      answer: { supply: { provider: null, generationId: 'gen-2' } },
    },
    expect: { provider: null, generationId: 'gen-2' },
  },
  {
    description: 'a supply of an unknown shape reads as unreported',
    given: { answer: { supply: 'openrouter' } },
    expect: { provider: null, generationId: null },
  },
];

describe('asReviewRunSupplyOfAnswer', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it reads the supply fields by shape', () => {
        expect(
          asReviewRunSupplyOfAnswer({ answer: thisCase.given.answer }),
        ).toEqual(thisCase.expect);
      });
    }),
  );
});
