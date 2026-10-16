import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { asReviewLogsDir } from '@src/domain.operations/review/asReviewLogsDir';
import { getOneReviewedTreeAtOrAbove } from '@src/domain.operations/review/getOneReviewedTreeAtOrAbove';

/**
 * .what = integration tests for the reviewed-tree lookup that counts the dir itself
 * .why = the empty-grove hint names the tree a sub-dir sat inside of; over real dirs,
 *        the dir itself must count, an ancestor must be found, and a gone dir is null
 */
describe('getOneReviewedTreeAtOrAbove.integration', () => {
  const scene = useBeforeAll(async () => {
    const base = path.join(
      os.tmpdir(),
      `int-reviewed-tree-at-or-above-${Date.now()}-${process.pid}`,
    );
    await fs.mkdir(base, { recursive: true });
    const baseReal = await fs.realpath(base);
    const tree = path.join(baseReal, 'tree');
    await fs.mkdir(asReviewLogsDir({ cwd: tree }), { recursive: true });
    await fs.mkdir(path.join(tree, 'src', 'deep'), { recursive: true });
    return { base: baseReal, tree };
  });

  afterAll(async () => {
    await fs.rm(scene.base, { recursive: true, force: true });
  });

  given('[case1] a dir that IS a reviewed tree', () => {
    when('[t0] it is looked up', () => {
      then('it answers the dir itself', async () => {
        expect(await getOneReviewedTreeAtOrAbove({ at: scene.tree })).toEqual(
          scene.tree,
        );
      });
    });
  });

  given('[case2] a dir inside a reviewed tree', () => {
    when('[t0] it is looked up', () => {
      then('it answers the tree above', async () => {
        expect(
          await getOneReviewedTreeAtOrAbove({
            at: path.join(scene.tree, 'src', 'deep'),
          }),
        ).toEqual(scene.tree);
      });
    });
  });

  given('[case3] a dir that is gone', () => {
    when('[t0] it is looked up', () => {
      then('it answers null, never a raw ENOENT', async () => {
        expect(
          await getOneReviewedTreeAtOrAbove({
            at: path.join(scene.base, 'absent'),
          }),
        ).toBeNull();
      });
    });
  });
});
