import { getOneReviewModeRepeatRefusal } from './getOneReviewModeRepeatRefusal';

const TEST_CASES = [
  {
    description: 'no --mode at all is accepted',
    given: { modes: [] },
    expect: { refusal: null },
  },
  {
    description: 'a single --mode plan is accepted',
    given: { modes: ['plan'] },
    expect: { refusal: null },
  },
  {
    description: 'a single dispatcher --mode hard is accepted',
    given: { modes: ['hard'] },
    expect: { refusal: null },
  },
  {
    description:
      '🔴 --mode plan beside --mode hard is refused, never run as a paid review',
    given: { modes: ['plan', 'hard'] },
    expect: {
      refusal: '--mode given more than once with different values: plan, hard',
    },
  },
  {
    description:
      '🔴 the reverse order is refused too, since last-wins read plan',
    given: { modes: ['hard', 'plan'] },
    expect: {
      refusal: '--mode given more than once with different values: hard, plan',
    },
  },
  {
    description:
      'two dispatcher modes that differ are refused — the run cannot tell which was meant',
    given: { modes: ['hard', 'soft'] },
    expect: {
      refusal: '--mode given more than once with different values: hard, soft',
    },
  },
  {
    description:
      '--mode hard twice is accepted: every value agrees, so no choice is dropped',
    given: { modes: ['hard', 'hard'] },
    expect: { refusal: null },
  },
  {
    description: '--mode plan twice is accepted: every value agrees',
    given: { modes: ['plan', 'plan'] },
    expect: { refusal: null },
  },
  {
    description: 'each distinct value is named once, in the order first typed',
    given: { modes: ['plan', 'hard', 'plan'] },
    expect: {
      refusal: '--mode given more than once with different values: plan, hard',
    },
  },
];

describe('getOneReviewModeRepeatRefusal', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const refusal = getOneReviewModeRepeatRefusal(thisCase.given);
      expect(refusal).toEqual(thisCase.expect.refusal);
    }),
  );
});
