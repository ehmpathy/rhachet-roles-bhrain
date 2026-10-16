import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { DIR_OF_REVIEW_LOGS } from '@src/domain.operations/review/asReviewLogsDir';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import { getOneReviewRunMeterAt } from '@src/domain.operations/review/meter/getOneReviewRunMeterAt';
import { getOneTargetSplitOfRunMeter } from '@src/domain.operations/review/meter/getOneTargetSplitOfRunMeter';

const NAME_OF_RUN = '2026-10-08T00-00-00-000Z.pid1.aaa';

/**
 * .what = a git tree whose only review run was refused at the overflow gate
 * .why = such a run writes its scope and no prompt, which is the one state a split
 *        is re-derived for. the target body sits in the tree, so the split can
 *        measure it
 */
const genOneTreeWithRefusedRun = async (input: {
  slug: string;
}): Promise<{ tree: string; dir: string }> => {
  const tree = genTempDir({ slug: input.slug, git: true });
  await fs.mkdir(path.join(tree, 'src'), { recursive: true });
  await fs.writeFile(path.join(tree, 'src', 'a.ts'), 'x'.repeat(1_200));

  const dir = path.join(tree, DIR_OF_REVIEW_LOGS, NAME_OF_RUN);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, 'input.args.json'),
    JSON.stringify({ args: { focus: 'push' }, scope: {} }),
  );
  await fs.writeFile(
    asRunArtifactPath({ dir, artifact: 'scope' }),
    JSON.stringify({ targetFiles: ['src/a.ts'] }),
  );
  await fs.writeFile(
    asRunArtifactPath({ dir, artifact: 'scopeDebug' }),
    JSON.stringify({ args: { focus: 'push' } }),
  );
  return { tree, dir };
};

/**
 * .what = meters the run the path names, then reads its split
 * .why = the path is all that varies between the forms a human types
 */
const getOneSplitVia = async (input: { at: string }) => {
  const { run } = await getOneReviewRunMeterAt({
    at: input.at,
    withLocus: true,
  });
  if (run === null)
    throw new UnexpectedCodePathError('no run metered at the path', {
      at: input.at,
    });
  return await getOneTargetSplitOfRunMeter({ run });
};

/**
 * .what = integration tests for the split a refused run reports
 * .why = it reads the filesystem and git, so it is an integration test. no mocks
 */
describe('getOneTargetSplitOfRunMeter', () => {
  given(
    '[case1] a tree whose latest run was refused at the overflow gate',
    () => {
      const scene = useBeforeAll(async () =>
        genOneTreeWithRefusedRun({ slug: 'split-of-meter-refused' }),
      );

      when('[t0] the run is metered via its TREE, and via its own DIR', () => {
        const splits = useBeforeAll(async () => ({
          viaTree: await getOneSplitVia({ at: scene.tree }),
          viaDir: await getOneSplitVia({ at: scene.dir }),
        }));

        then('🔴 the tree form yields a split — not null', () => {
          expect(splits.viaTree).not.toEqual(null);
          expect(splits.viaTree?.targetsRecorded).toEqual(1);
          expect(splits.viaTree?.locus.targetFiles).toEqual([
            { path: 'src/a.ts', chars: expect.any(Number) },
          ]);
        });

        then('🔴 the tree form and the dir form yield the SAME split', () => {
          expect(splits.viaTree).toEqual(splits.viaDir);
        });
      });
    },
  );

  given('[case2] a run that compiled a prompt', () => {
    const scene = useBeforeAll(async () => {
      const made = await genOneTreeWithRefusedRun({
        slug: 'split-of-meter-compiled',
      });
      // a prompt the census can read — a bare title carries no section markers,
      // so it would read as no prompt at all and the case would prove naught
      await fs.writeFile(
        path.join(made.dir, 'input.prompt.md'),
        '<rules>r</rules><target><target.file path="src/a.ts">F</target.file></target>',
      );
      return made;
    });

    when('[t0] its split is asked for', () => {
      then('it is null — the run carries its own census', async () => {
        expect(await getOneSplitVia({ at: scene.tree })).toEqual(null);
      });
    });
  });
});
