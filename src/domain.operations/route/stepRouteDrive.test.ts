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

    when('[t0] stepRouteDrive called in direct mode', () => {
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

    when('[t1] stepRouteDrive called in hook mode', () => {
      then('returns stdout with stone content', async () => {
        const result = await stepRouteDrive({ route: tempDir, mode: 'hook' });
        expect(result.emit?.stdout).toContain('where were we?');
        expect(result.emit?.stdout).toContain('stone = 1.vision');
      });

      then(
        'returns stderr with code 2 and same content as stdout',
        async () => {
          const result = await stepRouteDrive({ route: tempDir, mode: 'hook' });
          expect(result.emit?.stderr).toBeDefined();
          expect(result.emit?.stderr?.code).toBe(2);
          // stderr contains same content as stdout (full stone output)
          expect(result.emit?.stderr?.reason).toContain('where were we?');
          expect(result.emit?.stderr?.reason).toContain('1.vision');
          expect(result.emit?.stderr?.reason).toEqual(result.emit?.stdout);
        },
      );

      then('tracks block count internally (for escalation)', async () => {
        // block count is tracked but not shown in output
        // after 21 blocks, escalation occurs (exit code 3)
        const result1 = await stepRouteDrive({ route: tempDir, mode: 'hook' });
        const result2 = await stepRouteDrive({ route: tempDir, mode: 'hook' });
        // both should block with code 2 and contain stone content
        expect(result1.emit?.stderr?.code).toBe(2);
        expect(result2.emit?.stderr?.code).toBe(2);
        expect(result1.emit?.stderr?.reason).toContain('where were we?');
        expect(result2.emit?.stderr?.reason).toContain('where were we?');
      });
    });
  });

  given('[case2] route with all stones passed', () => {
    const tempDir = path.join(os.tmpdir(), `test-drive-complete-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // create passage reports for all stones (matches route.simple fixture)
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });
      const passageContent =
        [
          '{"stone":"1.vision","status":"passed"}',
          '{"stone":"2.criteria","status":"passed"}',
          '{"stone":"3.plan","status":"passed"}',
        ].join('\n') + '\n';
      await fs.writeFile(path.join(routeDir, 'passage.jsonl'), passageContent);
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
      then('returns null emit (silent, route done)', async () => {
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

  given('[case4] vibecheck snapshots', () => {
    const tempDir = path.join(os.tmpdir(), `test-drive-snap-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] route has next stone', () => {
      then('output matches snapshot', async () => {
        const result = await stepRouteDrive({ route: tempDir });
        // replace temp path for snapshot stability
        const outputStable = result.emit?.stdout?.replace(tempDir, '<ROUTE>');
        expect(outputStable).toMatchSnapshot();
      });
    });

    when('[t1] route is complete', () => {
      then('output matches snapshot', async () => {
        // mark all stones passed via passage.jsonl
        const routeDir = path.join(tempDir, '.route');
        await fs.mkdir(routeDir, { recursive: true });
        const passageContent =
          [
            '{"stone":"1.vision","status":"passed"}',
            '{"stone":"2.criteria","status":"passed"}',
            '{"stone":"3.plan","status":"passed"}',
          ].join('\n') + '\n';
        await fs.writeFile(
          path.join(routeDir, 'passage.jsonl'),
          passageContent,
        );

        const result = await stepRouteDrive({ route: tempDir });
        expect(result.emit?.stdout).toMatchSnapshot();
      });
    });

    when('[t2] no route bound (direct mode)', () => {
      then('output matches snapshot', async () => {
        // stepRouteDrive without route arg checks for bind
        // in unit test context there's no git branch, so it will be unbound
        const result = await stepRouteDrive({});
        expect(result.emit?.stdout).toMatchSnapshot();
      });
    });
  });
});
