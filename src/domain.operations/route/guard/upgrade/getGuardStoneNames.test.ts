import { given, then, when } from 'test-fns';

import { getGuardStoneNames } from './getGuardStoneNames';

describe('getGuardStoneNames', () => {
  given('[case1] a set of guard paths', () => {
    when('[t0] mapped to stone names', () => {
      then('strips the dir and the .guard extension', () => {
        expect(
          getGuardStoneNames({
            guardPaths: [
              '.behavior/x/5.1.execution.guard',
              '.behavior/x/1.vision.guard',
            ],
          }),
        ).toEqual(['5.1.execution', '1.vision']);
      });
    });
  });

  given('[case2] an empty set', () => {
    when('[t0] mapped', () => {
      then('returns []', () => {
        expect(getGuardStoneNames({ guardPaths: [] })).toEqual([]);
      });
    });
  });
});
