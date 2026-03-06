import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const JOURNEY_ASSETS_DIR = path.join(__dirname, '.test/assets/route-journey');

/**
 * .what = backdate triggered report mtime to bypass time enforcement
 * .why = tests need to verify promise flow without 90 second wait
 *
 * .note = backdates ALL matched .since files (there may be multiple with different hashes)
 */
const backdateTriggeredReport = async (input: {
  tempDir: string;
  stone: string;
  slug: string;
}): Promise<void> => {
  const routeDir = path.join(input.tempDir, '.route');
  const files = await fs.readdir(routeDir).catch(() => []);
  const triggeredFiles = files.filter(
    (f) =>
      f.includes(`${input.stone}.guard.selfreview.${input.slug}`) &&
      f.endsWith('.triggered.since'),
  );
  const mtimePast = new Date(Date.now() - 31 * 1000);
  for (const triggeredFile of triggeredFiles) {
    const filepath = path.join(routeDir, triggeredFile);
    await fs.utimes(filepath, mtimePast, mtimePast);
  }
};

/**
 * .what = acceptance tests for route.drive blocker state
 * .why = verifies hook mode uses persisted blocker state to allow/block stop
 *
 * key behavior:
 * - hook mode blocks when agent hasn't tried to pass (no blocker file)
 * - hook mode blocks when blocker !== 'approval' (agent can fix)
 * - hook mode allows stop when blocker === 'approval' (agent must wait)
 */
describe('driver.route.drive.blocker.acceptance', () => {
  given('[case1] stone with only approval judge (1.vision)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'blocker-case1',
        clone: JOURNEY_ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-blocker-case1', {
        cwd: tempDir,
      });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // create artifact for 1.vision
      await fs.writeFile(
        path.join(tempDir, '1.vision.md'),
        '# Vision\n\nBuild a weather API.',
      );

      return { tempDir };
    });

    when('[t0] route.drive hook mode before pass attempt', () => {
      const result = useThen('route.drive blocks (no blocker file)', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (block)', () => {
        // no blocker file yet = agent should keep work
        expect(result.code).toEqual(2);
      });

      then('stderr has stone content (same as stdout)', () => {
        expect(result.stderr).toContain('where were we?');
      });
    });

    when('[t1] agent attempts to pass stone (blocked on approval)', () => {
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

      then('blocker entry exists in passage.jsonl with approval', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        const reports = content.trim().split('\n').map((line) => JSON.parse(line));
        const blockerReport = reports.filter(
          (r) => r.stone === '1.vision' && r.status === 'blocked',
        ).pop();
        expect(blockerReport).toBeDefined();
        expect(blockerReport.blocker).toEqual('approval');
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

    when('[t4] agent passes stone after approval', () => {
      const result = useThen('stone passes', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage shows stone passed (supersedes blocked)', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        const reports = content.trim().split('\n').map((line) => JSON.parse(line));
        const latestReport = reports.filter((r) => r.stone === '1.vision').pop();
        expect(latestReport.status).toEqual('passed');
      });
    });
  });

  given('[case2] stone with review + approval (3.blueprint)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'blocker-case2',
        clone: JOURNEY_ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // make mock-review.sh executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-blocker-case2', {
        cwd: tempDir,
      });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // pass earlier stones to get to 3.blueprint
      // 1.vision: create artifact, approve, pass
      await fs.writeFile(
        path.join(tempDir, '1.vision.md'),
        '# Vision\n\nWeather API.',
      );
      const approveResult = await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.vision', as: 'approved' },
        cwd: tempDir,
      });
      if (approveResult.code !== 0) {
        console.error('SETUP FAILED: approve 1.vision', approveResult);
        throw new Error('setup failed: approve 1.vision');
      }
      const pass1Result = await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.vision', as: 'passed' },
        cwd: tempDir,
      });
      if (pass1Result.code !== 0) {
        console.error('SETUP FAILED: pass 1.vision', pass1Result);
        throw new Error('setup failed: pass 1.vision');
      }

      // 2.research: unguarded, just needs artifact
      await fs.writeFile(
        path.join(tempDir, '2.research.md'),
        '# Research\n\nResearch done.',
      );
      const pass2Result = await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '2.research', as: 'passed' },
        cwd: tempDir,
      });
      if (pass2Result.code !== 0) {
        console.error('SETUP FAILED: pass 2.research', pass2Result);
        throw new Error('setup failed: pass 2.research');
      }

      // create artifact for 3.blueprint
      await fs.writeFile(
        path.join(tempDir, '3.blueprint.md'),
        '# Blueprint\n\nAPI design with issues.',
      );

      return { tempDir };
    });

    when('[t0] agent attempts pass without review.self promise', () => {
      const result = useThen('blocked on review.self', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('passage.jsonl shows blocked on review.self', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        const reports = content.trim().split('\n').map((line) => JSON.parse(line));
        const blockerReport = reports.filter(
          (r) => r.stone === '3.blueprint' && r.status === 'blocked',
        ).pop();
        expect(blockerReport).toBeDefined();
        expect(blockerReport.blocker).toEqual('review.self');
      });
    });

    when('[t1] route.drive hook mode when blocked on review.self', () => {
      const result = useThen('route.drive blocks', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (block - agent can promise)', () => {
        // blocker = 'review.self' means agent can do task
        expect(result.code).toEqual(2);
      });

      then('does NOT say approval needed (other blockers exist)', () => {
        // "halted, human approval required" should only appear when approval is the ONLY blocker
        expect(result.stdout).not.toContain('halted, human approval required');
      });
    });

    when('[t2] agent promises review.self and attempts pass', () => {
      const result = useThen('blocked on review', async () => {
        // backdate triggered report to bypass 30-second time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '3.blueprint',
          slug: 'design-complete',
        });

        // promise the review.self
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', as: 'promised', that: 'design-complete' },
          cwd: scene.tempDir,
        });

        // try to pass (will fail on peer review)
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('passage.jsonl shows blocked on review.peer', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        const reports = content.trim().split('\n').map((line) => JSON.parse(line));
        const blockerReport = reports.filter(
          (r) => r.stone === '3.blueprint' && r.status === 'blocked',
        ).pop();
        expect(blockerReport).toBeDefined();
        expect(blockerReport.blocker).toEqual('review.peer');
      });
    });

    when('[t3] route.drive hook mode when blocked on review.peer', () => {
      const result = useThen('route.drive blocks', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (block - agent can fix code)', () => {
        // blocker = 'review.peer' means agent can fix the code
        expect(result.code).toEqual(2);
      });

      then('does NOT say approval needed (other blockers exist)', () => {
        // key: "halted, human approval required" should only appear
        // when approval is the ONLY blocker, not when review also failed
        expect(result.stdout).not.toContain('halted, human approval required');
      });
    });

    when('[t4] agent fixes review and attempts pass', () => {
      const result = useThen('blocked on approval', async () => {
        // make review pass by create marker
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'review-should-pass'),
          '',
        );

        // update artifact to change hash (triggers re-review)
        await fs.writeFile(
          path.join(scene.tempDir, '3.blueprint.md'),
          '# Blueprint\n\nFixed API design.',
        );

        // trigger review.self for new hash (artifact changed)
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', as: 'passed' },
          cwd: scene.tempDir,
        });

        // backdate triggered report to bypass 30-second time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '3.blueprint',
          slug: 'design-complete',
        });

        // re-promise review.self for new hash
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', as: 'promised', that: 'design-complete' },
          cwd: scene.tempDir,
        });

        // try to pass (will fail on approval)
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('passage.jsonl shows blocked on approval', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        const reports = content.trim().split('\n').map((line) => JSON.parse(line));
        const blockerReport = reports.filter(
          (r) => r.stone === '3.blueprint' && r.status === 'blocked',
        ).pop();
        expect(blockerReport).toBeDefined();
        expect(blockerReport.blocker).toEqual('approval');
      });
    });

    when('[t5] route.drive hook mode when blocked on approval', () => {
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
    });
  });
});
