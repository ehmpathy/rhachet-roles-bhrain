import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { stepRouteDrive } from './stepRouteDrive';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

describe('stepRouteDrive', () => {
  given('[case1] route with incomplete stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'drive-incomplete',
        clone: path.join(ASSETS_DIR, 'route.simple'),
      });
      return { tempDir };
    });

    when('[t0] stepRouteDrive called in direct mode', () => {
      then('returns stone content and pass command', async () => {
        const result = await stepRouteDrive({ route: scene.tempDir });
        expect(result.emit?.stdout).toContain('where were we?');
        expect(result.emit?.stdout).toContain('route.drive');
        expect(result.emit?.stdout).toContain('stone = 1.vision');
        expect(result.emit?.stdout).toContain(
          'rhx route.stone.set --stone 1.vision --as passed',
        );
      });

      then('includes stone content in output', async () => {
        const result = await stepRouteDrive({ route: scene.tempDir });
        expect(result.emit?.stdout).toContain("here's the stone");
        // the stone content should be included (from 1.vision.stone fixture)
        expect(result.emit?.stdout).toContain('illustrate the vision');
      });
    });

    when('[t1] stepRouteDrive called in hook mode', () => {
      then('returns stdout with stone content', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          mode: 'hook',
        });
        expect(result.emit?.stdout).toContain('where were we?');
        expect(result.emit?.stdout).toContain('stone = 1.vision');
      });

      then(
        'returns stderr with code 2 and same content as stdout',
        async () => {
          const result = await stepRouteDrive({
            route: scene.tempDir,
            mode: 'hook',
          });
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
        const result1 = await stepRouteDrive({
          route: scene.tempDir,
          mode: 'hook',
        });
        const result2 = await stepRouteDrive({
          route: scene.tempDir,
          mode: 'hook',
        });
        // both should block with code 2 and contain stone content
        expect(result1.emit?.stderr?.code).toBe(2);
        expect(result2.emit?.stderr?.code).toBe(2);
        expect(result1.emit?.stderr?.reason).toContain('where were we?');
        expect(result2.emit?.stderr?.reason).toContain('where were we?');
      });
    });
  });

  given('[case2] route with all stones passed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'drive-complete',
        clone: path.join(ASSETS_DIR, 'route.simple'),
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

      return { tempDir };
    });

    when('[t0] stepRouteDrive called in direct mode', () => {
      then('returns route complete message', async () => {
        const result = await stepRouteDrive({ route: scene.tempDir });
        expect(result.emit?.stdout).toContain('route complete! 🎉');
      });
    });

    when('[t1] stepRouteDrive called in hook mode', () => {
      then('returns null emit (silent, route done)', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          mode: 'hook',
        });
        expect(result.emit).toBeNull();
      });
    });
  });

  given('[case3] empty route (no stones)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-empty' });
      return { tempDir };
    });

    when('[t0] stepRouteDrive called with empty route', () => {
      then('returns route complete (no stones = all done)', async () => {
        const result = await stepRouteDrive({ route: scene.tempDir });
        expect(result.emit?.stdout).toContain('route complete');
      });
    });
  });

  given('[case4] vibecheck snapshots', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'drive-snap',
        clone: path.join(ASSETS_DIR, 'route.simple'),
      });
      return { tempDir };
    });

    when('[t0] route has next stone', () => {
      then('output matches snapshot', async () => {
        const result = await stepRouteDrive({ route: scene.tempDir });
        // replace temp path for snapshot stability
        const outputStable = result.emit?.stdout?.replace(
          scene.tempDir,
          '<ROUTE>',
        );
        expect(outputStable).toMatchSnapshot();
      });
    });

    when('[t1] route is complete', () => {
      then('output matches snapshot', async () => {
        // mark all stones passed via passage.jsonl
        const routeDir = path.join(scene.tempDir, '.route');
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

        const result = await stepRouteDrive({ route: scene.tempDir });
        expect(result.emit?.stdout).toMatchSnapshot();
      });
    });

    when('[t2] no route bound (isolated temp dir)', () => {
      // use isolated temp dir to test unbound behavior
      // (stepRouteDrive({}) without isolation picks up actual repo state)
      const unboundScene = useBeforeAll(async () => {
        const unboundTempDir = genTempDir({ slug: 'drive-unbound' });
        return { unboundTempDir };
      });

      then('output shows route complete when no stones', async () => {
        // empty dir = no stones = route complete
        const result = await stepRouteDrive({
          route: unboundScene.unboundTempDir,
        });
        expect(result.emit?.stdout).toContain('route complete');
      });
    });
  });

  given('[case5] route with malfunction status', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'drive-malfunction',
        clone: path.join(ASSETS_DIR, 'route.simple'),
      });

      // create passage report with malfunction status
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });
      const passageContent =
        ['{"stone":"1.vision","status":"malfunction"}'].join('\n') + '\n';
      await fs.writeFile(path.join(routeDir, 'passage.jsonl'), passageContent);

      return { tempDir };
    });

    when('[t0] stepRouteDrive called in direct mode', () => {
      then(
        'returns normal output (direct mode does not check malfunction)',
        async () => {
          const result = await stepRouteDrive({ route: scene.tempDir });
          // direct mode still shows next stone (malfunction check is hook-only)
          expect(result.emit?.stdout).toContain('where were we?');
          expect(result.emit?.stdout).toContain('stone = 1.vision');
        },
      );
    });

    when('[t1] stepRouteDrive called in hook mode', () => {
      then('returns halted message with exit code 3', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          mode: 'hook',
        });
        expect(result.emit?.stdout).toContain('halted, guard malfunction');
        expect(result.emit?.stdout).toContain('please tell a human');
        expect(result.emit?.stderr?.code).toBe(3);
      });

      then('stderr contains escalation message', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          mode: 'hook',
        });
        expect(result.emit?.stderr?.reason).toContain('malfunctioned');
        expect(result.emit?.stderr?.reason).toContain('1.vision');
        expect(result.emit?.stderr?.reason).toContain('human must fix');
      });

      then('output mentions affected stone', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          mode: 'hook',
        });
        expect(result.emit?.stdout).toContain('stone = 1.vision');
      });
    });

    when('[t2] malfunction output snapshot', () => {
      then('output matches snapshot', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          mode: 'hook',
        });
        // replace temp path for snapshot stability
        const outputStable = result.emit?.stdout?.replace(
          scene.tempDir,
          '<ROUTE>',
        );
        expect(outputStable).toMatchSnapshot();
      });
    });
  });
});
