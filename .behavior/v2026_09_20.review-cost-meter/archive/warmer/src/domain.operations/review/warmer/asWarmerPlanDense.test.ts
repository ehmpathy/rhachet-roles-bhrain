import { asWarmerPlanDense } from './asWarmerPlanDense';

const TEST_CASES = [
  {
    description: '🔴 a legal 1-poke plan reads `1 poke`, never `1 pokes`',
    given: { plan: { pokes: 1, everyMinutes: 15 } },
    expect: { output: '1 poke, 15m apart' },
  },
  {
    description: 'the default plan reads plural',
    given: { plan: { pokes: 3, everyMinutes: 4 } },
    expect: { output: '3 pokes, 4m apart' },
  },
];

describe('asWarmerPlanDense', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asWarmerPlanDense(thisCase.given.plan)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
