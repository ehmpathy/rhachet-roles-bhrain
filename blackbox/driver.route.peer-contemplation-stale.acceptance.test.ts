import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-contemplation');

/**
 * .what = acceptance test for hash-scoped contemplation (usecase 8)
 * .why = a .taken pairs to a .given by the FULL key incl the content hash;
 *        when the stone artifact changes, the guard re-runs the reviewer at a
 *        new hash, and the prior .taken must go STALE — the driver cannot
 *        recycle an old reply to satisfy a fresh critique
 *
 * scenario (no --conversation reviewer in the mix — pure gate staleness):
 *   - round 1: architect raises a blocker, driver contemplates, stone passes
 *   - artifact changes → new hash → architect re-raises at the new hash
 *   - the old .taken is stale → the stone blocks again for a fresh contemplation
 */
describe('driver.route.peer-contemplation-stale.acceptance', () => {
  given('[case1] a contemplated stone whose artifact then changes', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-contemplation-stale',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-blocker.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-clean.sh', { cwd: tempDir });
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review — round one.\n',
      );
      return { tempDir };
    });

    // helper: pair architect's current given → its taken, write the response
    const writeArchitectTaken = async (tempDir: string): Promise<string> => {
      const reviewsDir = path.join(tempDir, '.reviews', 'peer');
      const files = await fs.readdir(reviewsDir);
      const givenName = files.find(
        (f) =>
          f.includes('_.given.by_peer.architect.md') &&
          !f.endsWith('.report.md') &&
          // pick the one WITHOUT a paired taken yet
          !files.includes(
            f.replace('._.given.by_peer.', '._.taken.by_self.'),
          ),
      )!;
      const takenName = givenName.replace(
        '._.given.by_peer.',
        '._.taken.by_self.',
      );
      await fs.writeFile(
        path.join(reviewsDir, takenName),
        '# taken\n\nfixed via a bounded context.\n',
      );
      return takenName;
    };

    when('[t0] round 1: driver contemplates architect, stone passes', () => {
      const result = useThen('round 1 progresses', async () => {
        // trigger the reviews
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        // write architect's taken, contemplate, then pass
        await writeArchitectTaken(scene.tempDir);
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.execute',
            route: '.',
            as: 'contemplated',
            that: 'architect',
          },
          cwd: scene.tempDir,
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('round 1 is allowed passage', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] the artifact changes (new content hash)', () => {
      const result = useThen('the stone blocks on a stale contemplation', async () => {
        // change the artifact → the guard re-runs architect at a NEW hash
        await fs.writeFile(
          path.join(scene.tempDir, '1.execute.md'),
          '# execute\n\nthe work under review — round two, edited.\n',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('the stone is blocked again (exit 2)', () => {
        expect(result.code).toEqual(2);
      });

      then('architect must be re-contemplated for the new iteration', () => {
        expect(result.stdout).toContain('the reviewers await your reply');
        expect(result.stdout).toContain('architect');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] driver writes a FRESH .taken for the new hash', () => {
      const result = useThen('the stone progresses again', async () => {
        await writeArchitectTaken(scene.tempDir);
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.execute',
            route: '.',
            as: 'contemplated',
            that: 'architect',
          },
          cwd: scene.tempDir,
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('the fresh contemplation clears the gate (exit 0)', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
