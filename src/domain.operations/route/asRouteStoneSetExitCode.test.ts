import { given, then } from 'test-fns';

import { asRouteStoneSetExitCode } from './asRouteStoneSetExitCode';

/**
 * .what = clamps which `route.stone.set` results exit 2 (refused) vs 0 (the act landed)
 * .why = a recorded stance exited 2, so a driver's `&&` chain of dispositions stopped after
 *        the first one, and rhachet printed `blocked by constraints` over a write that landed
 */
const TEST_CASES: {
  description: string;
  result: Parameters<typeof asRouteStoneSetExitCode>[0]['result'];
  expected: 0 | 2;
}[] = [
  {
    description: 'a recorded CONCEDE exits 0 — the act landed',
    result: { conceded: true },
    expected: 0,
  },
  {
    description: 'a recorded DISPUTE exits 0 — the act landed',
    result: { disputed: true },
    expected: 0,
  },
  {
    description: 'a passage the guard blocked exits 2',
    result: { passed: false },
    expected: 2,
  },
  {
    description: 'a passage granted exits 0',
    result: { passed: true },
    expected: 0,
  },
  {
    description: 'a challenged passage exits 2',
    result: { challenged: true },
    expected: 2,
  },
  {
    description: 'an approval refused exits 2',
    result: { approved: false },
    expected: 2,
  },
  {
    description: 'an overrule refused exits 2',
    result: { overruled: false },
    expected: 2,
  },
  {
    description: 'a force refused exits 2',
    result: { forced: false },
    expected: 2,
  },
  {
    description: 'a feedback absorb with no .taken exits 2',
    result: { absorbed: false },
    expected: 2,
  },
  {
    description: 'a feedback absorb recorded exits 0',
    result: { absorbed: true },
    expected: 0,
  },
];

describe('asRouteStoneSetExitCode', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then(`exit ${thisCase.expected}`, () => {
        expect(asRouteStoneSetExitCode({ result: thisCase.result })).toEqual(
          thisCase.expected,
        );
      });
    }),
  );
});
