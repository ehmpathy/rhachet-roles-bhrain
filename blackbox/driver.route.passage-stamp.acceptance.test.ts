import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-passage-stamp');

/**
 * .what = acceptance test that proves the guard writes a passage stamp file
 * .why = verifies that when a stone passes with peer reviews, the final
 *        reviewer report is stamped into a {stone}.stamp file at the route root
 *
 * scenario:
 *   - guard has a peer review that approves (0 blockers, 0 nitpicks)
 *   - when driver passes the stone, the guard runs reviews + judge
 *   - the reviewer report stdout is stamped into 1.execute.stamp
 *   - the stamp sits next to .guard / .stone / .yield files
 */
describe('driver.route.passage-stamp.acceptance', () => {
  given('[stamp-test] guard with peer review that approves', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'passage-stamp',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // make mock review executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] artifact created', () => {
      const result = useThen('artifact is written', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '1.execute.md'),
          '# execute\n\nthis is the artifact content.',
        );
        await execAsync('chmod +x .test/mock-review-blocker.sh', {
          cwd: scene.tempDir,
        });
        return { created: true };
      });

      then('artifact exists', () => {
        expect(result.created).toBe(true);
      });
    });

    when('[t1] driver passes the stone', () => {
      const result = useThen('guard runs review + judge', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (passage allowed)', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms passage', () => {
        expect(result.stdout).toContain('passage = allowed');
      });
    });

    when('[t2] passage stamp file was written', () => {
      const result = useThen('stamp file exists', async () => {
        const stampPath = path.join(scene.tempDir, '1.execute.stamp');
        const content = await fs.readFile(stampPath, 'utf-8');
        return { content };
      });

      then('stamp contains the guard report', () => {
        expect(result.content).toContain('route.stone.set');
        expect(result.content).toContain('mock-stamp');
        expect(result.content).toContain('passage = allowed');
      });

      then('stamp content matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.content)).toMatchSnapshot();
      });
    });

    when('[t3] stamp sits next to guard artifacts', () => {
      const result = useThen('list route root files', async () => {
        const files = await fs.readdir(scene.tempDir);
        return { files };
      });

      then('stamp coexists with stone and guard', () => {
        expect(result.files).toContain('1.execute.stamp');
        expect(result.files).toContain('1.execute.stone');
        expect(result.files).toContain('1.execute.guard');
      });
    });
  });

  given('[block-test] guard with peer review that rejects', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'passage-stamp-block',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // make the rejector mock review executable
      await execAsync('chmod +x .test/mock-review-blocker.sh', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] artifact created', () => {
      const result = useThen('artifact is written', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '2.block.md'),
          '# block\n\nthis is the artifact content.',
        );
        return { created: true };
      });

      then('artifact exists', () => {
        expect(result.created).toBe(true);
      });
    });

    when('[t1] driver tries to pass the stone', () => {
      const result = useThen('guard runs review + judge', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.block', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (passage blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('stdout confirms the block', () => {
        expect(result.stdout).toContain('passage = blocked');
      });
    });

    when('[t2] blocked-passage stamp file was written', () => {
      const result = useThen('stamp file exists', async () => {
        const stampPath = path.join(scene.tempDir, '2.block.stamp');
        const content = await fs.readFile(stampPath, 'utf-8');
        return { content };
      });

      then('stamp records the blocked passage', () => {
        expect(result.content).toContain('route.stone.set');
        expect(result.content).toContain('mock-blocker');
        expect(result.content).toContain('passage = blocked');
      });

      then('stamp appends judge detail under the box-draw divider', () => {
        expect(result.content).toContain('─'.repeat(64));
        expect(result.content).toContain('🪶 judge 1');
      });

      then('stamp content matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.content)).toMatchSnapshot();
      });
    });
  });
});
