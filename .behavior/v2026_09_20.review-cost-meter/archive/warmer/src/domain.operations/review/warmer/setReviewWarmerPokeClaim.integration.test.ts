import { genTempDir, given, then, useThen, when } from 'test-fns';

import { getOneReviewWarmerRecord } from './getOneReviewWarmerRecord';
import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';
import { setReviewWarmerPokeClaim } from './setReviewWarmerPokeClaim';

const REVIEWER = 'repo-rules';
const PREFIX: ReviewWarmerPrefix = {
  head: 'head-of-test',
  brain: 'test/brain',
};
const PLAN = { pokes: 3, everyMinutes: 15 };
const T0 = new Date('2026-09-24T10:00:00.000Z');

describe('setReviewWarmerPokeClaim', () => {
  given('[case1] four warmers of one prefix that claim at one instant', () => {
    /**
     * .why = the clamp on the hold itself. the check and the write share one short
     *        hold, so of N claims that land together exactly one is granted. without
     *        the hold, each would read "no peer poked" and each would bill a poke
     */
    when('[t0] all four claim concurrently, on one watermark store', () => {
      const claims = useThen('each claim returns', async () => {
        const cwd = genTempDir({ slug: 'warmer-claim-concurrent' });
        return {
          all: await Promise.all(
            [0, 1, 2, 3].map(() =>
              setReviewWarmerPokeClaim({
                cwd,
                reviewer: REVIEWER,
                prefix: PREFIX,
                plan: PLAN,
                now: T0,
              }),
            ),
          ),
        };
      });

      then('🔴 exactly one is granted', () => {
        expect(
          claims.all.filter((claim) => claim.act === 'granted'),
        ).toHaveLength(1);
      });

      then('the rest are denied, and each names the granted instant', () => {
        const denied = claims.all.filter((claim) => claim.act === 'denied');
        expect(denied).toHaveLength(3);
        expect(
          denied.every(
            (claim) =>
              claim.act === 'denied' &&
              claim.pokedAt.getTime() === T0.getTime(),
          ),
        ).toEqual(true);
      });
    });
  });

  given('[case2] a claim one full cadence after the last poke', () => {
    when('[t0] a second claim lands after the window', () => {
      const scene = useThen('both claims return', async () => {
        const cwd = genTempDir({ slug: 'warmer-claim-cadence' });
        const first = await setReviewWarmerPokeClaim({
          cwd,
          reviewer: REVIEWER,
          prefix: PREFIX,
          plan: PLAN,
          now: T0,
        });
        const later = new Date(T0.getTime() + PLAN.everyMinutes * 60_000);
        const second = await setReviewWarmerPokeClaim({
          cwd,
          reviewer: REVIEWER,
          prefix: PREFIX,
          plan: PLAN,
          now: later,
        });
        const record = await getOneReviewWarmerRecord({
          cwd,
          reviewer: REVIEWER,
          prefix: PREFIX,
        });
        return { first, second, later, record };
      });

      then(
        'both are granted — the window bounds a duplicate, never a cadence',
        () => {
          expect(scene.first.act).toEqual('granted');
          expect(scene.second.act).toEqual('granted');
        },
      );

      then('the watermark holds the later poke', () => {
        expect(scene.record?.pokedAt).toEqual(scene.later.toISOString());
      });
    });
  });
});
