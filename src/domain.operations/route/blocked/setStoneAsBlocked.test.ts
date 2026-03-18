import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { setStoneAsBlocked } from './setStoneAsBlocked';

describe('setStoneAsBlocked', () => {
  given('[case1] first attempt (no triggered file)', () => {
    when('[t0] we attempt to block a stone', () => {
      then('it shows nudge and creates triggered file', async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'blocked-test-'),
        );

        // create a stone file
        await fs.writeFile(
          path.join(tempDir, '3.blueprint.stone'),
          '# blueprint\n',
        );

        const result = await setStoneAsBlocked({
          stone: '3.blueprint',
          route: tempDir,
        });

        // verify result
        expect(result.blocked).toBe(false);
        expect(result.challenged).toBe(true);
        expect(result.emit.stdout).toContain(
          'passage = unchanged (articulation required)',
        );
        expect(result.emit.stdout).toContain(
          'failure is only the opportunity to begin again',
        );

        // verify triggered file was created
        const triggeredPath = path.join(
          tempDir,
          '.route',
          '3.blueprint.blocked.triggered',
        );
        const triggeredContent = await fs.readFile(triggeredPath, 'utf-8');
        expect(triggeredContent).toContain('stone: 3.blueprint');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case2] triggered but no articulation', () => {
    when('[t0] we attempt to block a stone', () => {
      then('it shows nudge (articulation reminder)', async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'blocked-test-'),
        );

        // create a stone file
        await fs.writeFile(
          path.join(tempDir, '3.blueprint.stone'),
          '# blueprint\n',
        );

        // create triggered file
        const routeDir = path.join(tempDir, '.route');
        await fs.mkdir(routeDir, { recursive: true });
        await fs.writeFile(
          path.join(routeDir, '3.blueprint.blocked.triggered'),
          'stone: 3.blueprint\n',
        );

        const result = await setStoneAsBlocked({
          stone: '3.blueprint',
          route: tempDir,
        });

        // verify result
        expect(result.blocked).toBe(false);
        expect(result.challenged).toBe(true);
        expect(result.emit.stdout).toContain(
          'passage = unchanged (articulation required)',
        );

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case3] triggered and articulation both exist', () => {
    when('[t0] we attempt to block a stone', () => {
      then('it records blocked status and shows success', async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'blocked-test-'),
        );

        // create a stone file
        await fs.writeFile(
          path.join(tempDir, '3.blueprint.stone'),
          '# blueprint\n',
        );

        // create triggered file
        const routeDir = path.join(tempDir, '.route');
        await fs.mkdir(routeDir, { recursive: true });
        await fs.writeFile(
          path.join(routeDir, '3.blueprint.blocked.triggered'),
          'stone: 3.blueprint\n',
        );

        // create articulation file
        const blockerDir = path.join(routeDir, 'blocker');
        await fs.mkdir(blockerDir, { recursive: true });
        await fs.writeFile(
          path.join(blockerDir, '3.blueprint.md'),
          '# blocker: 3.blueprint\n\n## what blocks me\ntest blocker\n',
        );

        const result = await setStoneAsBlocked({
          stone: '3.blueprint',
          route: tempDir,
        });

        // verify result
        expect(result.blocked).toBe(true);
        expect(result.challenged).toBe(false);
        expect(result.emit.stdout).toContain('passage = blocked');

        // verify passage.jsonl was updated
        const passagePath = path.join(routeDir, 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8');
        expect(passageContent).toContain('"status":"blocked"');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });
});
