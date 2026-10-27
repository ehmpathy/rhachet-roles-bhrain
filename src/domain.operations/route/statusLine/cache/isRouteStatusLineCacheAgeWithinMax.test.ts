import { given, then, when } from 'test-fns';

import { isRouteStatusLineCacheAgeWithinMax } from './isRouteStatusLineCacheAgeWithinMax';

const NOW_MS = 1_800_000_000_000;

const TEST_CASES = [
  {
    description: 'a cache written this instant is within the max age',
    given: { writtenAtMs: NOW_MS },
    expect: { output: true },
  },
  {
    description: 'a cache 29_999ms old is within the max age',
    given: { writtenAtMs: NOW_MS - 29_999 },
    expect: { output: true },
  },
  {
    description: 'a cache exactly 30_000ms old is past the max age',
    given: { writtenAtMs: NOW_MS - 30_000 },
    expect: { output: false },
  },
  {
    description: 'a cache 31s old is past the max age',
    given: { writtenAtMs: NOW_MS - 31_000 },
    expect: { output: false },
  },
  {
    description:
      'a cache whose sub-ms mtime sits in the same ms as now is within the max age',
    given: { writtenAtMs: NOW_MS + 0.5 },
    expect: { output: true },
  },
  {
    description:
      'a cache written 1ms ahead of now (a clock step back) reads as stale, never fresh',
    given: { writtenAtMs: NOW_MS + 1 },
    expect: { output: false },
  },
];

describe('isRouteStatusLineCacheAgeWithinMax', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the age is checked against now', () => {
        then('it returns the expected verdict', () => {
          expect(
            isRouteStatusLineCacheAgeWithinMax({
              writtenAtMs: thisCase.given.writtenAtMs,
              nowMs: NOW_MS,
            }),
          ).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});
