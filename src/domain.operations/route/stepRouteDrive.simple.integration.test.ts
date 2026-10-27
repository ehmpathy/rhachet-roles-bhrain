import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { DriveBlockerState } from './drive/DriveBlocker';
import { mutateDriveBlockerState } from './drive/mutateDriveBlockerState';
import { getRouteDriverCloneAddr } from './reminder/getRouteDriverCloneAddr';
import { stepRouteDrive } from './stepRouteDrive';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

/**
 * .what = a fresh `route.simple` clone whose drive state reads as if `hooks` onStop calls
 *         already landed on its first stone
 * .why = a threshold case once reached its count by a chain of real drive calls, each one a
 *        full drive under load, and each `then` leaned on the calls of the one before it. a
 *        seed through the state's own writer puts the count in one write, so each `then` makes
 *        one drive call and stands alone. the counts match the old chains call for call
 */
const genRouteAfterHooks = async (input: {
  slug: string;
  hooks: number;
}): Promise<{ tempDir: string }> => {
  const tempDir = genTempDir({
    slug: input.slug,
    clone: path.join(ASSETS_DIR, 'route.simple'),
  });
  await mutateDriveBlockerState({
    route: tempDir,
    project: () =>
      new DriveBlockerState({
        count: input.hooks,
        stone: '1.vision',
        brain: null,
      }),
  });
  return { tempDir };
};

describe('stepRouteDrive', () => {
  // run as a plain session, whatever the host: the drive's reminder sync keys on this serial
  // .note = deliberate mutation, scoped to this suite and restored after it
  const priorSerial = process.env.RHACHET_CLONE_SERIAL;
  beforeAll(() => {
    delete process.env.RHACHET_CLONE_SERIAL;
  });
  afterAll(() => {
    if (priorSerial !== undefined)
      process.env.RHACHET_CLONE_SERIAL = priorSerial;
  });

  given(
    '[case0] the suite runs on a host that may itself be a driver clone',
    () => {
      when('[t0] the suite reads which clone it drives', () => {
        /**
         * 🔴 .why = the drive's reminder sync keys on `RHACHET_CLONE_SERIAL`. a suite run from
         *          inside a driver clone inherited that serial, so every hook call here took the
         *          live reminder path against the host's own clone — real side effects, and ~1s
         *          per call that pushed the many-hook cases past their 30s cap under load. CI
         *          sets no serial, so only an enrolled host saw it
         */
        then(
          'it drives no clone — the host serial never reaches the suite',
          () => {
            expect(getRouteDriverCloneAddr()).toEqual(null);
          },
        );
      });
    },
  );

  given('[case1] route with incomplete stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'drive-incomplete',
        clone: path.join(ASSETS_DIR, 'route.simple'),
      });
      return { tempDir };
    });

    when('[t0] stepRouteDrive called in direct mode', () => {
      then('returns stone content and command options', async () => {
        const result = await stepRouteDrive({ route: scene.tempDir });
        expect(result.emit?.stdout).toContain('where were we?');
        expect(result.emit?.stdout).toContain('route.drive');
        expect(result.emit?.stdout).toContain('stone = 1.vision');
        // both options shown
        expect(result.emit?.stdout).toContain(
          'rhx route.stone.set --stone 1.vision --as arrived',
        );
        expect(result.emit?.stdout).toContain(
          'rhx route.stone.set --stone 1.vision --as passed',
        );
      });

      then('shows "are you here?" prompt with both options', async () => {
        const result = await stepRouteDrive({ route: scene.tempDir });
        expect(result.emit?.stdout).toContain('are you here?');
        expect(result.emit?.stdout).toContain('when ready for review, run:');
        expect(result.emit?.stdout).toContain('when ready to continue, run:');
      });

      then('includes stone content in output', async () => {
        const result = await stepRouteDrive({ route: scene.tempDir });
        expect(result.emit?.stdout).toContain("here's the stone");
        // the stone content should be included (from 1.vision.stone fixture)
        expect(result.emit?.stdout).toContain('illustrate the vision');
      });
    });

    when('[t1] stepRouteDrive called with when=hook.onStop', () => {
      then('returns stdout with stone content', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        expect(result.emit?.stdout).toContain('where were we?');
        expect(result.emit?.stdout).toContain('stone = 1.vision');
      });

      then(
        'returns stderr with code 2 and same content as stdout',
        async () => {
          const result = await stepRouteDrive({
            route: scene.tempDir,
            when: 'hook.onStop',
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
        // after 21 blocks, escalation occurs (exit code 1 = malfunction, stuck)
        const result1 = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        const result2 = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
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
        expect(result.emit?.stdout).toContain('route complete! 🌴🤙');
      });
    });

    when('[t1] stepRouteDrive called with when=hook.onStop', () => {
      then('returns null emit (silent, route done)', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
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
        // mask timestamp and hash, keep slug visible
        const outputStable = result.emit?.stdout?.replace(
          /\.temp\/genTempDir\.symlink\/[\dT.-]+Z\.([^.]+)\.[a-f0-9]+/,
          '.temp/genTempDir.symlink/<ts>.$1.<hash>',
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

    when('[t1] stepRouteDrive called with when=hook.onStop', () => {
      then('returns halted message with exit code 1', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        expect(result.emit?.stdout).toContain('halted, guard malfunction');
        // .retired = the prior intent "the halt defers to a human" ('please tell a human').
        //   a malfunction is driver-diagnosable (rule.always.diagnose-reviewer-malfunctions),
        //   so the halt copy now hands it to the driver; the negation clamps the retirement
        expect(result.emit?.stdout).toContain('still yours to clear');
        expect(result.emit?.stdout).not.toContain('please tell a human');
        expect(result.emit?.stderr?.code).toBe(1);
      });

      then('stderr contains escalation message', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        expect(result.emit?.stderr?.reason).toContain('malfunctioned');
        expect(result.emit?.stderr?.reason).toContain('1.vision');
        // .retired = the prior intent "a human must fix the malfunction" ('human must fix').
        //   same warrant as [t1] above: the malfunction is the driver's to diagnose and clear
        expect(result.emit?.stderr?.reason).toContain('it is yours to clear');
        expect(result.emit?.stderr?.reason).not.toContain('human must fix');
      });

      then('output mentions affected stone', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        expect(result.emit?.stdout).toContain('stone = 1.vision');
      });
    });

    when('[t2] malfunction output snapshot', () => {
      then('output matches snapshot', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        // mask timestamp and hash, keep slug visible
        const outputStable = result.emit?.stdout?.replace(
          /\.temp\/genTempDir\.symlink\/[\dT.-]+Z\.([^.]+)\.[a-f0-9]+/,
          '.temp/genTempDir.symlink/<ts>.$1.<hash>',
        );
        expect(outputStable).toMatchSnapshot();
      });
    });
  });

  given('[case6] drum nudge after 7+ hooks', () => {
    when('[t0] fewer than 7 hooks triggered', () => {
      // 3 prior hooks, so this call is the 4th
      const scene = useBeforeAll(async () =>
        genRouteAfterHooks({ slug: 'drive-nudge', hooks: 3 }),
      );

      then('output does NOT contain drum nudge', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        expect(result.emit?.stdout).not.toContain('walk the way');
        expect(result.emit?.stdout).not.toContain('tao te ching');
        // still shows the prompt
        expect(result.emit?.stdout).toContain('are you here?');
      });
    });

    when('[t1] 7 or more hooks triggered', () => {
      // 7 prior hooks, so this call is the 8th
      const scene = useBeforeAll(async () =>
        genRouteAfterHooks({ slug: 'drive-nudge', hooks: 7 }),
      );

      then('output contains drum nudge with tao te ching quote', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        expect(result.emit?.stdout).toContain('walk the way');
        expect(result.emit?.stdout).toContain('do your work, then step back');
        expect(result.emit?.stdout).toContain('tao te ching');
        // still shows the prompt and both options
        expect(result.emit?.stdout).toContain('are you here?');
        expect(result.emit?.stdout).toContain('--as arrived');
        expect(result.emit?.stdout).toContain('--as passed');
      });
    });

    when('[t2] nudge output snapshot', () => {
      // 10 prior hooks, so this call is the 11th
      const scene = useBeforeAll(async () =>
        genRouteAfterHooks({ slug: 'drive-nudge', hooks: 10 }),
      );

      then('output matches snapshot', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        // mask timestamp and hash, keep slug visible
        const outputStable = result.emit?.stdout?.replace(
          /\.temp\/genTempDir\.symlink\/[\dT.-]+Z\.([^.]+)\.[a-f0-9]+/,
          '.temp/genTempDir.symlink/<ts>.$1.<hash>',
        );
        expect(outputStable).toMatchSnapshot();
      });
    });
  });

  given('[case7] tea pause after 5+ hooks', () => {
    when('[t0] fewer than 6 hooks triggered', () => {
      // 3 prior hooks, so this call is the 4th
      const scene = useBeforeAll(async () =>
        genRouteAfterHooks({ slug: 'drive-tea-pause', hooks: 3 }),
      );

      then('output does NOT contain tea pause', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        expect(result.emit?.stdout).not.toContain('tea first');
        expect(result.emit?.stdout).not.toContain('to refuse is not an option');
        // still shows the standard prompt
        expect(result.emit?.stdout).toContain('are you here?');
      });
    });

    when('[t1] 6 or more hooks triggered', () => {
      // 6 prior hooks, so this call is the 7th (suggestBlocked = count > 5)
      const scene = useBeforeAll(async () =>
        genRouteAfterHooks({ slug: 'drive-tea-pause', hooks: 6 }),
      );

      then('output contains tea pause with all three options', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        // tea pause header
        expect(result.emit?.stdout).toContain('tea first');
        expect(result.emit?.stdout).toContain('choose your path');
        // all three options
        expect(result.emit?.stdout).toContain('--as arrived');
        expect(result.emit?.stdout).toContain('--as passed');
        expect(result.emit?.stdout).toContain('--as blocked');
        // mandate
        expect(result.emit?.stdout).toContain('to refuse is not an option');
        expect(result.emit?.stdout).toContain('work on the stone');
      });
    });

    when('[t2] tea pause snapshot', () => {
      // 9 prior hooks, so this call is the 10th
      const scene = useBeforeAll(async () =>
        genRouteAfterHooks({ slug: 'drive-tea-pause', hooks: 9 }),
      );

      then('output matches snapshot', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        // mask timestamp and hash, keep slug visible
        const outputStable = result.emit?.stdout?.replace(
          /\.temp\/genTempDir\.symlink\/[\dT.-]+Z\.([^.]+)\.[a-f0-9]+/,
          '.temp/genTempDir.symlink/<ts>.$1.<hash>',
        );
        expect(outputStable).toMatchSnapshot();
      });
    });
  });

  given('[case8] when=hook.onBoot with unpassed stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'drive-onboot-unpassed',
        clone: path.join(ASSETS_DIR, 'route.simple'),
      });
      return { tempDir };
    });

    when('[t0] stepRouteDrive called with when=hook.onBoot', () => {
      then('returns guidance without exit code (no block)', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onBoot',
        });
        expect(result.emit?.stdout).toContain('where were we?');
        expect(result.emit?.stdout).toContain('stone = 1.vision');
        // onBoot should NOT block - no stderr
        expect(result.emit?.stderr).toBeUndefined();
      });

      then('output matches snapshot', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onBoot',
        });
        // mask timestamp and hash, keep slug visible
        const outputStable = result.emit?.stdout?.replace(
          /\.temp\/genTempDir\.symlink\/[\dT.-]+Z\.([^.]+)\.[a-f0-9]+/,
          '.temp/genTempDir.symlink/<ts>.$1.<hash>',
        );
        expect(outputStable).toMatchSnapshot();
      });
    });
  });

  given('[case9] when=hook.onBoot with all stones passed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'drive-onboot-passed',
        clone: path.join(ASSETS_DIR, 'route.simple'),
      });

      // mark all stones passed
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

    when('[t0] stepRouteDrive called with when=hook.onBoot', () => {
      then('returns null emit (silent, route complete)', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onBoot',
        });
        expect(result.emit).toBeNull();
      });
    });
  });

  given('[case10] when=hook.onStop with unpassed stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'drive-onstop-unpassed',
        clone: path.join(ASSETS_DIR, 'route.simple'),
      });
      return { tempDir };
    });

    when('[t0] stepRouteDrive called with when=hook.onStop', () => {
      then('returns guidance with exit code 2 (block stop)', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        expect(result.emit?.stdout).toContain('where were we?');
        expect(result.emit?.stdout).toContain('stone = 1.vision');
        // onStop should block
        expect(result.emit?.stderr?.code).toBe(2);
      });

      then('output matches snapshot', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        // mask timestamp and hash, keep slug visible
        const outputStable = result.emit?.stdout?.replace(
          /\.temp\/genTempDir\.symlink\/[\dT.-]+Z\.([^.]+)\.[a-f0-9]+/,
          '.temp/genTempDir.symlink/<ts>.$1.<hash>',
        );
        expect(outputStable).toMatchSnapshot();
      });
    });
  });

  given('[case11] when=hook.onStop with all stones passed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'drive-onstop-passed',
        clone: path.join(ASSETS_DIR, 'route.simple'),
      });

      // mark all stones passed
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

    when('[t0] stepRouteDrive called with when=hook.onStop', () => {
      then('returns null emit (silent, ok to stop)', async () => {
        const result = await stepRouteDrive({
          route: scene.tempDir,
          when: 'hook.onStop',
        });
        expect(result.emit).toBeNull();
      });
    });
  });
});
