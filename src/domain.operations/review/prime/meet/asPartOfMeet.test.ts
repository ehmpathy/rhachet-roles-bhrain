import { asPartOfMeet, type PartOfMeet } from './asPartOfMeet';
import type { PrimeWatermark } from './PrimeWatermark';

const MS = { await: 130_000, stale: 240_000, reach: 5_000 };
const NOW = 1_000_000_000;

/**
 * .what = a release written before `warm` and `sent` were fields, as it reads off disk
 * .why = json carries no type, so the record parses into the declared shape with both absent
 */
const RELEASE_LEGACY: PrimeWatermark = JSON.parse(
  JSON.stringify({
    claimedBy: 'pid1.old',
    claimedAt: NOW - 2_000,
    primedBy: 'pid1.old',
    primedAt: NOW - 1_000,
    peers: [],
  }),
);

const TEST_CASES: {
  description: string;
  given: { found: PrimeWatermark | null };
  expect: { output: PartOfMeet };
}[] = [
  {
    description: 'no watermark: this lane leads',
    given: { found: null },
    expect: { output: { role: 'leader' } },
  },
  {
    description: 'a fresh claim not yet released: this lane is its peer',
    given: {
      found: {
        claimedBy: 'pid1.lead',
        claimedAt: NOW - 500,
        primedBy: null,
        primedAt: null,
        warm: false,
        sent: false,
        peers: [],
      },
    },
    expect: { output: { role: 'peer', holder: 'pid1.lead' } },
  },
  {
    description:
      'an abandoned claim past the await bound: this lane leads afresh',
    given: {
      found: {
        claimedBy: 'pid1.dead',
        claimedAt: NOW - MS.await - 1,
        primedBy: null,
        primedAt: null,
        warm: false,
        sent: false,
        peers: [],
      },
    },
    expect: { output: { role: 'leader' } },
  },
  {
    description: 'a recent warm release: this lane pours at once',
    given: {
      found: {
        claimedBy: 'pid1.lead',
        claimedAt: NOW - 2_000,
        primedBy: 'pid1.lead',
        primedAt: NOW - 1_000,
        warm: true,
        sent: true,
        peers: ['pid2.peer'],
      },
    },
    expect: { output: { role: 'warm' } },
  },
  {
    description:
      'a recent cold release whose review was sent: trail out the rest of the reach',
    given: {
      found: {
        claimedBy: 'pid1.solo',
        claimedAt: NOW - 2_000,
        primedBy: 'pid1.solo',
        primedAt: NOW - 1_000,
        warm: false,
        sent: true,
        peers: [],
      },
    },
    expect: { output: { role: 'trail', msOfRemainder: 4_000 } },
  },
  {
    description:
      'a recent cold release with no review behind it: this lane leads afresh',
    given: {
      found: {
        claimedBy: 'pid1.defect',
        claimedAt: NOW - 2_000,
        primedBy: 'pid1.defect',
        primedAt: NOW - 1_000,
        warm: false,
        sent: false,
        peers: [],
      },
    },
    expect: { output: { role: 'leader' } },
  },
  {
    description: 'a stale warm release: this lane leads afresh',
    given: {
      found: {
        claimedBy: 'pid1.old',
        claimedAt: NOW - MS.stale - 2_000,
        primedBy: 'pid1.old',
        primedAt: NOW - MS.stale - 1,
        warm: true,
        sent: true,
        peers: [],
      },
    },
    expect: { output: { role: 'leader' } },
  },
  {
    description:
      '🔴 a recent release that lacks `warm` asserts no cache: never read as warm',
    given: { found: RELEASE_LEGACY },
    expect: { output: { role: 'leader' } },
  },
];

describe('asPartOfMeet', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asPartOfMeet({ found: thisCase.given.found, msOfNow: NOW, ms: MS }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
