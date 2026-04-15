import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

describe('driver.route.stone.add.acceptance', () => {
  given('[case1] default plan mode with literal source', () => {
    when('[t0] invoke without --mode flag', () => {
      const res = useThen('invoke add skill in default plan mode', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-add-plan-def',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.add',
          args: {
            stone: '3.1.research.custom',
            from: 'custom research content',
            route: '.',
          },
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        // check if stone was NOT created (plan mode = no disk changes)
        const stoneExists = await fs
          .access(path.join(tempDir, '3.1.research.custom.stone'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, stoneExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('defaults to plan mode', () => {
        expect(res.cli.stdout).toContain('--mode plan');
      });

      then('stone file is NOT created (plan = no disk changes)', () => {
        expect(res.stoneExists).toBe(false);
      });

      then('stdout has treestruct format', () => {
        expect(res.cli.stdout).toContain('another stone on the path');
        expect(res.cli.stdout).toContain('route.stone.add');
        expect(res.cli.stdout).toContain('rerun with --mode apply');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] apply mode with literal source', () => {
    when('[t0] invoke with --mode apply', () => {
      const res = useThen('invoke add skill in apply mode', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-add-apply',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.add',
          args: {
            stone: '3.1.research.custom',
            from: 'custom research content',
            route: '.',
            mode: 'apply',
          },
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        const stoneExists = await fs
          .access(path.join(tempDir, '3.1.research.custom.stone'))
          .then(() => true)
          .catch(() => false);

        let stoneContent = '';
        if (stoneExists) {
          stoneContent = await fs.readFile(
            path.join(tempDir, '3.1.research.custom.stone'),
            'utf-8',
          );
        }

        return { cli, tempDir, stoneExists, stoneContent };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stone file is created', () => {
        expect(res.stoneExists).toBe(true);
      });

      then('stone file has correct content', () => {
        expect(res.stoneContent).toEqual('custom research content');
      });

      then('stdout shows created in treestruct', () => {
        expect(res.cli.stdout).toContain('another stone on the path');
        expect(res.cli.stdout).toContain('--mode apply');
        expect(res.cli.stdout).toContain('3.1.research.custom');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case3] collision detection', () => {
    when('[t0] stone already exists', () => {
      const res = useThen('invoke add on collision', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-add-collision',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // try to add a stone that already exists
        const cli = await invokeRouteSkill({
          skill: 'route.stone.add',
          args: {
            stone: '1.vision',
            from: 'content',
            route: '.',
            mode: 'apply',
          },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli exits with error code', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr shows collision message', () => {
        expect(res.cli.stderr).toContain('stone already exists');
      });

      then('stderr matches snapshot', () => {
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case4] invalid stone name - no numeric prefix', () => {
    when('[t0] invoke with invalid stone name', () => {
      const res = useThen('invoke add with bad name', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-add-invalid',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.add',
          args: {
            stone: 'research.custom',
            from: 'content',
            route: '.',
            mode: 'apply',
          },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli exits with error code', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr shows validation message', () => {
        expect(res.cli.stderr).toContain('numeric prefix');
      });

      then('stderr matches snapshot', () => {
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case5] template source', () => {
    when('[t0] invoke with template($behavior/...) source', () => {
      const res = useThen('invoke add with template source', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-add-template',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.add',
          args: {
            stone: '3.1.research.adhoc',
            from: 'template($behavior/refs/template.research.adhoc.stone)',
            route: '.',
            mode: 'apply',
          },
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        const stoneExists = await fs
          .access(path.join(tempDir, '3.1.research.adhoc.stone'))
          .then(() => true)
          .catch(() => false);

        let stoneContent = '';
        if (stoneExists) {
          stoneContent = await fs.readFile(
            path.join(tempDir, '3.1.research.adhoc.stone'),
            'utf-8',
          );
        }

        return { cli, tempDir, stoneExists, stoneContent };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stone file is created', () => {
        expect(res.stoneExists).toBe(true);
      });

      then('stone file has template content', () => {
        expect(res.stoneContent).toContain('research: adhoc');
        expect(res.stoneContent).toContain('investigate the topic');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case6] stdin source', () => {
    when('[t0] invoke with @stdin source', () => {
      const res = useThen('invoke add with stdin source', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-add-stdin',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const stdinContent = `research: api integration

## goal

understand how the external api works

## notes

(to be filled)
`;

        const cli = await invokeRouteSkill({
          skill: 'route.stone.add',
          args: {
            stone: '3.2.research.api',
            from: '@stdin',
            route: '.',
            mode: 'apply',
          },
          cwd: tempDir,
          stdin: stdinContent,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        const stoneExists = await fs
          .access(path.join(tempDir, '3.2.research.api.stone'))
          .then(() => true)
          .catch(() => false);

        let stoneContent = '';
        if (stoneExists) {
          stoneContent = await fs.readFile(
            path.join(tempDir, '3.2.research.api.stone'),
            'utf-8',
          );
        }

        return { cli, tempDir, stoneExists, stoneContent };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stone file is created', () => {
        expect(res.stoneExists).toBe(true);
      });

      then('stone file has stdin content', () => {
        expect(res.stoneContent).toContain('research: api integration');
        expect(res.stoneContent).toContain('understand how the external api works');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case7] stdin source with no content', () => {
    when('[t0] invoke with @stdin but no stdin provided', () => {
      const res = useThen('invoke add with empty stdin', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-add-stdin-empty',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.add',
          args: {
            stone: '3.3.research.empty',
            from: '@stdin',
            route: '.',
            mode: 'apply',
          },
          cwd: tempDir,
          stdin: '',
        });

        return { cli, tempDir };
      });

      then('cli exits with error code', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr shows stdin error', () => {
        expect(res.cli.stderr).toContain('no content provided via stdin');
      });

      then('stderr matches snapshot', () => {
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case8] template not found', () => {
    when('[t0] invoke with nonexistent template', () => {
      const res = useThen('invoke add with bad template', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-add-template-404',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.add',
          args: {
            stone: '3.4.research.notfound',
            from: 'template($behavior/refs/nonexistent.stone)',
            route: '.',
            mode: 'apply',
          },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli exits with error code', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('stderr shows file error', () => {
        expect(res.cli.stderr).toContain('template file not found');
      });

      then('stderr matches snapshot', () => {
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case9] required args validation', () => {
    when('[t0] invoke without --stone', () => {
      const res = useThen('invoke add without stone', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-add-nostone',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.add',
          args: {
            from: 'content',
            route: '.',
          },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli exits with error code', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr shows required arg', () => {
        expect(res.cli.stderr).toContain('--stone is required');
      });

      then('stderr matches snapshot', () => {
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });

    when('[t1] invoke without --source', () => {
      const res = useThen('invoke add without source', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-add-nosource',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.add',
          args: {
            stone: '3.5.research.nosrc',
            route: '.',
          },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli exits with error code', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr shows required arg', () => {
        expect(res.cli.stderr).toContain('--from is required');
      });

      then('stderr matches snapshot', () => {
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case10] route not found', () => {
    when('[t0] invoke with nonexistent route', () => {
      const res = useThen('invoke add with bad route', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-add-noroute',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.add',
          args: {
            stone: '3.6.research.noroute',
            from: 'content',
            route: './nonexistent',
          },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli exits with error code', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr shows route error', () => {
        expect(res.cli.stderr).toContain('route not found');
      });

      then('stderr matches snapshot', () => {
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });
  });
});
