import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-halt');

/**
 * .what = acceptance tests for the driver-wall (--as blocked) and exhausted halts,
 *         exercised through the real route.drive CLI entrypoint
 * .why = the halt experience must be verified + snapped at the contract boundary (not only
 *        at the stepRouteDrive integration level), so the blocked/exhausted output cannot
 *        drift at the CLI without detection (rule.forbid.friction-hazards). the malfunction
 *        halt already has acceptance coverage; this closes the driver-wall + exhausted gap.
 *
 * .note = the route-halt fixture's stone carries NO guard, so the halt is driven purely by
 *         the seeded passage status (a driver wall / an exhausted budget) — not by a guard
 *         blocker — which is exactly the disposition path under test.
 */
describe('driver.route.halt.acceptance', () => {
  // =========================================================================
  // DRIVER WALL (--as blocked, no guard blocker) → halt ✋
  // =========================================================================

  given('[case1] a driver-wall blocked stone (status blocked, no blocker)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'halt-blocked',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-halt-blocked', {
        cwd: tempDir,
      });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      // artifact so the stone is the current (unpassed) stone
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );
      // seed a driver wall: status 'blocked' with NO guard blocker
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1.feature', status: 'blocked' }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] route.drive is invoked in direct mode (no --when)', () => {
      const result = useThen('route.drive surfaces the wall', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (direct mode never blocks)', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout names the driver-wall halt', () => {
        expect(result.stdout).toContain('marked blocked');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] a driver-wall blocked stone, read at onBoot', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'halt-blocked-boot',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-halt-blocked-boot', {
        cwd: tempDir,
      });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1.feature', status: 'blocked' }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] route.drive is invoked with --when hook.onBoot', () => {
      const result = useThen('onBoot surfaces the wall', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onBoot' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (onBoot never blocks boot)', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout names the driver-wall halt', () => {
        expect(result.stdout).toContain('marked blocked');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // =========================================================================
  // EXHAUSTED (peer budget spent) → halt 👋
  // =========================================================================

  given('[case3] an exhausted-budget stone (status exhausted)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'halt-exhausted',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-halt-exhausted', {
        cwd: tempDir,
      });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      // seed an exhausted status: peer budget spent, a human must approve or extend
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1.feature',
          status: 'exhausted',
          reason: 'peer reviewer budget exhausted: limited',
        }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] route.drive is invoked in direct mode (no --when)', () => {
      const result = useThen('route.drive surfaces the exhausted halt', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (direct mode never blocks)', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout prompts the human to approve or extend the budget', () => {
        expect(result.stdout).toContain('budget');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case4] an exhausted-budget stone, read at onBoot', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'halt-exhausted-boot',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-halt-exhausted-boot', {
        cwd: tempDir,
      });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1.feature',
          status: 'exhausted',
          reason: 'peer reviewer budget exhausted: limited',
        }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] route.drive is invoked with --when hook.onBoot', () => {
      const result = useThen('onBoot surfaces the exhausted halt', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onBoot' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (onBoot never blocks boot)', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout prompts the human to approve or extend the budget', () => {
        expect(result.stdout).toContain('budget');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // =========================================================================
  // onStop PARITY — a halt at onStop ALLOWS the stop (exit 0), never blocks it.
  // onStop is the crux of the wish (the push-vs-halt disposition); these cases
  // prove the halt glyphs surface through the real CLI at onStop, not only at
  // the stepRouteDrive integration grain.
  // =========================================================================

  given('[case5] a driver-wall blocked stone, read at onStop', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'halt-blocked-stop',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-halt-blocked-stop', {
        cwd: tempDir,
      });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1.feature', status: 'blocked' }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] route.drive is invoked with --when hook.onStop', () => {
      const result = useThen('onStop allows the stop at the wall', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onStop' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (a halt allows the stop, never blocks it)', () => {
        // a driver wall is a halt(blocked) → the route will not self-drive, so
        // onStop lets the session stop (exit 0) instead of the push exit 2
        expect(result.code).toEqual(0);
      });

      then('stdout names the driver-wall halt', () => {
        expect(result.stdout).toContain('marked blocked');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case6] an exhausted-budget stone, read at onStop', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'halt-exhausted-stop',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-halt-exhausted-stop', {
        cwd: tempDir,
      });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1.feature',
          status: 'exhausted',
          reason: 'peer reviewer budget exhausted: limited',
        }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] route.drive is invoked with --when hook.onStop', () => {
      const result = useThen(
        'onStop allows the stop on the exhausted halt',
        async () =>
          invokeRouteSkill({
            skill: 'route.drive',
            args: { when: 'hook.onStop' },
            cwd: scene.tempDir,
          }),
      );

      then('exit code is 0 (a halt allows the stop, never blocks it)', () => {
        // exhausted is a halt(exhausted) → a human must approve or extend, so
        // onStop lets the session stop (exit 0) instead of the push exit 2
        expect(result.code).toEqual(0);
      });

      then('stdout prompts the human to approve or extend the budget', () => {
        expect(result.stdout).toContain('budget');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // =========================================================================
  // MALFUNCTION (a reviewer/judge broke) → halt 💥 at onStop
  // the third halt type: unlike the driver-wall/exhausted halts (exit 0), a
  // malfunction halt allows the stop but escalates with exit 1, so the broken
  // reviewer/judge reaches a human (rule.require.exit-code-semantics: 1 =
  // malfunction). this closes the CLI-grain onStop gap so all three halt types
  // (blocked ✋ / exhausted 👋 / malfunction 💥) have blackbox onStop proof.
  // =========================================================================

  given('[case7] a malfunctioned stone, read at onStop', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'halt-malfunction-stop',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-halt-malfunction-stop', {
        cwd: tempDir,
      });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      // seed a malfunction status: a reviewer or judge broke, a human must fix
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1.feature', status: 'malfunction' }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] route.drive is invoked with --when hook.onStop', () => {
      const result = useThen(
        'onStop allows the stop but escalates the malfunction',
        async () =>
          invokeRouteSkill({
            skill: 'route.drive',
            args: { when: 'hook.onStop' },
            cwd: scene.tempDir,
          }),
      );

      then('exit code is 1 (a malfunction escalates, never blocks the stop)', () => {
        // malfunction is a halt(malfunction) → the stop is allowed (not exit 2),
        // but the exit-1 escalation code carries the broken state to a human
        expect(result.code).toEqual(1);
      });

      then('output names the malfunction halt', () => {
        const combined = result.stdout + result.stderr;
        expect(combined.toLowerCase()).toContain('malfunction');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
