import { given, then, when } from 'test-fns';

import { asRouteInflightFreshness } from './asRouteInflightFreshness';
import { RouteInflight } from './RouteInflight';

const MINUTE_MS = 60_000;
const NOW = 1_800_000_000_000;

const inflightOf = (input: { stone: string; ageMinutes: number }) =>
  new RouteInflight({
    stone: input.stone,
    since: NOW - input.ageMinutes * MINUTE_MS,
    what: 'three delegates repair blockers 1-4',
  });

const TEST_CASES = [
  {
    description: 'no watermark → absent',
    given: { inflight: null, stone: '5.1.execution' },
    expect: { of: 'absent' },
  },
  {
    description: 'a watermark for another stone → absent',
    given: {
      inflight: inflightOf({ stone: '3.blueprint', ageMinutes: 1 }),
      stone: '5.1.execution',
    },
    expect: { of: 'absent' },
  },
  {
    description: 'a watermark marked just now → fresh',
    given: {
      inflight: inflightOf({ stone: '5.1.execution', ageMinutes: 0 }),
      stone: '5.1.execution',
    },
    expect: { of: 'fresh' },
  },
  {
    description: 'a watermark one minute under the bound → fresh',
    given: {
      inflight: inflightOf({ stone: '5.1.execution', ageMinutes: 29 }),
      stone: '5.1.execution',
    },
    expect: { of: 'fresh' },
  },
  {
    description: 'a watermark exactly at the bound → stale',
    given: {
      inflight: inflightOf({ stone: '5.1.execution', ageMinutes: 30 }),
      stone: '5.1.execution',
    },
    expect: { of: 'stale' },
  },
  {
    description: 'a watermark hours past the bound → stale',
    given: {
      inflight: inflightOf({ stone: '5.1.execution', ageMinutes: 300 }),
      stone: '5.1.execution',
    },
    expect: { of: 'stale' },
  },
  {
    description:
      'a watermark stamped minutes ahead of a wall clock that stepped back → fresh',
    given: {
      inflight: inflightOf({ stone: '5.1.execution', ageMinutes: -5 }),
      stone: '5.1.execution',
    },
    expect: { of: 'fresh' },
  },
  {
    description:
      'a watermark stamped past the bound ahead of a wall clock that stepped back → stale',
    given: {
      inflight: inflightOf({ stone: '5.1.execution', ageMinutes: -90 }),
      stone: '5.1.execution',
    },
    expect: { of: 'stale' },
  },
] as const;

describe('asRouteInflightFreshness', () => {
  TEST_CASES.map((thisCase) =>
    given(`[case] ${thisCase.description}`, () => {
      when('[t0] freshness is decided', () => {
        then(`it reads as ${thisCase.expect.of}`, () => {
          const decision = asRouteInflightFreshness({
            inflight: thisCase.given.inflight,
            stone: thisCase.given.stone,
            now: NOW,
          });
          expect(decision.of).toEqual(thisCase.expect.of);
        });
      });
    }),
  );

  given('[case] a fresh watermark', () => {
    when('[t0] freshness is decided', () => {
      then('the decision carries the watermark and its age', () => {
        const inflight = inflightOf({ stone: '5.1.execution', ageMinutes: 7 });
        const decision = asRouteInflightFreshness({
          inflight,
          stone: '5.1.execution',
          now: NOW,
        });
        expect(decision).toEqual({
          of: 'fresh',
          inflight,
          ageMs: 7 * MINUTE_MS,
        });
      });
    });
  });

  given('[case] a watermark stamped ahead of the wall clock', () => {
    when('[t0] freshness is decided', () => {
      then('the age it carries is zero, never negative', () => {
        const inflight = inflightOf({ stone: '5.1.execution', ageMinutes: -5 });
        const decision = asRouteInflightFreshness({
          inflight,
          stone: '5.1.execution',
          now: NOW,
        });
        expect(decision).toEqual({ of: 'fresh', inflight, ageMs: 0 });
      });
    });
  });
});
