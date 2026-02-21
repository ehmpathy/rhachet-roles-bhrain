import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { stepRouteDrive } from './stepRouteDrive';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

describe('stepRouteDrive', () => {
  given('[case1] route with incomplete stones', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-drive-incomplete-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stepRouteDrive called with route', () => {
      then('returns stone content and pass command', async () => {
        const result = await stepRouteDrive({ route: tempDir });
        expect(result.emit?.stdout).toContain('where were we?');
        expect(result.emit?.stdout).toContain('route.drive');
        expect(result.emit?.stdout).toContain('stone = 1.vision');
        expect(result.emit?.stdout).toContain(
          'rhx route.stone.set --stone 1.vision --as passed',
        );
      });

      then('includes stone content in output', async () => {
        const result = await stepRouteDrive({ route: tempDir });
        expect(result.emit?.stdout).toContain("here's the stone");
        // the stone content should be included (from 1.vision.stone fixture)
        expect(result.emit?.stdout).toContain('illustrate the vision');
      });
    });
  });

  given('[case2] route with all stones passed', () => {
    const tempDir = path.join(os.tmpdir(), `test-drive-complete-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // create passage markers for all stones (matches route.simple fixture)
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, '1.vision.passed'), '');
      await fs.writeFile(path.join(routeDir, '2.criteria.passed'), '');
      await fs.writeFile(path.join(routeDir, '3.plan.passed'), '');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stepRouteDrive called in direct mode', () => {
      then('returns route complete message', async () => {
        const result = await stepRouteDrive({ route: tempDir });
        expect(result.emit?.stdout).toContain('route complete! 🎉');
      });
    });

    when('[t1] stepRouteDrive called in hook mode', () => {
      then('returns null emit (silent)', async () => {
        const result = await stepRouteDrive({ route: tempDir, mode: 'hook' });
        expect(result.emit).toBeNull();
      });
    });
  });

  given('[case3] empty route (no stones)', () => {
    const tempDir = path.join(os.tmpdir(), `test-drive-empty-${Date.now()}`);

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stepRouteDrive called with empty route', () => {
      then('returns route complete (no stones = all done)', async () => {
        const result = await stepRouteDrive({ route: tempDir });
        expect(result.emit?.stdout).toContain('route complete');
      });
    });
  });
});
