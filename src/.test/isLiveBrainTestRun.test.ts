import { isLiveBrainTestRun } from './isLiveBrainTestRun';

const TEST_CASES = [
  {
    description: 'an empty env targets no live brain, so no key is sourced',
    given: { env: {} },
    expect: { output: false },
  },
  {
    description: 'ci alone targets no live brain: a flag, never a host, opts in',
    given: { env: { CI: 'true' } },
    expect: { output: false },
  },
  {
    description: 'one named flag set to 1 targets a live run',
    given: { env: { BHRAIN_TEST_LIVE_BRAIN_REVIEW: '1' } },
    expect: { output: true },
  },
  {
    description: 'the extant precedent flags count too',
    given: { env: { BHRAIN_TEST_LIVE_BRAIN_TALLY: '1' } },
    expect: { output: true },
  },
  {
    description: 'a flag set to aught but 1 targets naught, as the precedents read it',
    given: { env: { BHRAIN_TEST_LIVE_BRAIN_REVIEW: 'true' } },
    expect: { output: false },
  },
  {
    description: 'a peer prefix is not a live-brain flag',
    given: { env: { BHRAIN_TEST_LIVELY: '1' } },
    expect: { output: false },
  },
];

describe('isLiveBrainTestRun', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(isLiveBrainTestRun({ env: thisCase.given.env })).toEqual(
        thisCase.expect.output,
      );
    });
  });
});
