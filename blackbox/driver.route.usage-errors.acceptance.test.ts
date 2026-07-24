import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-halt');

/**
 * .what = acceptance coverage for the CLI usage-error paths of route.guard.budget
 *         and route.mutate grant — invalid input exits with a constraint code (2)
 *         and writes its guidance to stderr (not stdout)
 * .why = these invalid-input paths carry semantic exit codes + send the error to
 *        stderr (rule.require.exit-code-semantics + rule.forbid.stdout-on-exit-errors);
 *        without a contract-boundary test a future change could silently regress
 *        the exit code or leak the error to stdout (hidden on a non-zero exit).
 *
 * .note = each path validates and exits BEFORE any route/branch lookup, so no bound
 *         route is needed — only the linked driver skills.
 */
describe('driver.route.usage-errors.acceptance', () => {
  given('[case1] route.guard.budget with a non-numeric --add', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-budget-add',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-budget', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] --add is not a positive integer', () => {
      const result = useThen('the budget command rejects the input', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: 'abc', stone: '1.feature' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller must fix the value)', () => {
        // a malformed --add is bad user input, not a server malfunction:
        // exit 2 per rule.require.exit-code-semantics (0 ok, 1 malfunction, 2 constraint)
        expect(result.code).toEqual(2);
      });

      then('the error is on stderr, not stdout', () => {
        // rule.forbid.stdout-on-exit-errors: stdout may be hidden on a non-zero exit
        expect(result.stderr).toContain('--add must be a positive integer');
        expect(result.stdout).not.toContain('--add must be a positive integer');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('budget --add non-numeric');
      });
    });
  });

  given('[case2] route.mutate grant with an invalid action', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-mutate-grant',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-mutate', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the grant action is not allow|block|get', () => {
      const result = useThen('the mutate command rejects the action', async () =>
        invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'bogus' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller must fix the action)', () => {
        expect(result.code).toEqual(2);
      });

      then('the usage guidance is on stderr, not stdout', () => {
        // rule.forbid.stdout-on-exit-errors: the usage text is an error path
        expect(result.stderr).toContain('route.mutate grant');
        expect(result.stdout).not.toContain('route.mutate grant');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('mutate grant invalid-action');
      });
    });
  });

  given('[case3] route.guard.budget with an absent --add', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-budget-noadd',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-budget-noadd', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the required --add flag is omitted', () => {
      const result = useThen('the budget command rejects the invocation', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', stone: '1.feature' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller must add the flag)', () => {
        // an absent required flag is bad invocation, not a server malfunction:
        // exit 2 per rule.require.exit-code-semantics (0 ok, 1 malfunction, 2 constraint)
        expect(result.code).toEqual(2);
      });

      then('the usage guidance is on stderr, not stdout', () => {
        // rule.forbid.stdout-on-exit-errors: the usage text is an error path
        expect(result.stderr).toContain('route.guard.budget');
        expect(result.stdout).not.toContain('route.guard.budget');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('budget --add absent');
      });
    });
  });
});
