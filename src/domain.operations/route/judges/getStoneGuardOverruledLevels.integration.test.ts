import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { JUDGE_LEVEL } from '../guard/review/peer/meter/JUDGE_LEVEL';
import { getStoneGuardOverruledLevels } from './getStoneGuardOverruledLevels';

/**
 * .what = verifies getStoneGuardOverruledLevels reads level-scoped overrules
 * .why = the level partition gates passage; it must be read correctly from passage.jsonl. the
 *        judge is the top rung (JUDGE_LEVEL), and a legacy level-less record maps to it.
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
      then('returns an empty set', async () => {
        const result = await getStoneGuardOverruledLevels({
          stone: genStone('5.exec'),
          route: scene.dir,
        });
        expect([...result]).toEqual([]);
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
      then('returns {1}', async () => {
        const result = await getStoneGuardOverruledLevels({
          stone: genStone('5.exec'),
          route: scene.dir,
        });
        expect([...result].sort((a, b) => a - b)).toEqual([1]);
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
      then('returns {1,3}', async () => {
        const result = await getStoneGuardOverruledLevels({
          stone: genStone('5.exec'),
          route: scene.dir,
        });
        expect([...result].sort((a, b) => a - b)).toEqual([1, 3]);
      });
    });
  });

  given('[case4] a legacy level-less overrule (backcompat)', () => {
    const scene = useBeforeAll(async () => {
      const dir = path.join(
        os.tmpdir(),
        `overruled-levels-legacy-${Date.now()}`,
      );
      // .note = old (#288) code wrote overrule rows with NO level field; under the top-rung
      //         model such a record maps to the judge rung (JUDGE_LEVEL) — forgives the judge
      //         only, never the peer levels below it
      await writePassage({
        dir,
        rows: [{ stone: '5.exec', status: 'overruled' }],
      });
      return { dir };
    });

    when('[t0] levels are read', () => {
      then('returns {JUDGE_LEVEL} — the judge rung only', async () => {
        const result = await getStoneGuardOverruledLevels({
          stone: genStone('5.exec'),
          route: scene.dir,
        });
        expect([...result]).toEqual([JUDGE_LEVEL]);
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
      then(
        'returns {3, JUDGE_LEVEL} — level 3 plus the judge rung',
        async () => {
          const result = await getStoneGuardOverruledLevels({
            stone: genStone('5.exec'),
            route: scene.dir,
          });
          expect([...result].sort((a, b) => a - b)).toEqual([3, JUDGE_LEVEL]);
        },
      );
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
        expect([...result]).toEqual([]);
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
        expect([...result].sort((a, b) => a - b)).toEqual([1]);
      });
    });
  });
});
