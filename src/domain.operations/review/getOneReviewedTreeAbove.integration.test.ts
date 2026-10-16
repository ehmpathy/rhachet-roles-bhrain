import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { asReviewLogsDir } from '@src/domain.operations/review/asReviewLogsDir';
import { getOneReviewedTreeAbove } from '@src/domain.operations/review/getOneReviewedTreeAbove';

/**
 * .what = integration tests for the reviewed-tree lookup that starts one level up
 * .why = 🔴 CLAMP. the walk must climb the REAL path, as its twin does: a symlinked cwd's
 *        lexical parents lead into whichever tree holds the link, which is not its ancestor
 */
describe('getOneReviewedTreeAbove.integration', () => {
  const scene = useBeforeAll(async () => {
    const base = path.join(
      os.tmpdir(),
      `int-reviewed-tree-above-${Date.now()}-${process.pid}`,
    );
    await fs.mkdir(base, { recursive: true });
    const baseReal = await fs.realpath(base);

    // a reviewed tree, with a sub-dir inside it
    const tree = path.join(baseReal, 'tree');
    await fs.mkdir(asReviewLogsDir({ cwd: tree }), { recursive: true });
    await fs.mkdir(path.join(tree, 'src'), { recursive: true });

    // an unreviewed dir elsewhere, which holds a link into the tree's sub-dir
    const elsewhere = path.join(baseReal, 'elsewhere');
    await fs.mkdir(elsewhere, { recursive: true });
    const link = path.join(elsewhere, 'link');
    await fs.symlink(path.join(tree, 'src'), link);
    return { base: baseReal, tree, link };
  });

  afterAll(async () => {
    await fs.rm(scene.base, { recursive: true, force: true });
  });

  given('[case1] a dir inside a reviewed tree', () => {
    when('[t0] it is looked up', () => {
      then('it answers the tree above', async () => {
        expect(
          await getOneReviewedTreeAbove({ cwd: path.join(scene.tree, 'src') }),
        ).toEqual(scene.tree);
      });
    });
  });

  given('[case2] a symlink, outside the tree, to a dir inside it', () => {
    when('[t0] it is looked up', () => {
      then('🔴 it climbs the real path, and answers the tree', async () => {
        expect(await getOneReviewedTreeAbove({ cwd: scene.link })).toEqual(
          scene.tree,
        );
      });
    });
  });

  given('[case3] a dir that is gone', () => {
    when('[t0] it is looked up', () => {
      then('it answers null, never a raw ENOENT', async () => {
        expect(
          await getOneReviewedTreeAbove({
            cwd: path.join(scene.base, 'absent'),
          }),
        ).toEqual(null);
      });
    });
  });
});
