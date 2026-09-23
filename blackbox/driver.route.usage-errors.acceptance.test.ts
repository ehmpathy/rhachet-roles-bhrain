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

  /**
   * 🔴 .the three cases below are the CLAMP on i005/r009 n1 + n2.
   *
   *    `route.guard.budget` has FOUR flag-fault paths and `[case3]` pinned one of them. the other
   *    three — `--for` absent, `--stone` absent, `--for` wrong-value — each render guidance this
   *    behavior authored (the refusal-by-default note, the three warrant conjuncts, the harm set)
   *    and none was exercised. so a revert of any one to a truncated usage — the exact defect
   *    i003/r009 n1 removed — would have shipped green.
   *
   *    ⇒ every flag-fault path of this command now carries a live pin, and each asserts the same
   *      three properties: exit 2, guidance on stderr, and the warrant text actually present
   *      (`rule.forbid.friction-hazards`, `rule.require.errors-name-the-fix`).
   */
  given('[case3b] route.guard.budget with an absent --for', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-budget-nofor',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-budget-nofor', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the required --for flag is omitted', () => {
      const result = useThen(
        'the budget command rejects the invocation',
        async () =>
          invokeRouteSkill({
            skill: 'route.guard.budget',
            args: { add: '3', stone: '1.feature' },
            cwd: scene.tempDir,
          }),
      );

      then('exit code is 2 (constraint — the caller must add the flag)', () => {
        expect(result.code).toEqual(2);
      });

      then('the guidance is on stderr, not stdout', () => {
        // rule.forbid.stdout-on-exit-errors: stdout may be hidden on a non-zero exit
        expect(result.stderr).toContain('--for is required');
        expect(result.stdout).not.toContain('--for is required');
      });

      then('🔴 the hoisted warrant guidance rides the fault', () => {
        // the whole point of the hoist: an omitted flag teaches the gate, never a bare one-liner
        expect(result.stderr).toContain('route.guard.budget');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('budget --for absent');
      });
    });
  });

  given('[case3c] route.guard.budget with an absent --stone', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-budget-nostone',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-budget-nostone', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the required --stone flag is omitted', () => {
      const result = useThen(
        'the budget command rejects the invocation',
        async () =>
          invokeRouteSkill({
            skill: 'route.guard.budget',
            args: { for: 'review', add: '3' },
            cwd: scene.tempDir,
          }),
      );

      then('exit code is 2 (constraint — the caller must add the flag)', () => {
        expect(result.code).toEqual(2);
      });

      then('the guidance is on stderr, not stdout', () => {
        expect(result.stderr).toContain('--stone is required');
        expect(result.stdout).not.toContain('--stone is required');
      });

      then('🔴 the hoisted warrant guidance rides the fault', () => {
        expect(result.stderr).toContain('route.guard.budget');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('budget --stone absent');
      });
    });
  });

  given('[case3d] route.guard.budget with a wrong-value --for', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-budget-badfor',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-budget-badfor', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] --for carries a value the flag does not accept', () => {
      const result = useThen(
        'the budget command rejects the invocation',
        async () =>
          invokeRouteSkill({
            skill: 'route.guard.budget',
            args: { for: 'reveiw', add: '3', stone: '1.feature' },
            cwd: scene.tempDir,
          }),
      );

      then('exit code is 2 (constraint — the caller must fix the value)', () => {
        expect(result.code).toEqual(2);
      });

      then('🔴 the error names BOTH the value given and the value wanted', () => {
        // rule.require.errors-name-the-fix: the bare form named only what was typed, so a driver
        // who did not already know the one legal value had to guess (raised i005/r009 n1)
        expect(result.stderr).toContain('reveiw');
        expect(result.stderr).toContain('"review"');
      });

      then('🔴 a wrong value earns the same guidance an absent one does', () => {
        // the defect this clamps: a four-way split on one command, where an omitted flag taught
        // the gate and a typo'd one taught naught
        expect(result.stderr).toContain('route.guard.budget');
        expect(result.stdout).not.toContain('route.guard.budget');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('budget --for wrong value');
      });
    });
  });

  /**
   * 🔴 .the two `--help` cases are the CLAMP on i001/r009 n1.
   *
   *    both commands rebuilt their guidance in this behavior — the three-conjunct warrant note on
   *    `route.guard.budget`, the `human only — refused without a tty` line on `route.mutate grant`
   *    — and neither handler checked `options.help`. so `--help` fell through to a required-flag
   *    error and an invalid-action error respectively: exit 2, on stderr, with the guidance the
   *    caller asked for either truncated or unasked-for.
   *
   *    ⇒ the clamp is the pair (exit 0, stdout), and it goes red the instant either early return
   *      is dropped — a `--help` that errors reads as a broken command
   *      (`rule.require.help-on-demand`, `rule.require.exit-code-semantics`).
   *
   * ⚠️ these two are NOT usage ERRORS, and they sit in this file on purpose: an ask and the fault
   *    it used to be mistaken for are one another's control, so they are read side by side.
   */
  given('[case4] route.guard.budget --help', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-budget-help',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-budget-help', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] --help is asked for, with no other flag', () => {
      const result = useThen('the command answers the ask', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { help: true },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 — an ask is never a fault', () => {
        expect(result.code).toEqual(0);
      });

      then('the help is on stdout, and no error is emitted', () => {
        expect(result.stdout).toContain('route.guard.budget - extend peer');
        expect(result.stdout).toContain('--help');
        expect(result.stderr).not.toContain('error:');
      });

      then('🔴 the guidance this behavior authored is reachable', () => {
        // the whole reason --help matters here: the warrant rules are NEW, so a driver types
        // --help precisely to learn them
        expect(result.stdout).toContain('the grant is REFUSED by default');
        expect(result.stdout).toContain('a live URGENT concession on the stone');
        expect(result.stdout).toContain('a target reviewer that has run dry');
        expect(result.stdout).toContain('a --stone that named one stone');
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('budget --help');
      });
    });
  });

  given('[case5] route.mutate grant --help', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-mutate-help',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-mutate-help', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    // 🔴 the action is the SAME invalid one `[case2]` sends, so the two are a matched pair: one
    //    flag apart, and the whole verdict inverts — exit 2 on stderr becomes exit 0 on stdout.
    //    that is what proves the early return is reached BEFORE the action is judged, which is the
    //    property `--help` needs and the one the command lacked
    when('[t0] --help rides an action the command would reject', () => {
      const result = useThen('the command answers the ask', async () =>
        invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'bogus', help: true },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 — an ask is never a fault', () => {
        expect(result.code).toEqual(0);
      });

      then('the help is on stdout, and no action is judged', () => {
        expect(result.stdout).toContain(
          'route.mutate grant - manage route protection privilege',
        );
        expect(result.stdout).toContain('--help');
        expect(result.stderr).not.toContain('route.mutate grant');
      });

      then('the human-only claim is stated where a caller reads it', () => {
        expect(result.stdout).toContain('human only — refused without a tty');
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('mutate grant --help');
      });
    });
  });
});
