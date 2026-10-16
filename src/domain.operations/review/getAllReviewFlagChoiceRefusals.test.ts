import { getAllReviewFlagChoiceRefusals } from './getAllReviewFlagChoiceRefusals';

const DEFAULTS = {
  polluters: 'drop',
  join: 'intersect',
  focus: 'push',
  goal: 'exhaustive',
  mode: null,
};

const TEST_CASES = [
  {
    description: 'every default is accepted',
    given: { options: DEFAULTS },
    expect: { refusals: [] },
  },
  {
    description: 'every alternate is accepted',
    given: {
      options: {
        polluters: 'keep',
        join: 'union',
        focus: 'pull',
        goal: 'representative',
        mode: 'plan',
      },
    },
    expect: { refusals: [] },
  },
  {
    description:
      "the dispatcher's own --mode hard, which every guard call carries, is accepted",
    given: { options: { ...DEFAULTS, mode: 'hard' } },
    expect: { refusals: [] },
  },
  {
    description: "the dispatcher's --mode soft is accepted",
    given: { options: { ...DEFAULTS, mode: 'soft' } },
    expect: { refusals: [] },
  },
  {
    description:
      '🔴 a typo of --mode plan is refused, never run as a paid review',
    given: { options: { ...DEFAULTS, mode: 'plna' } },
    expect: {
      refusals: ['--mode must be plan, hard, or soft (received: plna)'],
    },
  },
  {
    description:
      '🔴 a typo of --focus is refused, never read as the other mode',
    given: { options: { ...DEFAULTS, focus: 'pul' } },
    expect: { refusals: ['--focus must be push or pull (received: pul)'] },
  },
  {
    description: 'a typo of --join is refused',
    given: { options: { ...DEFAULTS, join: 'unoin' } },
    expect: {
      refusals: ['--join must be intersect or union (received: unoin)'],
    },
  },
  {
    description: 'a typo of --goal is refused',
    given: { options: { ...DEFAULTS, goal: 'exhaustiv' } },
    expect: {
      refusals: [
        '--goal must be exhaustive or representative (received: exhaustiv)',
      ],
    },
  },
  {
    description: 'the --polluters refusal keeps its extant message',
    given: { options: { ...DEFAULTS, polluters: 'keepp' } },
    expect: {
      refusals: ['--polluters must be drop or keep (received: keepp)'],
    },
  },
  {
    description: 'two typos are both named, so one fix round clears them',
    given: { options: { ...DEFAULTS, focus: 'PUSH', goal: 'all' } },
    expect: {
      refusals: [
        '--focus must be push or pull (received: PUSH)',
        '--goal must be exhaustive or representative (received: all)',
      ],
    },
  },
];

describe('getAllReviewFlagChoiceRefusals', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const refusals = getAllReviewFlagChoiceRefusals(thisCase.given);
      expect(refusals).toEqual(thisCase.expect.refusals);
    }),
  );
});
