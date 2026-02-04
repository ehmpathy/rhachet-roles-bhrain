import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

describe('driver.route.set.acceptance', () => {
  given('[case1] route.stone.set --as passed', () => {
    when('[t0] stone has artifact', () => {
      const res = useThen('invoke set skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-passed',
          clone: ASSETS_DIR,
        });

        // link the driver role
        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create artifact
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision\n\nTest');

        // invoke skill
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        // check for passage marker
        const passageExists = await fs
          .access(path.join(tempDir, '.route', '1.vision.passed'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, passageExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('outputs passed message', () => {
        expect(res.cli.stdout).toContain('passed');
      });

      then('creates passage marker', () => {
        expect(res.passageExists).toBe(true);
      });
    });

    when('[t1] stone has no artifact', () => {
      const res = useThen('invoke set skill without artifact', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-noart',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli fails with error', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error mentions artifact not found', () => {
        expect(res.cli.stderr).toContain('artifact not found');
      });
    });
  });

  given('[case2] route.stone.set --as approved', () => {
    when('[t0] stone is approved', () => {
      const res = useThen('invoke set skill with approved', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-approved',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'approved' },
          cwd: tempDir,
        });

        // check for approval marker
        const approvalExists = await fs
          .access(path.join(tempDir, '.route', '1.vision.approved'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, approvalExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('outputs approved message', () => {
        expect(res.cli.stdout).toContain('approved');
      });

      then('creates approval marker', () => {
        expect(res.approvalExists).toBe(true);
      });
    });
  });
});
