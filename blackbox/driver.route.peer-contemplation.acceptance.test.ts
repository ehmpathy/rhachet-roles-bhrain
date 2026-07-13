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
 * .what = acceptance test for the peer-review contemplation gate
 * .why = proves a driver must articulate a .taken response to every peer
 *        critique that holds blockers before the stone may progress; a clean
 *        reviewer needs no response
 *
 * scenario:
 *   - guard has two peer reviewers: architect (1 blocker) + mechanic (clean)
 *   - judge allows 1 blocker, so judges pass and the contemplation gate engages
 *   - the driver is blocked until it writes architect's .taken (mechanic skipped)
 */
describe('driver.route.peer-contemplation.acceptance', () => {
  given('[case1] a stone gated on architect (1 blocker) + mechanic (clean)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-contemplation',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-blocker.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-clean.sh', { cwd: tempDir });

      // write the stone artifact
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review.\n',
      );
      return { tempDir };
    });

    when('[t0] driver attempts --as passed with no .taken', () => {
      const result = useThen('guard runs reviews, blocks on contemplation', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('is blocked (exit 2)', () => {
        expect(result.code).toEqual(2);
      });

      then('the reply-prompt names architect and awaits a reply', () => {
        expect(result.stdout).toContain('the reviewers await your reply');
        expect(result.stdout).toContain('architect');
      });

      then('the clean mechanic is NOT listed (clean-skip)', () => {
        // only reviewers that hold blockers require contemplation
        expect(result.stdout).not.toContain('slug = mechanic');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] driver signals --as contemplated before the .taken exists', () => {
      const result = useThen('guard blocks with absent guidance', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.execute',
            route: '.',
            as: 'contemplated',
            that: 'architect',
          },
          cwd: scene.tempDir,
        }),
      );

      then('is blocked (exit 2)', () => {
        expect(result.code).toEqual(2);
      });

      then('names the exact absent .taken path and why', () => {
        expect(result.stdout).toContain(
          'contemplation absent for reviewer architect',
        );
        expect(result.stdout).toContain('_.taken.by_self.architect.md');
        expect(result.stdout).toContain('the .taken file IS that engagement');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] driver writes the .taken then signals --as contemplated', () => {
      const result = useThen('guard acknowledges the contemplation', async () => {
        // find architect's given, derive + write its paired taken
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const files = await fs.readdir(reviewsDir);
        const givenName = files.find(
          (f) =>
            f.includes('_.given.by_peer.architect.md') &&
            !f.endsWith('.report.md'),
        )!;
        const takenName = givenName.replace(
          '._.given.by_peer.',
          '._.taken.by_self.',
        );
        await fs.writeFile(
          path.join(reviewsDir, takenName),
          '# taken\n\nfixed via a bounded context.\n',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.execute',
            route: '.',
            as: 'contemplated',
            that: 'architect',
          },
          cwd: scene.tempDir,
        });
      });

      then('is acknowledged (exit 0)', () => {
        expect(result.code).toEqual(0);
      });

      then('confirms the contemplation was recorded', () => {
        expect(result.stdout).toContain('contemplated: architect');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] driver attempts --as passed with architect answered', () => {
      const result = useThen('the stone progresses', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('passes (exit 0)', () => {
        expect(result.code).toEqual(0);
      });

      then('the stone is allowed passage', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
