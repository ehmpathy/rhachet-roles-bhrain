import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, usePrep, useThen, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { rewindAffectedStones } from './rewindAffectedStones';

/**
 * .what = a temp route with two stones: one that holds a yield, one that holds none
 * .why = the rewind reports a different yield outcome per (mode × presence) cell, and each
 *        cell is a distinct early return of the per-stone yield act (r009 nitpick.4, i013)
 */
const genRouteWithYields = async (input: { slug: string }) => {
  const route = genTempDir({ slug: input.slug });
  await fs.writeFile(path.join(route, '1.vision.stone'), '# vision');
  await fs.writeFile(path.join(route, '1.vision.yield.md'), '# vision yield');
  await fs.writeFile(path.join(route, '2.criteria.stone'), '# criteria');
  const stones = [
    new RouteStone({
      name: '1.vision',
      path: path.join(route, '1.vision.stone'),
      guard: null,
    }),
    new RouteStone({
      name: '2.criteria',
      path: path.join(route, '2.criteria.stone'),
      guard: null,
    }),
  ];
  return { route, stones };
};

describe('rewindAffectedStones', () => {
  given('[case1] yield mode keep', () => {
    const scene = usePrep(async () =>
      genRouteWithYields({ slug: 'rewind-affected-keep' }),
    );

    when('[t0] both stones are rewound', () => {
      const result = useThen('the rewind succeeds', async () =>
        rewindAffectedStones({
          affectedStones: scene.stones,
          route: scene.route,
          yieldMode: 'keep',
        }),
      );

      then('a stone with a yield reports it preserved', () => {
        expect(result.cascade[0]?.yield).toEqual('preserved');
      });

      then('a stone with no yield reports it absent', () => {
        expect(result.cascade[1]?.yield).toEqual('absent');
      });

      then('the yield file stays in place', async () => {
        const stat = await fs.stat(path.join(scene.route, '1.vision.yield.md'));
        expect(stat.isFile()).toBe(true);
      });
    });
  });

  given('[case2] yield mode drop', () => {
    const scene = usePrep(async () =>
      genRouteWithYields({ slug: 'rewind-affected-drop' }),
    );

    when('[t0] both stones are rewound', () => {
      const result = useThen('the rewind succeeds', async () =>
        rewindAffectedStones({
          affectedStones: scene.stones,
          route: scene.route,
          yieldMode: 'drop',
        }),
      );

      then('a stone with a yield reports it archived', () => {
        expect(result.cascade[0]?.yield).toEqual('archived');
      });

      then('a stone with no yield reports it absent', () => {
        expect(result.cascade[1]?.yield).toEqual('absent');
      });
    });
  });
});
