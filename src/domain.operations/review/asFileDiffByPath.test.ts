import { given, then, when } from 'test-fns';

import type { FileDiff } from '@src/domain.operations/git/getAllFileDiffsFromRange';

import { asFileDiffByPath } from './asFileDiffByPath';
import { asPathsOfFileDiffs } from './asPathsOfFileDiffs';

const genDiff = (input: {
  path: string;
  changeKind: FileDiff['changeKind'];
}): FileDiff => ({
  path: input.path,
  diff: `--- a/${input.path}\n+++ b/${input.path}\n`,
  changeKind: input.changeKind,
});

describe('asFileDiffByPath', () => {
  given('[case1] the diff list is empty', () => {
    when('[t0] the lookup is cast', () => {
      then('it holds no entry', () => {
        expect(asFileDiffByPath({ of: [] }).size).toEqual(0);
      });

      then('and the path projection is empty too', () => {
        expect(asPathsOfFileDiffs({ of: [] })).toEqual([]);
      });
    });
  });

  given('[case2] three diffs of three change kinds', () => {
    const diffs = [
      genDiff({ path: 'src/a.ts', changeKind: 'new' }),
      genDiff({ path: 'src/b.ts', changeKind: 'edited' }),
      genDiff({ path: 'src/c.ts', changeKind: 'deleted' }),
    ];

    when('[t0] the lookup is cast', () => {
      then('every path resolves to its own diff', () => {
        const byPath = asFileDiffByPath({ of: diffs });
        expect(byPath.size).toEqual(3);
        expect(byPath.get('src/a.ts')?.changeKind).toEqual('new');
        expect(byPath.get('src/b.ts')?.changeKind).toEqual('edited');
        expect(byPath.get('src/c.ts')?.changeKind).toEqual('deleted');
      });

      /**
       * a path the walk never saw must answer `undefined`, never a
       * neighbour's diff — `getOneTargetRenderPlan` reads this miss as "no
       * diff for this target" and falls back to content alone, so a wrong
       * answer would render one file's body under another's delta and stay
       * well-formed.
       */
      then('a path outside the walk answers undefined', () => {
        expect(asFileDiffByPath({ of: diffs }).get('src/never.ts')).toEqual(
          undefined,
        );
      });
    });

    when('[t1] the path projection is cast', () => {
      then('it yields the paths in walk order', () => {
        expect(asPathsOfFileDiffs({ of: diffs })).toEqual([
          'src/a.ts',
          'src/b.ts',
          'src/c.ts',
        ]);
      });

      // order is asserted because `getAllTargetsByCacheStability` sorts this
      // list; a reorder would void the shared prefix of every push lane.
      then('and the projection agrees with the lookup keys', () => {
        expect(asPathsOfFileDiffs({ of: diffs })).toEqual([
          ...asFileDiffByPath({ of: diffs }).keys(),
        ]);
      });
    });
  });
});
