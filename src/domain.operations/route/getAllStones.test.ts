import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getAllStones } from './getAllStones';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

describe('getAllStones', () => {
  given('[case1] route.simple fixture', () => {
    const routePath = path.join(ASSETS_DIR, 'route.simple');

    when('[t0] stones are enumerated', () => {
      then('returns 3 stones sorted alphanumerically', async () => {
        const stones = await getAllStones({ route: routePath });
        expect(stones).toHaveLength(3);
        expect(stones[0]?.name).toEqual('1.vision');
        expect(stones[1]?.name).toEqual('2.criteria');
        expect(stones[2]?.name).toEqual('3.plan');
      });

      then('each stone has null guard', async () => {
        const stones = await getAllStones({ route: routePath });
        for (const stone of stones) {
          expect(stone.guard).toBeNull();
        }
      });
    });
  });

  given('[case2] route.guarded fixture', () => {
    const routePath = path.join(ASSETS_DIR, 'route.guarded');

    when('[t0] stones are enumerated', () => {
      then('returns 2 stones with guards', async () => {
        const stones = await getAllStones({ route: routePath });
        expect(stones).toHaveLength(2);
        expect(stones[0]?.name).toEqual('1.vision');
        expect(stones[1]?.name).toEqual('5.implement');
      });

      then('each stone has guard populated', async () => {
        const stones = await getAllStones({ route: routePath });
        expect(stones[0]?.guard).not.toBeNull();
        expect(stones[1]?.guard).not.toBeNull();
      });
    });
  });

  given('[case3] route.parallel fixture', () => {
    const routePath = path.join(ASSETS_DIR, 'route.parallel');

    when('[t0] stones are enumerated', () => {
      then('returns 5 stones sorted alphanumerically', async () => {
        const stones = await getAllStones({ route: routePath });
        expect(stones).toHaveLength(5);
        expect(stones[0]?.name).toEqual('2.criteria');
        expect(stones[1]?.name).toEqual('3.1.research.domain');
        expect(stones[2]?.name).toEqual('3.1.research.prior');
        expect(stones[3]?.name).toEqual('3.1.research.template');
        expect(stones[4]?.name).toEqual('3.2.plan');
      });
    });
  });

  given('[case4] route.alternate fixture', () => {
    const routePath = path.join(ASSETS_DIR, 'route.alternate');

    when('[t0] stones are enumerated', () => {
      then('recognizes .src.stone extension', async () => {
        const stones = await getAllStones({ route: routePath });
        const visionStone = stones.find((s) => s.name === '1.vision');
        expect(visionStone).toBeDefined();
        expect(visionStone?.path).toContain('.src.stone');
      });

      then('recognizes .src extension', async () => {
        const stones = await getAllStones({ route: routePath });
        const criteriaStone = stones.find((s) => s.name === '2.criteria');
        expect(criteriaStone).toBeDefined();
        expect(criteriaStone?.path).toContain('.src');
      });

      then('recognizes .src.guard extension', async () => {
        const stones = await getAllStones({ route: routePath });
        const visionStone = stones.find((s) => s.name === '1.vision');
        expect(visionStone?.guard).not.toBeNull();
        expect(visionStone?.guard?.path).toContain('.src.guard');
      });

      then('recognizes .stone.guard extension', async () => {
        const stones = await getAllStones({ route: routePath });
        const criteriaStone = stones.find((s) => s.name === '2.criteria');
        expect(criteriaStone?.guard).not.toBeNull();
        expect(criteriaStone?.guard?.path).toContain('.stone.guard');
      });
    });
  });
});
