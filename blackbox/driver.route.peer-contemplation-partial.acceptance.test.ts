import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-partial');

/**
 * .what = acceptance test for partial contemplation (usecase 4)
 * .why = with several reviewers that each hold a blocker, the gate blocks until
 *        EVERY one is answered; when some are contemplated and one is not, the
 *        driver must see precisely which reviewer remains absent
 *
 * scenario:
 *   - two peer reviewers (architect + builder), each holds 1 blocker
 *   - judge allows 2 blockers, so judges pass and the gate engages
 *   - the driver answers architect only → still blocked, names builder
 */
describe('driver.route.peer-contemplation-partial.acceptance', () => {
  given('[case1] two blocker reviewers, only one answered', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-partial',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-blocker.sh', { cwd: tempDir });
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review.\n',
      );
      return { tempDir };
    });

    // pair one reviewer's given → its taken, write the response
    const answerReviewer = async (tempDir: string, slug: string) => {
      const reviewsDir = path.join(tempDir, '.reviews', 'peer');
      const files = await fs.readdir(reviewsDir);
      const givenName = files.find(
        (f) =>
          f.includes(`_.given.by_peer.${slug}.md`) && !f.endsWith('.report.md'),
      )!;
      const takenName = givenName.replace(
        '._.given.by_peer.',
        '._.taken.by_self.',
      );
      await fs.writeFile(
        path.join(reviewsDir, takenName),
        '# taken\n\nfixed via a bounded context.\n',
      );
    };

    when('[t0] driver attempts --as passed with no .taken', () => {
      const result = useThen('guard runs both reviewers', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('is blocked (exit 2)', () => {
        expect(result.code).toEqual(2);
      });

      then('the reply-prompt names BOTH uncontemplated reviewers', () => {
        expect(result.stdout).toContain('architect');
        expect(result.stdout).toContain('builder');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] driver answers architect only, then attempts --as passed', () => {
      const result = useThen('guard blocks on the absent builder', async () => {
        await answerReviewer(scene.tempDir, 'architect');
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

      then('is still blocked (exit 2)', () => {
        expect(result.code).toEqual(2);
      });

      then('the reply-prompt names the still-absent builder', () => {
        expect(result.stdout).toContain('builder');
      });

      then('the answered architect is no longer in the reply-prompt', () => {
        // only reviewers that still lack a .taken are listed
        expect(result.stdout).not.toContain('slug = architect');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] driver answers builder too, then attempts --as passed', () => {
      const result = useThen('the stone progresses', async () => {
        await answerReviewer(scene.tempDir, 'builder');
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.execute',
            route: '.',
            as: 'contemplated',
            that: 'builder',
          },
          cwd: scene.tempDir,
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('passes once every reviewer is answered (exit 0)', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
