import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { getAllTargetsByPolluterVerdict } from '@src/domain.operations/getAllTargetsByPolluterVerdict';
import { getAllFilePathsFromRange } from '@src/domain.operations/git/getAllFilePathsFromRange';

import { getAllStoneGuardReviewTargetPaths } from './getAllStoneGuardReviewTargetPaths';

describe('getAllStoneGuardReviewTargetPaths', () => {
  given(
    '[case1] a branch with a new source file beside two scope polluters',
    () => {
      // left untracked on purpose — the since-main set unions untracked files
      const repoRoot = genTempDir({ slug: 'guard-target-paths', git: true });
      fs.writeFileSync(
        path.join(repoRoot, 'fresh.ts'),
        'export const c = 1;\n',
      );
      fs.writeFileSync(path.join(repoRoot, 'pnpm-lock.yaml'), 'lockfile\n');
      fs.mkdirSync(path.join(repoRoot, '.dream'), { recursive: true });
      fs.writeFileSync(path.join(repoRoot, '.dream', 'idea.md'), '# idea\n');

      when('[t0] the target paths are read', () => {
        // wrapped in an object, since the shared result is a proxy over an object
        const result = useThen('the read completes', async () => ({
          paths: await getAllStoneGuardReviewTargetPaths({ repoRoot }),
        }));

        then('the new source file is a target', () => {
          expect(result.paths.includes('fresh.ts')).toEqual(true);
        });

        then('the polluters are not targets', () => {
          expect(result.paths.includes('pnpm-lock.yaml')).toEqual(false);
          expect(result.paths.includes('.dream/idea.md')).toEqual(false);
        });

        // 🔴 i014 r006 blocker.1 — the composer once filtered with an inline negated predicate
        //    beside the shared verdict `rhx review` applies. the verdict has one home, so a lane
        //    with no computed scope keeps exactly what the shared verdict keeps
        then(
          'the targets equal what the one shared verdict keeps',
          async () => {
            const pathsAll = await getAllFilePathsFromRange({
              range: 'since-main',
              cwd: repoRoot,
            });
            const verdict = getAllTargetsByPolluterVerdict({
              targets: pathsAll,
              globs: [],
              mode: 'drop',
            });
            expect(verdict.dropped.length).toEqual(2);
            expect(result.paths.join('\n')).toEqual(verdict.kept.join('\n'));
          },
        );
      });
    },
  );
});
