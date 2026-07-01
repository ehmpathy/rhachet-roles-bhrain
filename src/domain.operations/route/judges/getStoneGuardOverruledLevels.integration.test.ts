import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getStoneGuardOverruledLevels } from './getStoneGuardOverruledLevels';

/**
 * .what = verifies getStoneGuardOverruledLevels reads level-scoped overrules
 * .why = the level partition (and the legacy `all` flag) gate passage; they
 *        must be read correctly from passage.jsonl
 */
describe('getStoneGuardOverruledLevels', () => {
  const genStone = (name: string): RouteStone =>
    new RouteStone({
      name,
      path: `.behavior/test/${name}.stone`,
      guard: null,
    });

  const writePassage = async (input: {
    dir: string;
    rows: object[];
  }): Promise<void> => {
    await fs.mkdir(path.join(input.dir, '.route'), { recursive: true });
    const content = input.rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
    await fs.writeFile(
      path.join(input.dir, '.route', 'passage.jsonl'),
      content,
    );
  };

  given('[case1] no overrule rows', () => {
    const scene = useBeforeAll(async () => {
      const dir = path.join(os.tmpdir(), `overruled-levels-none-${Date.now()}`);
      await writePassage({
        dir,
        rows: [{ stone: '5.exec', status: 'blocked' }],
      });
      return { dir };
    });

    when('[t0] levels are read', () => {
      then('returns empty levels and all=false', async () => {
        const result = await getStoneGuardOverruledLevels({
          stone: genStone('5.exec'),
          route: scene.dir,
        });
        expect([...result.levels]).toEqual([]);
        expect(result.all).toBe(false);
      });
    });
  });

  given('[case2] a single level-scoped overrule', () => {
    const scene = useBeforeAll(async () => {
      const dir = path.join(os.tmpdir(), `overruled-levels-one-${Date.now()}`);
      await writePassage({
        dir,
        rows: [{ stone: '5.exec', status: 'overruled', level: 1 }],
      });
      return { dir };
    });

    when('[t0] levels are read', () => {
      then('returns levels={1} and all=false', async () => {
        const result = await getStoneGuardOverruledLevels({
          stone: genStone('5.exec'),
          route: scene.dir,
        });
        expect([...result.levels].sort()).toEqual([1]);
        expect(result.all).toBe(false);
      });
    });
  });

  given('[case3] multiple level-scoped overrules', () => {
    const scene = useBeforeAll(async () => {
      const dir = path.join(os.tmpdir(), `overruled-levels-many-${Date.now()}`);
      await writePassage({
        dir,
        rows: [
          { stone: '5.exec', status: 'overruled', level: 1 },
          { stone: '5.exec', status: 'overruled', level: 3 },
        ],
      });
      return { dir };
    });

    when('[t0] levels are read', () => {
      then('returns levels={1,3} and all=false', async () => {
        const result = await getStoneGuardOverruledLevels({
          stone: genStone('5.exec'),
          route: scene.dir,
        });
        expect([...result.levels].sort()).toEqual([1, 3]);
        expect(result.all).toBe(false);
      });
    });
  });

  given('[case4] a legacy level-less overrule (backcompat)', () => {
    const scene = useBeforeAll(async () => {
      const dir = path.join(
        os.tmpdir(),
        `overruled-levels-legacy-${Date.now()}`,
      );
      // .note = old (#288) code wrote overrule rows with NO level field
      await writePassage({
        dir,
        rows: [{ stone: '5.exec', status: 'overruled' }],
      });
      return { dir };
    });

    when('[t0] levels are read', () => {
      then('returns all=true (forgives every level)', async () => {
        const result = await getStoneGuardOverruledLevels({
          stone: genStone('5.exec'),
          route: scene.dir,
        });
        expect(result.all).toBe(true);
        expect([...result.levels]).toEqual([]);
      });
    });
  });

  given('[case5] a legacy overrule mixed with leveled overrules', () => {
    const scene = useBeforeAll(async () => {
      const dir = path.join(os.tmpdir(), `overruled-levels-mix-${Date.now()}`);
      await writePassage({
        dir,
        rows: [
          { stone: '5.exec', status: 'overruled' },
          { stone: '5.exec', status: 'overruled', level: 3 },
        ],
      });
      return { dir };
    });

    when('[t0] levels are read', () => {
      then('returns all=true AND levels={3}', async () => {
        const result = await getStoneGuardOverruledLevels({
          stone: genStone('5.exec'),
          route: scene.dir,
        });
        expect(result.all).toBe(true);
        expect([...result.levels].sort()).toEqual([3]);
      });
    });
  });

  given('[case6] rewind after overrule clears it', () => {
    const scene = useBeforeAll(async () => {
      const dir = path.join(
        os.tmpdir(),
        `overruled-levels-rewind-${Date.now()}`,
      );
      await writePassage({
        dir,
        rows: [
          { stone: '5.exec', status: 'overruled', level: 1 },
          { stone: '5.exec', status: 'rewound' },
        ],
      });
      return { dir };
    });

    when('[t0] levels are read after rewind', () => {
      then('returns empty (rewind cleared the overrule)', async () => {
        const result = await getStoneGuardOverruledLevels({
          stone: genStone('5.exec'),
          route: scene.dir,
        });
        expect([...result.levels]).toEqual([]);
        expect(result.all).toBe(false);
      });
    });
  });

  given('[case7] overrules for another stone are excluded', () => {
    const scene = useBeforeAll(async () => {
      const dir = path.join(
        os.tmpdir(),
        `overruled-levels-other-${Date.now()}`,
      );
      await writePassage({
        dir,
        rows: [
          { stone: '9.other', status: 'overruled', level: 2 },
          { stone: '5.exec', status: 'overruled', level: 1 },
        ],
      });
      return { dir };
    });

    when('[t0] levels are read for 5.exec', () => {
      then('returns only 5.exec overrules, not 9.other', async () => {
        const result = await getStoneGuardOverruledLevels({
          stone: genStone('5.exec'),
          route: scene.dir,
        });
        expect([...result.levels].sort()).toEqual([1]);
        expect(result.all).toBe(false);
      });
    });
  });
});
