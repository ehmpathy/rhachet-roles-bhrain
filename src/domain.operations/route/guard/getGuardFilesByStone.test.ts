import { given, then, when } from 'test-fns';

import { getGuardFilesByStone } from './getGuardFilesByStone';

describe('getGuardFilesByStone', () => {
  const files = [
    '.behavior/x/5.1.execution.guard',
    '.behavior/x/5.1.extra.guard',
    '.behavior/x/5.10.other.guard',
    '.behavior/x/1.vision.guard',
  ];

  given('[case1] a prefix stone that has dotted children', () => {
    when('[t0] filtered by 5.1', () => {
      then('selects every 5.1.* guard', () => {
        expect(
          getGuardFilesByStone({ guardFiles: files, stone: '5.1' }),
        ).toEqual([
          '.behavior/x/5.1.execution.guard',
          '.behavior/x/5.1.extra.guard',
        ]);
      });

      then('does NOT sweep in the lookalike-numeric 5.10', () => {
        const hits = getGuardFilesByStone({
          guardFiles: files,
          stone: '5.1',
        });
        expect(hits).not.toContain('.behavior/x/5.10.other.guard');
      });
    });
  });

  given('[case2] an exact full stone name', () => {
    when('[t0] filtered by 5.1.execution', () => {
      then('selects exactly that guard', () => {
        expect(
          getGuardFilesByStone({
            guardFiles: files,
            stone: '5.1.execution',
          }),
        ).toEqual(['.behavior/x/5.1.execution.guard']);
      });
    });
  });

  given('[case3] the lookalike-numeric stone itself', () => {
    when('[t0] filtered by 5.10', () => {
      then('selects only the 5.10 guard, not 5.1.*', () => {
        expect(
          getGuardFilesByStone({ guardFiles: files, stone: '5.10' }),
        ).toEqual(['.behavior/x/5.10.other.guard']);
      });
    });
  });

  given('[case4] a stone with no match', () => {
    when('[t0] filtered by 9.absent', () => {
      then('returns []', () => {
        expect(
          getGuardFilesByStone({ guardFiles: files, stone: '9.absent' }),
        ).toEqual([]);
      });
    });
  });
});
