import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-blocked');

/**
 * .what = acceptance test for route --as blocked feature
 * .why = verifies full blocked flow: attempt → nudge → articulate → confirm
 *
 * journey:
 *   1. robot attempts block → sees nudge
 *   2. robot articulates into blocker file
 *   3. robot confirms block → passage recorded
 *   4. robot unblocks via --as passed
 */
describe('driver.route.blocked.acceptance', () => {
  given('[journey] blocked flow', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'blocked',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create artifact so stone can be passed
      await fs.writeFile(
        path.join(tempDir, '1.design.i1.md'),
        '# design\n\nthe design.\n',
      );

      return { tempDir };
    });

    // =========================================================================
    // STEP 1: first block attempt shows nudge
    // =========================================================================

    when('[t0] robot attempts to block without articulation', () => {
      const result = useThen('block attempt shows nudge', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.design', as: 'blocked', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (challenged, action required)', () => {
        expect(result.code).toEqual(2);
      });

      then('stdout contains articulation required message', () => {
        expect(result.stdout).toContain(
          'passage = unchanged (articulation required)',
        );
      });

      then('stdout contains failure is opportunity message', () => {
        expect(result.stdout).toContain(
          'failure is only the opportunity to begin again',
        );
      });

      then('stdout contains articulation path', () => {
        expect(result.stdout).toContain('.route/blocker/1.design.md');
      });

      then('triggered file was created', async () => {
        const triggeredPath = path.join(
          scene.tempDir,
          '.route',
          '1.design.blocked.triggered',
        );
        const exists = await fs
          .access(triggeredPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // STEP 2: second attempt without articulation still shows nudge
    // =========================================================================

    when('[t1] robot attempts block again without articulation', () => {
      const result = useThen('block attempt still shows nudge', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.design', as: 'blocked', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('stdout still contains articulation required message', () => {
        expect(result.stdout).toContain(
          'passage = unchanged (articulation required)',
        );
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // STEP 3: robot creates articulation file
    // =========================================================================

    when('[t2] robot articulates the blocker', () => {
      then('articulation file is created', async () => {
        const blockerDir = path.join(scene.tempDir, '.route', 'blocker');
        await fs.mkdir(blockerDir, { recursive: true });

        const articulationPath = path.join(blockerDir, '1.design.md');
        const content = `# blocker: 1.design

## what blocks me
need human guidance on design approach.

## what i tried
- reviewed prior patterns
- checked documentation
- no clear precedent found

## what i need
human decision on whether to use approach A or B.
`;
        await fs.writeFile(articulationPath, content);

        const exists = await fs
          .access(articulationPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });
    });

    // =========================================================================
    // STEP 4: robot confirms block with articulation present
    // =========================================================================

    when('[t3] robot confirms block with articulation', () => {
      const result = useThen('block succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.design', as: 'blocked', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains passage = blocked', () => {
        expect(result.stdout).toContain('passage = blocked');
      });

      then('stdout contains reason path', () => {
        expect(result.stdout).toContain('.route/blocker/1.design.md');
      });

      then('passage.jsonl records blocked status', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        expect(content).toContain('"status":"blocked"');
        expect(content).toContain('"stone":"1.design"');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // STEP 5: route.drive shows blocked state
    // =========================================================================

    when('[t4] route.drive is called in hook mode', () => {
      const result = useThen('drive shows blocked state', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('stdout contains halted blocked message', () => {
        expect(result.stdout).toContain('halted, stone marked blocked');
      });

      then('stdout contains reason path', () => {
        expect(result.stdout).toContain('.route/blocker/1.design.md');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // STEP 6: robot unblocks via --as passed
    // =========================================================================

    when('[t5] robot unblocks via --as passed', () => {
      const result = useThen('pass succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.design', as: 'passed', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains passage = allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('passage.jsonl records passed status', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        // last entry should be passed
        const lines = content.trim().split('\n');
        const lastEntry = JSON.parse(lines[lines.length - 1]!);
        expect(lastEntry.status).toEqual('passed');
        expect(lastEntry.stone).toEqual('1.design');
      });

      then('blocked trigger file was cleaned up', async () => {
        const triggeredPath = path.join(
          scene.tempDir,
          '.route',
          '1.design.blocked.triggered',
        );
        const exists = await fs
          .access(triggeredPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // STEP 7: route.drive no longer shows blocked after --as passed
    // =========================================================================

    when('[t6] route.drive after unblock', () => {
      const result = useThen('drive shows normal flow', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('stdout does NOT contain halted blocked message', () => {
        expect(result.stdout).not.toContain('halted, stone marked blocked');
      });

      then('route proceeds to next stone', () => {
        // after 1.design is passed, should move to next stone or show complete
        expect(result.stdout).not.toContain('stone = 1.design');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[journey] blocked trigger shed when later stone passed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'blocked-shed',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create artifacts for both stones
      await fs.writeFile(
        path.join(tempDir, '1.design.i1.md'),
        '# design\n\nthe design.\n',
      );
      await fs.writeFile(
        path.join(tempDir, '2.implement.i1.md'),
        '# implement\n\nthe implementation.\n',
      );

      return { tempDir };
    });

    when('[t0] robot attempts to block 1.design', () => {
      const result = useThen('block attempt shows nudge', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.design', as: 'blocked', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('triggered file was created', async () => {
        const triggeredPath = path.join(
          scene.tempDir,
          '.route',
          '1.design.blocked.triggered',
        );
        const exists = await fs
          .access(triggeredPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] robot passes 2.implement (later stone)', () => {
      const result = useThen('pass succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.implement', as: 'passed', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('1.design blocked trigger was cleaned up', async () => {
        const triggeredPath = path.join(
          scene.tempDir,
          '.route',
          '1.design.blocked.triggered',
        );
        const exists = await fs
          .access(triggeredPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] robot attempts to block 1.design again', () => {
      const result = useThen('block shows nudge again (not skipped)', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.design', as: 'blocked', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('stdout contains nudge (trigger was reset)', () => {
        expect(result.stdout).toContain(
          'failure is only the opportunity to begin again',
        );
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
