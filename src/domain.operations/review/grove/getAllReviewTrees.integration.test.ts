import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { DIR_OF_REVIEW_LOGS } from '@src/domain.operations/review/asReviewLogsDir';
import { getAllReviewTrees } from '@src/domain.operations/review/grove/getAllReviewTrees';

/**
 * .what = seeds one tree under a grove root, with or without a review log root
 * .why = the walker's contract is with the directories on disk, so the fixture must
 *        be shaped like a real worktree root — some trees reviewed, some never did
 */
const setOneTree = async (input: {
  root: string;
  name: string;
  reviewed: boolean;
}): Promise<void> => {
  const dir = path.join(input.root, input.name);
  await fs.mkdir(dir, { recursive: true });
  if (input.reviewed)
    await fs.mkdir(path.join(dir, DIR_OF_REVIEW_LOGS), { recursive: true });
};

/**
 * .what = integration tests for the grove tree walk over a real dir tree on disk
 * .why = the walker reads the filesystem, which is a remote boundary — so this is an
 *        integration test, never a unit one (rule.forbid.unit.remote-boundaries).
 *        no mocks: the grove root is real directories in a temp dir.
 */
describe('getAllReviewTrees.integration', () => {
  given('[case1] a grove root where only some trees ever reviewed', () => {
    const scene = useBeforeAll(async () => {
      const root = path.join(
        os.tmpdir(),
        `int-review-trees-${Date.now()}-${process.pid}`,
      );
      await fs.mkdir(root, { recursive: true });

      await setOneTree({ root, name: 'repo.beav.feat-alpha', reviewed: true });
      await setOneTree({ root, name: 'repo.beav.feat-bravo', reviewed: false });
      await setOneTree({
        root,
        name: 'repo.beav.feat-charlie',
        reviewed: true,
      });

      // a loose file beside the trees — a readme, a lockfile, a stray log
      await fs.writeFile(path.join(root, 'notes.md'), '# not a tree', 'utf-8');

      return { root, trees: await getAllReviewTrees({ root }) };
    });

    when('[t0] the root is walked', () => {
      then('a tree that never reviewed is REPORTED, never dropped', () => {
        // the central law: the count of trees that never reviewed is itself an
        // answer — it says how much of the grove the sample covers. to omit them
        // would let a 3-of-3 sample read exactly like a 3-of-300 one
        // (rule.forbid.failhide).
        expect(scene.trees).toHaveLength(3);
        const unreviewed = scene.trees.find(
          (tree) => tree.name === 'repo.beav.feat-bravo',
        );
        expect(unreviewed?.present).toEqual(false);
      });

      then('a tree that carries a log root is marked present', () => {
        const reviewed = scene.trees.filter((tree) => tree.present);
        expect(reviewed.map((tree) => tree.name)).toEqual([
          'repo.beav.feat-alpha',
          'repo.beav.feat-charlie',
        ]);
      });

      then('a loose file beside the trees is not walked as one', () => {
        expect(scene.trees.map((tree) => tree.name)).not.toContain('notes.md');
      });

      then('each tree carries the log root it was checked for', () => {
        const alpha = scene.trees.find(
          (tree) => tree.name === 'repo.beav.feat-alpha',
        );
        expect(alpha?.dir).toEqual(
          path.join(scene.root, 'repo.beav.feat-alpha'),
        );
        expect(alpha?.root).toEqual(
          path.join(scene.root, 'repo.beav.feat-alpha', DIR_OF_REVIEW_LOGS),
        );
      });

      then('the walk is ordered by name, so a report is stable', () => {
        expect(scene.trees.map((tree) => tree.name)).toEqual([
          'repo.beav.feat-alpha',
          'repo.beav.feat-bravo',
          'repo.beav.feat-charlie',
        ]);
      });
    });
  });

  given('[case2] a grove root that holds no trees at all', () => {
    when('[t0] the root is walked', () => {
      then('it answers an empty grove rather than a throw', async () => {
        const root = path.join(
          os.tmpdir(),
          `int-review-trees-bare-${Date.now()}-${process.pid}`,
        );
        await fs.mkdir(root, { recursive: true });
        expect(await getAllReviewTrees({ root })).toEqual([]);
      });
    });
  });

  given('[case3] a root that does not exist on this machine', () => {
    when('[t0] the root is walked', () => {
      then('it answers empty, so a bad --at is not a crash', async () => {
        const root = path.join(
          os.tmpdir(),
          `int-review-trees-absent-${Date.now()}-${process.pid}`,
        );
        expect(await getAllReviewTrees({ root })).toEqual([]);
      });
    });
  });
});
