import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getOneStoneByName } from './getOneStoneByName';

/**
 * .what = pins the miss value of the route-snapshot lookup
 * .why = the whole reason this left the orchestrator is that `.find(...) ?? null` made a
 *        reader simulate two operations to learn one fact. the ONE behavior worth a test is
 *        the half `.find` gets wrong on its own: a miss must be `null`, never `undefined`
 */
describe('getOneStoneByName', () => {
  const stones = [
    new RouteStone({ name: '1', path: '/r/1.stone', guard: null }),
    new RouteStone({ name: '2', path: '/r/2.stone', guard: null }),
  ];

  given('[case1] a snapshot that holds the name', () => {
    when('[t0] it is looked up', () => {
      then('it returns that stone', () => {
        expect(getOneStoneByName({ stones, name: '2' })?.path).toEqual(
          '/r/2.stone',
        );
      });
    });
  });

  given('[case2] a snapshot that does NOT hold the name', () => {
    when('[t0] it is looked up', () => {
      then('it returns NULL, never undefined', () => {
        // 🔴 .why the assert is strict = `.find` yields `undefined` on a miss, and the
        //    callers feed a `| null` seam. `toBeFalsy` would pass on either, so it would
        //    prove the one property this operation exists to add
        expect(getOneStoneByName({ stones, name: '9' })).toEqual(null);
      });
    });
  });

  given('[case3] an empty snapshot', () => {
    when('[t0] any name is looked up', () => {
      then('it returns null', () => {
        expect(getOneStoneByName({ stones: [], name: '1' })).toEqual(null);
      });
    });
  });
});
