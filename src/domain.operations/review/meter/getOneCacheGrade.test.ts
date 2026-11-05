import { asIsoPrice } from 'iso-price';
import { given, then, when } from 'test-fns';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';

import type { LaneOrdinal } from './getAllLaneOrdinals';
import { getOneCacheGrade } from './getOneCacheGrade';

/**
 * .what = one metered run that read naught from cache
 * .why = the grade reads only the dir (to place it) and the metered figures
 */
const asRun = (input: { dir: string }): ReviewRunMeter => ({
  dir: input.dir,
  head: 'aaaa',
  brain: 'openrouter/deepseek/flash',
  provider: null,
  meet: null,
  minutesOfCall: null,
  identity: null,
  defect: null,
  scope: null,
  grade: 'metered',
  tokens: { input: 1_000, cacheSet: 0, cacheGet: 0, output: 10 },
  cost: { total: asIsoPrice('USD 0.01'), cacheSaved: null },
  prompt: null,
});

const asOrdinals = (
  entries: [string, LaneOrdinal][],
): Map<string, LaneOrdinal> => new Map(entries);

describe('getOneCacheGrade', () => {
  given('[case0] a bucket of pokes alone', () => {
    const runs = [
      { ...asRun({ dir: '/r/poke-a' }), meet: 'poke' as const },
      { ...asRun({ dir: '/r/poke-b' }), meet: 'poke' as const },
    ];
    const ordinals = asOrdinals([
      ['/r/poke-a', { ordinal: 1, lapsedMinutes: null, metWarm: false }],
      ['/r/poke-b', { ordinal: 2, lapsedMinutes: null, metWarm: false }],
    ]);

    when('[t0] the bucket is graded', () => {
      then(
        '🔴 it is cold by design — a poke writes the head and owes no read, even on its second round',
        () => {
          expect(getOneCacheGrade({ runs, ordinals })).toEqual({
            kind: 'cold',
            cause: 'poke',
          });
        },
      );
    });

    when('[t1] one lane run joins the pokes', () => {
      then('the bucket grades on the lane run, never as a poke', () => {
        const withLane = [...runs, asRun({ dir: '/r/lane' })];
        const withLaneOrdinals = asOrdinals([
          ...ordinals.entries(),
          ['/r/lane', { ordinal: 1, lapsedMinutes: null, metWarm: true }],
        ]);
        expect(
          getOneCacheGrade({ runs: withLane, ordinals: withLaneOrdinals }),
        ).toEqual({ kind: 'warm', via: 'meet' });
      });
    });
  });

  given('[case1] a lane first round that met a warm peer', () => {
    const runs = [asRun({ dir: '/r/a' })];
    const ordinals = asOrdinals([
      ['/r/a', { ordinal: 1, lapsedMinutes: null, metWarm: true }],
    ]);

    when('[t0] the bucket is graded', () => {
      then(
        '🔴 it is warm via the meet, so its zero names the replica, never a broken prefix',
        () => {
          expect(getOneCacheGrade({ runs, ordinals })).toEqual({
            kind: 'warm',
            via: 'meet',
          });
        },
      );
    });
  });

  given('[case2] a lane repeat round in reach that also met warm', () => {
    const runs = [asRun({ dir: '/r/a' })];
    const ordinals = asOrdinals([
      ['/r/a', { ordinal: 2, lapsedMinutes: null, metWarm: true }],
    ]);

    when('[t0] the bucket is graded', () => {
      then(
        '🔴 it is warm via the meet: a peer wrote this round head seconds before, so no broken prefix explains the zero',
        () => {
          expect(getOneCacheGrade({ runs, ordinals })).toEqual({
            kind: 'warm',
            via: 'meet',
          });
        },
      );
    });
  });

  given('[case4] a lane repeat round in reach that met no warm peer', () => {
    const runs = [asRun({ dir: '/r/a' })];
    const ordinals = asOrdinals([
      ['/r/a', { ordinal: 2, lapsedMinutes: null, metWarm: false }],
    ]);

    when('[t0] the bucket is graded', () => {
      then(
        'it is warm via the prior, a prefix that broke between rounds',
        () => {
          expect(getOneCacheGrade({ runs, ordinals })).toEqual({
            kind: 'warm',
            via: 'prior',
            dir: '/r/a',
          });
        },
      );
    });
  });

  given('[case5] a bucket of three runs, two of them repeats in reach', () => {
    const runs = [
      asRun({ dir: '/r/2026-09-23T10-00-00-000Z.pid1.a' }),
      asRun({ dir: '/r/2026-09-23T12-00-00-000Z.pid1.c' }),
      asRun({ dir: '/r/2026-09-23T11-00-00-000Z.pid1.b' }),
    ];
    const ordinals = asOrdinals([
      [runs[0]!.dir, { ordinal: 1, lapsedMinutes: null, metWarm: false }],
      [runs[1]!.dir, { ordinal: 3, lapsedMinutes: null, metWarm: false }],
      [runs[2]!.dir, { ordinal: 2, lapsedMinutes: null, metWarm: false }],
    ]);

    when('[t0] the bucket is graded', () => {
      then(
        '🔴 it names the latest repeat by mint stamp, the run a driver opens next',
        () => {
          expect(getOneCacheGrade({ runs, ordinals })).toEqual({
            kind: 'warm',
            via: 'prior',
            dir: '/r/2026-09-23T12-00-00-000Z.pid1.c',
          });
        },
      );
    });
  });

  given('[case3] a lane first round that met no warm peer', () => {
    const runs = [asRun({ dir: '/r/a' })];
    const ordinals = asOrdinals([
      ['/r/a', { ordinal: 1, lapsedMinutes: null, metWarm: false }],
    ]);

    when('[t0] the bucket is graded', () => {
      then('it is cold, a first round', () => {
        expect(getOneCacheGrade({ runs, ordinals })).toEqual({
          kind: 'cold',
          cause: 'first',
        });
      });
    });
  });
});
