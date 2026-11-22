import { isReviewWarmerRecordAlive } from './isReviewWarmerRecordAlive';
import type { ReviewWarmerRecord } from './ReviewWarmerRecord';

const NOW = new Date('2026-10-08T12:00:00.000Z');

const RECORD_BASE: ReviewWarmerRecord = {
  plan: { pokes: 3, everyMinutes: 15 },
  pid: 4242,
  spawnedAt: '2026-10-08T11:30:00.000Z',
  wakeBy: '2026-10-08T12:10:00.000Z',
  pokedAt: null,
  endedAt: null,
};

const TEST_CASES = [
  {
    description: 'a record not yet past its wake is alive',
    given: { record: RECORD_BASE },
    expect: { output: true },
  },
  {
    description: 'a record one minute late is alive, inside the grace',
    given: { record: { ...RECORD_BASE, wakeBy: '2026-10-08T11:59:00.000Z' } },
    expect: { output: true },
  },
  {
    description: 'a record ten minutes late reads dead',
    given: { record: { ...RECORD_BASE, wakeBy: '2026-10-08T11:50:00.000Z' } },
    expect: { output: false },
  },
  {
    description: 'a record whose warmer exited reads dead',
    given: { record: { ...RECORD_BASE, endedAt: '2026-10-08T11:55:00.000Z' } },
    expect: { output: false },
  },
  {
    description: 'an absent record reads dead',
    given: { record: null },
    expect: { output: false },
  },
  {
    // a hand-edit of the cache can garble the stamp; the named branch reads it as dead
    description: '🔴 a record with a garbled wakeBy stamp reads dead',
    given: { record: { ...RECORD_BASE, wakeBy: 'not-a-stamp' } },
    expect: { output: false },
  },
];

describe('isReviewWarmerRecordAlive', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        isReviewWarmerRecordAlive({ record: thisCase.given.record, now: NOW }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
