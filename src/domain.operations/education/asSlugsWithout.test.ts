import { asIsoDateStamp } from 'iso-time';

import { asCoordinateValue } from './asCoordinateValue';
import { asPursuitDate } from './asPursuitDate';
import { asSlugsDistinct } from './asSlugsDistinct';
import { asSlugsWithout } from './asSlugsWithout';

describe('asSlugsWithout', () => {
  test('it drops each excluded slug and keeps the given order', () => {
    expect(
      asSlugsWithout({
        slugs: ['retries', 'idempotency', 'backoff'],
        without: ['idempotency'],
      }),
    ).toEqual(['retries', 'backoff']);
  });
  test('an empty exclusion keeps every slug', () => {
    expect(asSlugsWithout({ slugs: ['a', 'b'], without: [] })).toEqual([
      'a',
      'b',
    ]);
  });
});

describe('asSlugsDistinct', () => {
  test('it names each slug once, in name order', () => {
    expect(
      asSlugsDistinct({ slugs: ['mechanic', 'architect', 'mechanic'] }),
    ).toEqual(['architect', 'mechanic']);
  });
});

describe('asCoordinateValue', () => {
  const TEST_CASES: Array<{
    name: string;
    key: string;
    expected: string | null;
  }> = [
    { name: 'repo=ehmpathy', key: 'repo', expected: 'ehmpathy' },
    { name: 'role=mechanic', key: 'repo', expected: null },
    { name: 'repo=', key: 'repo', expected: null },
    { name: 'readme.md', key: 'repo', expected: null },
  ];
  TEST_CASES.map((thisCase) =>
    test(`${thisCase.name} by ${thisCase.key} → ${thisCase.expected}`, () => {
      expect(
        asCoordinateValue({ name: thisCase.name, key: thisCase.key }),
      ).toEqual(thisCase.expected);
    }),
  );
});

describe('asPursuitDate', () => {
  test('it spells the day as a pursuit dir name carries it', () => {
    expect(asPursuitDate({ day: asIsoDateStamp('2026-11-24') })).toEqual(
      '2026_11_24',
    );
  });
});
