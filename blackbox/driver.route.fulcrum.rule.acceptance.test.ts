import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-dispute-passage');

/**
 * .what = the `route.fulcrum.rule` cli surface, from the outside: each refusal a caller can meet
 * .why = the verb is the one human lever that rules a dispute. its success path needs a human
 *        tty on stdin, which no spawned test holds (no env hatch, by design), so the surface a
 *        test CAN reach — every refusal, and the refusal of a non-human caller — is pinned here.
 *        the write itself, and each refusal that only a tty caller can meet (an unknown case,
 *        unreadable frontmatter, a fulcrum that owes reflect or none), is proven and snapped at
 *        integration grain (`setFulcrumVerdict.integration.test.ts`)
 */
describe('driver.route.fulcrum.rule.acceptance', () => {
  const scene = useBeforeAll(async () => {
    const tempDir = genTempDirForRhachet({
      slug: 'fulcrum-rule',
      clone: ASSETS_DIR,
    });
    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
    return { tempDir };
  });

  given('[case1] a route with one disputed fulcrum, F001', () => {
    when('[t0] the caller omits --case', () => {
      const result = useThen('it is refused', async () =>
        invokeRouteSkill({
          skill: 'route.fulcrum.rule',
          args: { route: '.', as: 'upheld' },
          cwd: scene.tempDir,
        }),
      );

      then('it exits 2, a constraint', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal names the fix', () => {
        expect(result.stderr).toContain('--case is required');
        expect(result.stderr).toContain(
          'rhx route.fulcrum.rule --case F44 --as upheld|conceded',
        );
      });

      then('the refusal is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'refused, --case absent',
        );
      });
    });

    when('[t1] the caller passes a verdict outside the closed set', () => {
      const result = useThen('it is refused', async () =>
        invokeRouteSkill({
          skill: 'route.fulcrum.rule',
          args: { route: '.', case: 'F001', as: 'maybe' },
          cwd: scene.tempDir,
        }),
      );

      then('it exits 2, a constraint', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal names both verdicts and the fix', () => {
        expect(result.stderr).toContain('--as must be upheld or conceded');
        expect(result.stderr).toContain(
          'rhx route.fulcrum.rule --case F001 --as upheld|conceded',
        );
      });

      then('the refusal is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'refused, --as outside upheld|conceded',
        );
      });
    });

    when('[t2] a spawned caller with no tty rules F001', () => {
      const result = useThen('it is refused', async () =>
        invokeRouteSkill({
          skill: 'route.fulcrum.rule',
          args: { route: '.', case: 'F001', as: 'upheld' },
          cwd: scene.tempDir,
        }),
      );

      then('🔴 it exits 2 — only a human may rule a dispute', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal says a human must run it', () => {
        expect(result.stderr).toContain('human');
      });

      then('the refusal is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'refused, the caller holds no tty',
        );
      });
    });

    when('[t3] the caller asks for --help', () => {
      const result = useThen('the help prints', async () =>
        invokeRouteSkill({
          skill: 'route.fulcrum.rule',
          args: { help: true },
          cwd: scene.tempDir,
        }),
      );

      then('it exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('the help names both flags and both verdicts', () => {
        expect(result.stdout).toContain('--case <id>');
        expect(result.stdout).toContain('upheld');
        expect(result.stdout).toContain('conceded');
      });

      then('the help is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'route.fulcrum.rule --help',
        );
      });
    });
  });
});
