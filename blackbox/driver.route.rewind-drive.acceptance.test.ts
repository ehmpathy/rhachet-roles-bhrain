import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

/**
 * .what = acceptance tests for rewind + drive interaction
 * .why = verifies the core regression: rewound stones show as "next" not "complete"
 */
describe('driver.route.rewind-drive.acceptance', () => {
  given('[case1] route.drive after rewind shows rewound stone as next', () => {
    when('[t0] stone was passed then rewound', () => {
      const res = useThen('pass then rewind then drive', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'rewind-drive-case1',
          clone: ASSETS_DIR,
        });

        // link the driver role
        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create artifact for 1.vision
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision\n\nTest');

        // pass the stone
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        // verify it shows as complete
        const driveBeforeRewind = await invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.' },
          cwd: tempDir,
        });

        // now rewind the stone
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound' },
          cwd: tempDir,
        });

        // drive again — should show rewound stone as next
        const driveAfterRewind = await invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.' },
          cwd: tempDir,
        });

        console.log('\n--- driveBeforeRewind.stdout ---');
        console.log(driveBeforeRewind.stdout);
        console.log('\n--- driveAfterRewind.stdout ---');
        console.log(driveAfterRewind.stdout);
        console.log('--- end ---\n');

        return { driveBeforeRewind, driveAfterRewind, tempDir };
      });

      then('drive before rewind shows 2.criteria as next (1 passed)', () => {
        expect(res.driveBeforeRewind.stdout).toContain('2.criteria');
      });

      then('drive after rewind shows 1.vision as next (rewound)', () => {
        expect(res.driveAfterRewind.stdout).toContain('1.vision');
      });

      then('drive after rewind does NOT show complete', () => {
        expect(res.driveAfterRewind.stdout.toLowerCase()).not.toContain('route complete');
      });

      then('drive before rewind stdout matches snapshot', () => {
        expect(res.driveBeforeRewind.stdout).toMatchSnapshot();
      });

      then('drive after rewind stdout matches snapshot', () => {
        expect(res.driveAfterRewind.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] unguarded stone with artifact respects rewind', () => {
    when('[t0] artifact exists but stone was rewound', () => {
      const res = useThen('setup artifact then rewind then drive', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'rewind-drive-case2',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create artifacts for all stones
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision\n\nTest');
        await fs.writeFile(path.join(tempDir, '2.criteria.md'), '# Criteria\n\nTest');
        await fs.writeFile(path.join(tempDir, '3.plan.md'), '# Plan\n\nTest');

        // pass all stones
        for (const stone of ['1.vision', '2.criteria', '3.plan']) {
          await invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone, route: '.', as: 'passed' },
            cwd: tempDir,
          });
        }

        // verify route is complete
        const driveComplete = await invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.' },
          cwd: tempDir,
        });

        // rewind 2.criteria (cascades to 3.plan)
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.criteria', route: '.', as: 'rewound' },
          cwd: tempDir,
        });

        // drive again — should show 2.criteria as next
        const driveAfterRewind = await invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.' },
          cwd: tempDir,
        });

        console.log('\n--- driveComplete.stdout ---');
        console.log(driveComplete.stdout);
        console.log('\n--- driveAfterRewind.stdout ---');
        console.log(driveAfterRewind.stdout);
        console.log('--- end ---\n');

        return { driveComplete, driveAfterRewind, tempDir };
      });

      then('drive before rewind shows route complete', () => {
        expect(res.driveComplete.stdout.toLowerCase()).toContain('route complete');
      });

      then('drive after rewind shows 2.criteria as next', () => {
        expect(res.driveAfterRewind.stdout).toContain('2.criteria');
      });

      then('drive after rewind does NOT auto-pass (artifacts exist but rewound)', () => {
        // key: artifacts exist for 2.criteria and 3.plan, but rewind prevents auto-pass
        expect(res.driveAfterRewind.stdout.toLowerCase()).not.toContain('route complete');
      });

      then('drive complete stdout matches snapshot', () => {
        expect(res.driveComplete.stdout).toMatchSnapshot();
      });

      then('drive after rewind stdout matches snapshot', () => {
        expect(res.driveAfterRewind.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case3] gitignored guard artifacts are deleted on rewind', () => {
    when('[t0] .route has gitignore that ignores all files', () => {
      const res = useThen('create gitignored artifacts then rewind', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'rewind-drive-case3',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create .route with gitignore that ignores all content
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(path.join(tempDir, '.route', '.gitignore'), '*\n');

        // create guard artifacts (would be ignored by gitignore)
        await fs.writeFile(
          path.join(tempDir, '.route', '1.vision.guard.review.i1.abc.r1.md'),
          '# review',
        );
        await fs.writeFile(
          path.join(tempDir, '.route', '1.vision.guard.judge.i1.abc.j1.md'),
          '# judge',
        );

        // count files before
        const filesBefore = await fs.readdir(path.join(tempDir, '.route'));
        const guardFilesBefore = filesBefore.filter((f) => f.includes('.guard.'));

        // invoke rewind
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound' },
          cwd: tempDir,
        });

        // count files after
        const filesAfter = await fs.readdir(path.join(tempDir, '.route'));
        const guardFilesAfter = filesAfter.filter((f) => f.includes('.guard.'));

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('--- end ---\n');

        return { cli, guardFilesBefore, guardFilesAfter, tempDir };
      });

      then('guard artifacts existed before rewind', () => {
        expect(res.guardFilesBefore).toHaveLength(2);
      });

      then('guard artifacts deleted after rewind (even if gitignored)', () => {
        expect(res.guardFilesAfter).toHaveLength(0);
      });

      then('cli output shows deleted counts', () => {
        // should show "1 review" and "1 judge" deleted
        expect(res.cli.stdout).toMatch(/1\s*review/i);
        expect(res.cli.stdout).toMatch(/1\s*judge/i);
      });

      then('rewind output matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case4] re-pass after rewind works', () => {
    const scene = useThen('setup temp dir', async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'rewind-drive-case4',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision\n\nTest');
      return { tempDir };
    });

    when('[t0] stone is passed', () => {
      const res = useThen('pass 1.vision', async () => {
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('stdout matches snapshot', () => {
        expect(res.stdout).toMatchSnapshot();
      });
    });

    when('[t1] stone is rewound', () => {
      const res = useThen('rewind 1.vision', async () => {
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound' },
          cwd: scene.tempDir,
        });
      });

      then('stdout matches snapshot', () => {
        expect(res.stdout).toMatchSnapshot();
      });
    });

    when('[t2] drive after rewind', () => {
      const res = useThen('drive', async () => {
        return invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.' },
          cwd: scene.tempDir,
        });
      });

      then('shows 1.vision as next (rewound)', () => {
        expect(res.stdout).toContain('1.vision');
      });

      then('stdout matches snapshot', () => {
        expect(res.stdout).toMatchSnapshot();
      });
    });

    when('[t3] stone is passed again', () => {
      const res = useThen('pass 1.vision again', async () => {
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('pass succeeds', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain('passage = allowed');
      });

      then('stdout matches snapshot', () => {
        expect(res.stdout).toMatchSnapshot();
      });
    });

    when('[t4] drive after re-pass', () => {
      const res = useThen('drive', async () => {
        return invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.' },
          cwd: scene.tempDir,
        });
      });

      then('shows 2.criteria as next (1.vision re-passed)', () => {
        expect(res.stdout).toContain('2.criteria');
      });

      then('stdout matches snapshot', () => {
        expect(res.stdout).toMatchSnapshot();
      });
    });

    when('[t5] passage.jsonl checked', () => {
      const res = useThen('read passage.jsonl', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8');
        const lines = passageContent.split('\n').filter(Boolean);
        return { lines };
      });

      then('has full history: passed, rewound (cascade), passed', () => {
        expect(res.lines.length).toBeGreaterThanOrEqual(5);
        const history = res.lines.map((l: string) => JSON.parse(l));
        const visionHistory = history.filter((e: { stone: string }) => e.stone === '1.vision');
        expect(visionHistory.map((e: { status: string }) => e.status)).toEqual([
          'passed',
          'rewound',
          'passed',
        ]);
      });
    });
  });
});
