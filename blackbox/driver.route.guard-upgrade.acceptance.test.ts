import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-guard-upgrade');

/**
 * .what = stands up a fresh temp repo from the fixture + links the driver role
 * .why = each `given` gets its own isolated route so a mutating apply in one case
 *        never couples to another (rule.forbid.order-dependence)
 */
const setupRoute = async (slug: string): Promise<{ tempDir: string }> => {
  const tempDir = genTempDirForRhachet({ slug, clone: ASSETS_DIR });
  await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
  return { tempDir };
};

const readGuard = async (tempDir: string, name: string): Promise<string> =>
  fs.readFile(path.join(tempDir, 'route', name), 'utf-8');

/**
 * .what = acceptance tests for the route.guard.upgrade skill
 * .why = verifies the driver contract end-to-end: plan previews a diff, apply
 *        overwrites from provenance, guards without provenance skip, a blocked
 *        guard fails the whole apply, and --stone is a BOUNDARY match.
 */
describe('driver.route.guard-upgrade.acceptance', () => {
  given('[case1] a route with mixed guards', () => {
    const scene = useBeforeAll(async () => setupRoute('guard-upgrade-plan'));

    when('[t0] plan previews the whole route', () => {
      const result = useThen('the plan succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the execution guard shows an upgrade-available diff', () => {
        expect(result.stdout).toContain('upgrade available');
        expect(result.stdout).toContain('old frame');
        expect(result.stdout).toContain('new frame');
      });

      then('the vision guard reports skipped, no provenance', () => {
        expect(result.stdout).toContain('skipped, no provenance');
      });

      then('the kept guard reports kept, no change', () => {
        expect(result.stdout).toContain('kept, no change');
      });

      then('the kept and upgrade rows name their source template (from=)', () => {
        expect(result.stdout).toContain('from = templates/2.kept.guard');
        expect(result.stdout).toContain('from = templates/5.1.execution.guard');
      });

      then('the plan rollup counts upgrades as available, not upgraded', () => {
        expect(result.stdout).toContain('summary =');
        // plan mode: none written yet, so upgrades read "available"
        expect(result.stdout).toContain('available');
        expect(result.stdout).not.toContain('upgraded');
      });

      then('the blocked guard suppresses the clean to-apply hint', () => {
        expect(result.stdout).toContain('the way reveals itself');
        // this fixture holds 9.broken (absent-source), so a whole-route apply
        // would fail the B3 gate — the footer must caveat, not dangle a hint
        expect(result.stdout).toContain('1 guard blocked — a full apply is refused');
        expect(result.stdout).not.toContain(
          'to apply: rhx route.guard.upgrade --mode apply',
        );
      });

      then('no guard file was written', async () => {
        expect(await readGuard(scene.tempDir, '5.1.execution.guard')).toContain(
          'old frame',
        );
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] a single stone applied', () => {
    const scene = useBeforeAll(async () => setupRoute('guard-upgrade-apply'));

    when('[t0] apply --stone 5.1.execution', () => {
      const result = useThen('the apply succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', stone: '5.1.execution', mode: 'apply' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the decision reads upgraded, by provenance', () => {
        expect(result.stdout).toContain('upgraded, by provenance');
      });

      then('the guard now equals the source template', async () => {
        expect(await readGuard(scene.tempDir, '5.1.execution.guard')).toContain(
          'new frame',
        );
      });

      then('the so-it-is header is shown', () => {
        expect(result.stdout).toContain('so it is');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case3] a blocked guard among good ones (apply-all)', () => {
    const scene = useBeforeAll(async () => setupRoute('guard-upgrade-block'));

    when('[t0] apply the whole route with 9.broken present', () => {
      const result = useThen('the apply is blocked', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', mode: 'apply' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint)', () => {
        expect(result.code).toBe(2);
      });

      then('the error names the broken guard', () => {
        expect(result.stderr).toContain('9.broken.guard');
      });

      then('the good guard was NOT written (gate fires first)', async () => {
        expect(await readGuard(scene.tempDir, '5.1.execution.guard')).toContain(
          'old frame',
        );
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case4] --stone boundary match (5.1 not 5.10)', () => {
    const scene = useBeforeAll(async () =>
      setupRoute('guard-upgrade-boundary'),
    );

    when('[t0] plan --stone 5.1', () => {
      const result = useThen('the plan succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', stone: '5.1' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the 5.1 guard is in the plan', () => {
        expect(result.stdout).toContain('5.1.execution.guard');
      });

      then('the 5.10 lookalike is NOT swept in', () => {
        expect(result.stdout).not.toContain('5.10.other.guard');
      });

      then('the clean to-apply hint is shown (no blocked guard in scope)', () => {
        // the --stone filter isolates 5.1.execution (a clean upgrade), so this
        // plan CAN be applied whole — the footer shows the affordance, not a caveat
        expect(result.stdout).toContain(
          'to apply: rhx route.guard.upgrade --mode apply',
        );
        expect(result.stdout).not.toContain('blocked');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case5] no bound route and no --route', () => {
    const scene = useBeforeAll(async () => setupRoute('guard-upgrade-noroute'));

    when('[t0] upgrade without a route target', () => {
      const result = useThen('it fails loud', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toBe(0);
      });

      then('the error asks to bind a route or pass --route', () => {
        expect(result.stderr.toLowerCase()).toContain('route');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case6] --help', () => {
    const scene = useBeforeAll(async () => setupRoute('guard-upgrade-help'));

    when('[t0] help is requested', () => {
      const result = useThen('help prints', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { help: true },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the boundary-match semantics are documented', () => {
        expect(result.stdout).toContain('BOUNDARY match');
        expect(result.stdout).toContain('5.10.x');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case7] a guard whose template carries a stray $FOO (apply)', () => {
    const scene = useBeforeAll(async () => {
      const setup = await setupRoute('guard-upgrade-unknownvar');
      // seed an isolated unknown-var scenario into this case's own temp route so
      // the shared fixture's snapshots stay untouched
      const template = [
        'provenance:',
        '  uri: templates/4.unknownvar.guard',
        '',
        'artifacts:',
        '  - $route/4unknown.md',
        '',
        'judges:',
        '  - echo "$FOO"',
      ].join('\n');
      const local = [
        'provenance:',
        '  uri: templates/4.unknownvar.guard',
        '',
        'artifacts:',
        '  - $route/4unknown.md',
        '',
        'judges:',
        '  - echo "local"',
      ].join('\n');
      await fs.writeFile(
        path.join(setup.tempDir, 'templates', '4.unknownvar.guard'),
        template,
      );
      await fs.writeFile(
        path.join(setup.tempDir, 'route', '4.unknownvar.guard'),
        local,
      );
      return setup;
    });

    when('[t0] apply --stone 4.unknownvar', () => {
      const result = useThen('the apply is blocked', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', stone: '4.unknownvar', mode: 'apply' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint)', () => {
        expect(result.code).toBe(2);
      });

      then('the error names the blocked guard', () => {
        expect(result.stderr).toContain('4.unknownvar.guard');
      });

      then('the guard file is NOT written', async () => {
        expect(await readGuard(scene.tempDir, '4.unknownvar.guard')).toContain(
          'echo "local"',
        );
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });

    when('[t1] plan --stone 4.unknownvar (non-fatal preview)', () => {
      const result = useThen('the plan succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', stone: '4.unknownvar' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (plan never fails)', () => {
        expect(result.code).toBe(0);
      });

      then('the unknown-var row names $FOO', () => {
        expect(result.stdout).toContain('$FOO');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case8] an invalid --mode value', () => {
    const scene = useBeforeAll(async () => setupRoute('guard-upgrade-badmode'));

    when('[t0] --mode is neither plan nor apply', () => {
      const result = useThen('it fails loud', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', mode: 'bogus' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint)', () => {
        expect(result.code).toBe(2);
      });

      then('the error names the mode constraint', () => {
        expect(result.stderr.toLowerCase()).toContain('mode');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case9] a --stone that hits no guard', () => {
    const scene = useBeforeAll(async () => setupRoute('guard-upgrade-nomatch'));

    when('[t0] plan --stone 9.absent', () => {
      const result = useThen('it fails loud', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', stone: '9.absent' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint)', () => {
        expect(result.code).toBe(2);
      });

      then('the error lists the available stones', () => {
        expect(result.stderr).toContain('no guard matched');
        expect(result.stderr).toContain('5.1.execution');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case10] a guard whose template fails to parse (invalid-source)', () => {
    const scene = useBeforeAll(async () => {
      const setup = await setupRoute('guard-upgrade-invalidsource');
      // seed a template that parseStoneGuard rejects (self+peer slug clash),
      // plus a route guard whose provenance points at it
      const badTemplate = [
        'reviews:',
        '  self:',
        '    - slug: dup',
        '      say: "hi"',
        '  peer:',
        '    - slug: dup',
        '      run: echo hi',
      ].join('\n');
      const local = [
        'provenance:',
        '  uri: templates/6.invalid.guard',
        '',
        'artifacts:',
        '  - $route/x.md',
        '',
        'judges:',
        '  - echo "local"',
      ].join('\n');
      await fs.writeFile(
        path.join(setup.tempDir, 'templates', '6.invalid.guard'),
        badTemplate,
      );
      await fs.writeFile(
        path.join(setup.tempDir, 'route', '6.invalid.guard'),
        local,
      );
      return setup;
    });

    when('[t0] plan --stone 6.invalid (non-fatal preview)', () => {
      const result = useThen('the plan succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', stone: '6.invalid' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (plan never fails)', () => {
        expect(result.code).toBe(0);
      });

      then('the row reports invalid source', () => {
        expect(result.stdout).toContain('invalid source');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] apply --stone 6.invalid (blocked)', () => {
      const result = useThen('the apply is blocked', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', stone: '6.invalid', mode: 'apply' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint)', () => {
        expect(result.code).toBe(2);
      });

      then('the error names the invalid guard', () => {
        expect(result.stderr).toContain('6.invalid.guard');
      });

      then('the guard file is NOT written', async () => {
        expect(await readGuard(scene.tempDir, '6.invalid.guard')).toContain(
          'echo "local"',
        );
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case11] an explicit --route that does not exist', () => {
    const scene = useBeforeAll(async () => setupRoute('guard-upgrade-badroute'));

    when('[t0] --route points at a mistyped dir', () => {
      const result = useThen('it fails loud', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'tpyo-does-not-exist' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint, not a false success)', () => {
        expect(result.code).toBe(2);
      });

      then('the error names route-not-found, not no-guard-matched', () => {
        expect(result.stderr).toContain('route not found');
        expect(result.stderr).toContain('tpyo-does-not-exist');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case12] an upgrade whose stone is already passed (N6 note)', () => {
    const scene = useBeforeAll(async () => {
      const setup = await setupRoute('guard-upgrade-passed');
      // seed a passage record that marks the target stone as already passed
      await fs.mkdir(path.join(setup.tempDir, 'route', '.route'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(setup.tempDir, 'route', '.route', 'passage.jsonl'),
        `${JSON.stringify({ stone: '5.1.execution', status: 'passed' })}\n`,
      );
      return setup;
    });

    when('[t0] plan --stone 5.1.execution', () => {
      const result = useThen('the plan succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', stone: '5.1.execution' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the already-passed advisory note is shown', () => {
        expect(result.stdout).toContain('already passed under the prior guard');
      });

      then('the plan leaves passage.jsonl byte-unchanged', async () => {
        const passage = await fs.readFile(
          path.join(scene.tempDir, 'route', '.route', 'passage.jsonl'),
          'utf-8',
        );
        expect(passage).toEqual(
          `${JSON.stringify({ stone: '5.1.execution', status: 'passed' })}\n`,
        );
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case15] an upgrade whose stone is approved but not passed', () => {
    const scene = useBeforeAll(async () => {
      const setup = await setupRoute('guard-upgrade-approved');
      // seed a passage record that marks the target stone as approved (not passed)
      await fs.mkdir(path.join(setup.tempDir, 'route', '.route'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(setup.tempDir, 'route', '.route', 'passage.jsonl'),
        `${JSON.stringify({ stone: '5.1.execution', status: 'approved' })}\n`,
      );
      return setup;
    });

    when('[t0] plan --stone 5.1.execution', () => {
      const result = useThen('the plan succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', stone: '5.1.execution' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the approved-not-passed advisory note is shown', () => {
        expect(result.stdout).toContain('approved but not yet passed');
        expect(result.stdout).toContain(
          'changes the rules its pass will be judged against',
        );
      });

      then('the plan leaves passage.jsonl byte-unchanged', async () => {
        const passage = await fs.readFile(
          path.join(scene.tempDir, 'route', '.route', 'passage.jsonl'),
          'utf-8',
        );
        expect(passage).toEqual(
          `${JSON.stringify({ stone: '5.1.execution', status: 'approved' })}\n`,
        );
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case13] an upgrade that reverts a peer-budget grant (B4)', () => {
    const scene = useBeforeAll(async () => {
      const setup = await setupRoute('guard-upgrade-budgetgrant');
      // the route guard carries a human-raised budget (5); the template reverts it (3)
      const peerGuard = (budget: number): string =>
        [
          'provenance:',
          '  uri: templates/8.budgetgrant.guard',
          '',
          'artifacts:',
          '  - $route/x.md',
          '',
          'reviews:',
          '  peer:',
          '    - slug: r-arch',
          '      run: echo review',
          `      budget: ${budget}`,
          '',
          'judges:',
          '  - echo judge',
        ].join('\n');
      await fs.writeFile(
        path.join(setup.tempDir, 'templates', '8.budgetgrant.guard'),
        peerGuard(3),
      );
      await fs.writeFile(
        path.join(setup.tempDir, 'route', '8.budgetgrant.guard'),
        peerGuard(5),
      );
      return setup;
    });

    when('[t0] plan --stone 8.budgetgrant', () => {
      const result = useThen('the plan succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', stone: '8.budgetgrant' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the budget-clobber note names the reviewer and delta', () => {
        expect(result.stdout).toContain('reverts a budget grant on r-arch');
        expect(result.stdout).toContain('5 → 3');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case14] apply-all success (no blocker guard)', () => {
    const scene = useBeforeAll(async () => {
      const setup = await setupRoute('guard-upgrade-applyall');
      // drop the one blocker guard so the whole-route apply lands cleanly:
      // 5.1.execution + 5.10.other upgrade, 2.kept kept, 1.vision skip
      await fs.rm(path.join(setup.tempDir, 'route', '9.broken.guard'));
      return setup;
    });

    when('[t0] apply the whole route (no --stone)', () => {
      const result = useThen('the apply succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', mode: 'apply' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('both provenance guards report upgraded, by provenance', () => {
        expect(result.stdout).toContain('upgraded, by provenance');
      });

      then('the kept guard reports kept, no change', () => {
        expect(result.stdout).toContain('kept, no change');
      });

      then('the vision guard reports skipped, no provenance', () => {
        expect(result.stdout).toContain('skipped, no provenance');
      });

      then('the so-it-is header and rollup summary are shown', () => {
        expect(result.stdout).toContain('so it is');
        expect(result.stdout).toContain('summary =');
      });

      then('the upgraded guards now equal their source templates', async () => {
        expect(await readGuard(scene.tempDir, '5.1.execution.guard')).toContain(
          'new frame',
        );
        expect(await readGuard(scene.tempDir, '5.10.other.guard')).toContain(
          'new ten',
        );
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case16] one route, all six decision states, one plan', () => {
    const scene = useBeforeAll(async () => {
      const setup = await setupRoute('guard-upgrade-sixstate');
      // fixture already gives skip (1.vision), kept (2.kept), upgrade
      // (5.1.execution + 5.10.other), absent-source (9.broken). seed the two
      // residual states so ONE plan-all exercises all six at once.
      const invalidTemplate = [
        'reviews:',
        '  self:',
        '    - slug: dup',
        '      say: "hi"',
        '  peer:',
        '    - slug: dup',
        '      run: echo hi',
      ].join('\n');
      const invalidLocal = [
        'provenance:',
        '  uri: templates/6.invalid.guard',
        '',
        'artifacts:',
        '  - $route/x.md',
        '',
        'judges:',
        '  - echo "local"',
      ].join('\n');
      const unknownvarTemplate = [
        'provenance:',
        '  uri: templates/4.unknownvar.guard',
        '',
        'artifacts:',
        '  - $route/4unknown.md',
        '',
        'judges:',
        '  - echo "$FOO"',
      ].join('\n');
      const unknownvarLocal = [
        'provenance:',
        '  uri: templates/4.unknownvar.guard',
        '',
        'artifacts:',
        '  - $route/4unknown.md',
        '',
        'judges:',
        '  - echo "local"',
      ].join('\n');
      await fs.writeFile(
        path.join(setup.tempDir, 'templates', '6.invalid.guard'),
        invalidTemplate,
      );
      await fs.writeFile(
        path.join(setup.tempDir, 'route', '6.invalid.guard'),
        invalidLocal,
      );
      await fs.writeFile(
        path.join(setup.tempDir, 'templates', '4.unknownvar.guard'),
        unknownvarTemplate,
      );
      await fs.writeFile(
        path.join(setup.tempDir, 'route', '4.unknownvar.guard'),
        unknownvarLocal,
      );
      return setup;
    });

    when('[t0] plan the whole route (no --stone)', () => {
      const result = useThen('the plan succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (plan never fails, even with blockers present)', () => {
        expect(result.code).toBe(0);
      });

      then('all six decision states render in the one plan', () => {
        expect(result.stdout).toContain('skipped, no provenance');
        expect(result.stdout).toContain('kept, no change');
        expect(result.stdout).toContain('upgrade available');
        expect(result.stdout).toContain('absent source');
        expect(result.stdout).toContain('invalid source');
        expect(result.stdout).toContain('unknown var: $FOO');
      });

      then('the plan writes zero guards across the whole mixed set', async () => {
        expect(await readGuard(scene.tempDir, '5.1.execution.guard')).toContain(
          'old frame',
        );
        expect(await readGuard(scene.tempDir, '6.invalid.guard')).toContain(
          'echo "local"',
        );
        expect(await readGuard(scene.tempDir, '4.unknownvar.guard')).toContain(
          'echo "local"',
        );
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case17] a route directory with no guard files', () => {
    const scene = useBeforeAll(async () => {
      const setup = await setupRoute('guard-upgrade-empty');
      // a real, present route dir that simply holds zero .guard files — a
      // distinct output variant (blueprint i011.r012.4) that must be snapped
      await fs.mkdir(path.join(setup.tempDir, 'emptyroute'), {
        recursive: true,
      });
      return setup;
    });

    when('[t0] plan an empty route', () => {
      const result = useThen('the plan succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'emptyroute' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (a benign no-op, not a failure)', () => {
        expect(result.code).toBe(0);
      });

      then('the summary reads no guards and no apply hint is shown', () => {
        expect(result.stdout).toContain('summary = no guards');
        expect(result.stdout).not.toContain('to apply:');
        expect(result.stdout).not.toContain('blocked');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case18] a template with a copy-time var AND a runtime var (uc.6)', () => {
    const scene = useBeforeAll(async () => {
      const setup = await setupRoute('guard-upgrade-varreplay');
      // the template carries BOTH $BEHAVIOR_DIR_REL (a copy-time var, replayed at
      // upgrade to the route's rel dir) AND $route (a runtime var, left LITERAL).
      // this proves the two substitution passes do not interfere (vision uc.6).
      const template = [
        'provenance:',
        '  uri: templates/varreplay.guard',
        '',
        'artifacts:',
        '  - $BEHAVIOR_DIR_REL/x.md',
        '',
        'judges:',
        '  - echo "new $route"',
      ].join('\n');
      const local = [
        'provenance:',
        '  uri: templates/varreplay.guard',
        '',
        'artifacts:',
        '  - route/x.md',
        '',
        'judges:',
        '  - echo "old $route"',
      ].join('\n');
      await fs.writeFile(
        path.join(setup.tempDir, 'templates', 'varreplay.guard'),
        template,
      );
      await fs.writeFile(
        path.join(setup.tempDir, 'route', '3.varreplay.guard'),
        local,
      );
      return setup;
    });

    when('[t0] apply --stone 3.varreplay', () => {
      const result = useThen('the apply succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.upgrade',
          args: { route: 'route', stone: '3.varreplay', mode: 'apply' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the copy-time var is replayed to the route rel dir', async () => {
        const guard = await readGuard(scene.tempDir, '3.varreplay.guard');
        // $BEHAVIOR_DIR_REL was replaced with the route's rel dir ("route")
        expect(guard).not.toContain('$BEHAVIOR_DIR_REL');
        expect(guard).toContain('route/x.md');
      });

      then('the runtime var is left literal', async () => {
        const guard = await readGuard(scene.tempDir, '3.varreplay.guard');
        // $route is a runtime var — it must survive the upgrade unsubstituted
        expect(guard).toContain('echo "new $route"');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
