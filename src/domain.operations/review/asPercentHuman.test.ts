import { asPercentHuman } from './asPercentHuman';

const TEST_CASES = [
  {
    description: 'renders a whole percent to one decimal',
    given: { of: 42 },
    expect: { output: '42.0%' },
  },
  {
    description: 'rounds to one decimal',
    given: { of: 61.26 },
    expect: { output: '61.3%' },
  },
  {
    description: 'renders zero as a measured zero',
    given: { of: 0 },
    expect: { output: '0.0%' },
  },
  {
    description: 'renders a share past one hundred as is',
    given: { of: 112.5 },
    expect: { output: '112.5%' },
  },
];

describe('asPercentHuman', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asPercentHuman(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
