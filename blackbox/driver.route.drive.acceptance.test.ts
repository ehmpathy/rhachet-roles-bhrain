import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-drive');

/**
 * .what = acceptance tests for route.drive skill
 * .why = verifies GPS-like guidance shows current stone and pass command
 */
describe('driver.route.drive.acceptance', () => {
  given('[case1] route bound with unpassed stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case1',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-drive-case1', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.drive is invoked', () => {
      const result = useThen('route.drive succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows current stone name', () => {
        expect(result.stdout).toContain('stone = 1');
      });

      then('shows stone content', () => {
        expect(result.stdout).toContain('implement the feature');
      });

      then('shows pass command', () => {
        expect(result.stdout).toContain('route.stone.set');
        expect(result.stdout).toContain('--as passed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] route bound with all stones passed (hook mode)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case2',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-drive-case2', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // create artifacts and pass all stones
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );
      await fs.writeFile(
        path.join(tempDir, '2.stone.i1.md'),
        '# Docs\n\nDocumentation written.',
      );

      // mark both stones as passed (manually via .route/)
      // note: passage files use stone name without extension (e.g., "1.passed" not "1.stone.passed")
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.route', '1.passed'), '');
      await fs.writeFile(path.join(tempDir, '.route', '2.passed'), '');

      return { tempDir };
    });

    when('[t0] route.drive is invoked with --mode hook', () => {
      const result = useThen('route.drive exits silently', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout is empty (silent)', () => {
        expect(result.stdout.trim()).toEqual('');
      });
    });
  });

  given('[case3] route bound with all stones passed (direct mode)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case3',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-drive-case3', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // create artifacts and pass all stones
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );
      await fs.writeFile(
        path.join(tempDir, '2.stone.i1.md'),
        '# Docs\n\nDocumentation written.',
      );

      // mark both stones as passed
      // note: passage files use stone name without extension (e.g., "1.passed" not "1.stone.passed")
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.route', '1.passed'), '');
      await fs.writeFile(path.join(tempDir, '.route', '2.passed'), '');

      return { tempDir };
    });

    when('[t0] route.drive is invoked without mode', () => {
      const result = useThen('route.drive shows completion', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows route complete', () => {
        expect(result.stdout.toLowerCase()).toContain('complete');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case4] hook mode blocks stop when stones remain', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case4',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-drive-case4', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.drive is invoked with --mode hook', () => {
      const result = useThen('route.drive blocks', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (block)', () => {
        expect(result.code).toEqual(2);
      });

      then('stdout shows stone content', () => {
        expect(result.stdout).toContain('where were we?');
        expect(result.stdout).toContain('stone = 1');
      });

      then('stderr has same content as stdout (for visibility)', () => {
        expect(result.stderr).toContain('where were we?');
        expect(result.stderr).toContain('stone = 1');
      });

      then('stdout matches non-hook mode (same content)', () => {
        // hook mode should show same stone content as direct mode
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] route.drive invoked twice in hook mode', () => {
      const result = useThen('second call has higher count', async () => {
        // first call
        await invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        });
        // second call
        return invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        });
      });

      then('stderr has same content as stdout', () => {
        expect(result.stderr).toContain('where were we?');
      });
    });

    when('[t2] blocker state file exists', () => {
      then('.route/.drive.blockers.latest.json exists', async () => {
        const statePath = path.join(
          scene.tempDir,
          '.route',
          '.drive.blockers.latest.json',
        );
        const exists = await fs
          .access(statePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('.route/.drive.blocker.events.jsonl has entries', async () => {
        const historyPath = path.join(
          scene.tempDir,
          '.route',
          '.drive.blocker.events.jsonl',
        );
        const content = await fs.readFile(historyPath, 'utf-8');
        const lines = content.trim().split('\n');
        expect(lines.length).toBeGreaterThan(0);
      });
    });
  });

  given('[case5] passed stone clears blocker state', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case5',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-drive-case5', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // trigger a few blocks
      await invokeRouteSkill({
        skill: 'route.drive',
        args: { mode: 'hook' },
        cwd: tempDir,
      });
      await invokeRouteSkill({
        skill: 'route.drive',
        args: { mode: 'hook' },
        cwd: tempDir,
      });

      // create artifact for stone 1 so it can pass
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature done.',
      );

      // promise the self-reviews required by the guard
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', as: 'promised', that: 'all-done' },
        cwd: tempDir,
      });
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', as: 'promised', that: 'tests-pass' },
        cwd: tempDir,
      });

      // create marker so mock review passes
      await fs.writeFile(
        path.join(tempDir, '.test', 'review-should-pass'),
        '',
      );

      return { tempDir };
    });

    when('[t0] before stone passes', () => {
      then('blocker state has count > 0', async () => {
        const statePath = path.join(
          scene.tempDir,
          '.route',
          '.drive.blockers.latest.json',
        );
        const content = await fs.readFile(statePath, 'utf-8');
        const state = JSON.parse(content);
        expect(state.count).toBeGreaterThan(0);
      });
    });

    when('[t1] route.stone.set --as passed succeeds', () => {
      const result = useThen('stone passes', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('blocker state file is cleared', async () => {
        const statePath = path.join(
          scene.tempDir,
          '.route',
          '.drive.blockers.latest.json',
        );
        const exists = await fs
          .access(statePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });
    });

    when('[t2] route.drive invoked after pass', () => {
      const result = useThen('block count resets to 1', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        }),
      );

      then('stderr has stone content (same as stdout)', () => {
        expect(result.stderr).toContain('where were we?');
      });
    });
  });

given('[case6] hook mode allows stop when blocked on approval', () => {
    const JOURNEY_ASSETS_DIR = path.join(__dirname, '.test/assets/route-journey');

    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case6',
        clone: JOURNEY_ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-drive-case6', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // create artifact for 1.vision (which has approved? judge)
      await fs.writeFile(
        path.join(tempDir, '1.vision.md'),
        '# Vision\n\nBuild a weather API.',
      );

      return { tempDir };
    });

    when('[t0] route.drive hook mode before pass attempt', () => {
      const result = useThen('route.drive blocks (no blockedOn file)', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (block - agent hasnt tried to pass)', () => {
        // no blockedOn file yet = agent should keep work
        expect(result.code).toEqual(2);
      });

      then('stderr has stone content (same as stdout)', () => {
        expect(result.stderr).toContain('where were we?');
      });
    });

    when('[t1] agent attempts to pass stone', () => {
      const result = useThen('route.stone.set fails on approval', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });
    });

    when('[t2] route.drive hook mode after blocked on approval', () => {
      const result = useThen('route.drive allows stop', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (allow stop)', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows approval needed', () => {
        expect(result.stdout).toContain('halted, human approval required');
      });

      then('stdout shows approve command', () => {
        expect(result.stdout).toContain('route.stone.set');
        expect(result.stdout).toContain('--as approved');
      });
    });

    when('[t3] human grants approval', () => {
      const result = useThen('approval succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', as: 'approved' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });
    });

    when('[t4] route.drive invoked after approval', () => {
      const result = useThen('route.drive blocks (work remains)', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (block)', () => {
        // approval granted means agent CAN proceed (run pass)
        // so we should block stop, not allow it
        expect(result.code).toEqual(2);
      });

      then('stderr has stone content (same as stdout)', () => {
        expect(result.stderr).toContain('where were we?');
      });
    });
  });

  given('[case7] no route bound', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case4',
        clone: ASSETS_DIR,
      });

      // link the driver role but do NOT bind route
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] route.drive is invoked', () => {
      const result = useThen('route.drive returns unbound message', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows unbound message', () => {
        expect(result.stdout).toContain('where were we?');
        expect(result.stdout).toContain('dunno, route not bound');
      });
    });
  });
});
