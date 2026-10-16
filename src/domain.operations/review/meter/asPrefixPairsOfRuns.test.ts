import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';

import { asPrefixPairsOfRuns } from './asPrefixPairsOfRuns';

const ROOT = '/tree/a/.log/bhrain/review';

/**
 * .what = one run, minted at a chosen minute, under a chosen reviewer — or none
 * .why = the pair walk turns on the reviewer, the route, and the mint order alone
 */
const asRun = (input: {
  minute: number;
  slug: string | null;
  route?: string;
}): ReviewRunMeter => ({
  dir: `${ROOT}/2026-09-26T00-${String(input.minute).padStart(2, '0')}-00-000Z.pid1.m${input.minute}`,
  head: null,
  brain: null,
  provider: null,
  identity:
    input.slug === null
      ? null
      : {
          route: input.route ?? '.behavior/v2026_09_20.review-cost-meter',
          stone: '5.1',
          iteration: input.minute,
          hash: 'a1b2c3d',
          index: 1,
          slug: input.slug,
        },
  defect: null,
  scope: null,
  grade: 'refused',
  tokens: null,
  cost: null,
  prompt: null,
});

/**
 * .what = each pair as `prior minute → round minute`
 * .why = a case asserts which rounds were paired, in a form a reader scans at a glance
 */
const asPairMinutes = (input: { runs: ReviewRunMeter[] }): string[] =>
  asPrefixPairsOfRuns(input).map(
    (pair) =>
      `${pair.prior.identity.iteration}→${pair.round.identity.iteration}`,
  );

const TEST_CASES = [
  {
    description:
      'three rounds of one reviewer earn two pairs, each beside its prior',
    runs: [
      asRun({ minute: 0, slug: 'repo-rules' }),
      asRun({ minute: 10, slug: 'repo-rules' }),
      asRun({ minute: 20, slug: 'repo-rules' }),
    ],
    expected: ['0→10', '10→20'],
  },
  {
    description: 'rounds pair in mint order, whatever order they arrive in',
    runs: [
      asRun({ minute: 20, slug: 'repo-rules' }),
      asRun({ minute: 0, slug: 'repo-rules' }),
    ],
    expected: ['0→20'],
  },
  {
    description: 'two reviewers never pair with each other',
    runs: [
      asRun({ minute: 0, slug: 'repo-rules' }),
      asRun({ minute: 5, slug: 'mech-failhides' }),
      asRun({ minute: 10, slug: 'repo-rules' }),
    ],
    expected: ['0→10'],
  },
  {
    description: 'one slug under two routes is two reviewers',
    runs: [
      asRun({ minute: 0, slug: 'repo-rules', route: '.behavior/a' }),
      asRun({ minute: 10, slug: 'repo-rules', route: '.behavior/b' }),
    ],
    expected: [],
  },
  {
    description: 'a run with no guard identity pairs with naught',
    runs: [asRun({ minute: 0, slug: null }), asRun({ minute: 10, slug: null })],
    expected: [],
  },
  {
    description: 'a first round alone earns no pair',
    runs: [asRun({ minute: 0, slug: 'repo-rules' })],
    expected: [],
  },
];

describe('asPrefixPairsOfRuns', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asPairMinutes({ runs: thisCase.runs })).toEqual(thisCase.expected);
    }),
  );
});
