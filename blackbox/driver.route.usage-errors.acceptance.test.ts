import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-halt');

/**
 * .what = the owl frame every route.guard.budget refusal opens with, as `emitReviewRefusal` emits it
 * .why = the budget refusals share one frame with route.guard.partition, so each header sits
 *        beneath it rather than at byte 0
 */
const FRAME_OF_REFUSAL = '\n🦉 woah there\n\n';

/**
 * .what = acceptance coverage for the CLI usage-error paths of route.guard.budget
 *         and route.mutate grant — invalid input exits with a constraint code (2)
 *         and writes its guidance to stderr (not stdout)
 * .why = these invalid-input paths carry semantic exit codes + send the error to
 *        stderr (rule.require.exit-code-semantics + rule.forbid.stdout-on-exit-errors);
 *        without a contract-boundary test a future change could silently regress
 *        the exit code or leak the error to stdout (hidden on a non-zero exit).
 *
 * .note = each path exits BEFORE any guard file is read or written, so no bound route is
 *         needed — only the linked driver skills. the route-lookup refusals ([case4] unbound
 *         and guardless, [case5] unguarded stone) read a route and stop there.
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

    when('[t1] the branch has no bound route and no --route is given', () => {
      const result = useThen('the grant refuses to guess a route', async () =>
        invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'get' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller must name a route)', () => {
        expect(result.code).toEqual(2);
      });

      then('🔴 the refusal opens with the qualified header, never bare `error:`', () => {
        expect(result.stderr).toContain(
          '✋ ConstraintError: no bound route found. use --route to specify.',
        );
        expect(result.stderr).not.toContain('error: no bound route');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('mutate grant route unbound');
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

    when('[t1] --help is asked with no other flag', () => {
      const result = useThen('the budget command answers with its usage', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { help: true },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (a help request is not a refusal)', () => {
        expect(result.code).toEqual(0);
      });

      then('🔴 the usage is on stdout, and no absent --for is blamed', () => {
        expect(result.stdout).toContain('route.guard.budget - extend peer reviewer budget');
        expect(result.stdout).toContain('--level');
        expect(result.stderr).not.toContain('--for is required');
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('budget --help');
      });
    });
  });

  /**
   * .what = every other route.guard.budget refusal, one when per refusal
   * .why = each one opens `✋ ConstraintError:` (rule.require.qualified-error-headers) and exits 2;
   *        without a snapshot a reword, a dropped usage line, or a changed exit code ships unseen
   *        (r011 blocker.1). each refusal fires before any guard file is read or written.
   *
   * .note = `--route .` keeps every path in the bytes relative, so no temp dir needs a mask
   */
  const REFUSALS_WITHOUT_GUARD: Array<{
    description: string;
    args: Record<string, string>;
    header: string;
    snapshot: string;
    /**
     * .what = whether the owl frame leads the header
     * .why = a refusal raised at argument parse renders header + usage at byte 0
     *        (pinned in [case3b]–[case3d]); a refusal raised after parse shares the
     *        owl frame with route.guard.partition
     */
    frame: boolean;
  }> = [
    {
      description: '--for is omitted',
      args: { add: '2', stone: '1.feature' },
      header: '✋ ConstraintError: --for is required',
      snapshot: 'budget --for absent',
      frame: false,
    },
    {
      description: '--for names a resource other than review',
      args: { for: 'deploy', add: '2', stone: '1.feature' },
      header: '✋ ConstraintError: --for must be "review", got "deploy"',
      snapshot: 'budget --for not review',
      frame: false,
    },
    {
      description: '--level is not a positive integer',
      args: { for: 'review', add: '2', level: 'abc', stone: '1.feature' },
      header: '✋ ConstraintError: --level must be a positive integer',
      snapshot: 'budget --level non-numeric',
      frame: true,
    },
    {
      description: '--peer and --level are both named',
      args: {
        for: 'review',
        add: '2',
        peer: 'primo',
        level: '1',
        stone: '1.feature',
      },
      header: '✋ ConstraintError: --peer and --level cannot be combined',
      snapshot: 'budget --peer with --level',
      frame: true,
    },
    {
      description: '--stone is omitted',
      args: { for: 'review', add: '2' },
      header: '✋ ConstraintError: --stone is required',
      snapshot: 'budget --stone absent',
      frame: false,
    },
    {
      description: 'no --route is given and the branch has no bound route',
      args: { for: 'review', add: '2', stone: '1.feature' },
      header:
        '✋ ConstraintError: no bound route found. use --route to specify.',
      snapshot: 'budget route unbound',
      frame: true,
    },
    {
      description: 'the route holds no guard files',
      args: { for: 'review', add: '2', stone: '1.feature', route: '.' },
      header: '✋ ConstraintError: no guard files found in .',
      snapshot: 'budget route guardless',
      frame: true,
    },
  ];

  given('[case12] route.guard.budget refusals on a route with no guard', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-budget-refusals',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-budget-refusals', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    REFUSALS_WITHOUT_GUARD.map((refusal, index) =>
      when(`[t${index}] ${refusal.description}`, () => {
        const result = useThen('the budget command refuses', async () =>
          invokeRouteSkill({
            skill: 'route.guard.budget',
            args: refusal.args,
            cwd: scene.tempDir,
          }),
        );

        then('exit code is 2 (constraint — the caller must fix it)', () => {
          expect(result.code).toEqual(2);
        });

        then('stderr opens with the qualified ConstraintError header, framed where owed', () => {
          const lead = refusal.frame ? FRAME_OF_REFUSAL : '';
          expect(result.stderr.startsWith(`${lead}${refusal.header}`)).toEqual(
            true,
          );
          expect(result.stdout).not.toContain('ConstraintError');
        });

        then('stderr matches snapshot', () => {
          expect(result.stderr).toMatchSnapshot(refusal.snapshot);
        });
      }),
    );
  });

  given('[case13] route.guard.budget on a route whose guards name other stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-budget-stoneless',
        clone: path.join(__dirname, '.test/assets/route-peer-budget-multilevel'),
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-budget-stoneless', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] --stone names a stone with no guard file', () => {
      const result = useThen('the budget command refuses', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: '2', stone: '9.absent', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller must name a guarded stone)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr opens with the owl frame, then the qualified ConstraintError header', () => {
        expect(
          result.stderr.startsWith(
            `${FRAME_OF_REFUSAL}✋ ConstraintError: no guard file found for stone 9.absent`,
          ),
        ).toEqual(true);
        expect(result.stdout).not.toContain('ConstraintError');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('budget stone unguarded');
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

  /**
   * 🔴 .what = the MEASURED symptom `runCliEntrypoint` was built to close, pinned.
   *
   * 🔴 .why = before the boundary existed, this exact invocation printed a node stack
   *           trace, the author's absolute path, the node version — and exit **1**, the
   *           code `rule.require.exit-code-semantics` reserves for a server malfunction.
   *           ⇒ a hook that read the code read "server fault" where the truth was "you
   *           forgot a flag". the entrypoint's own allowlist could not catch it: every
   *           copy sat BELOW `parseArgs` and below the required-flag checks.
   *
   * ⚠️ .note = the boundary is a behavior change made in THIS round, and its most common
   *            caller-variant was pinned by naught (`ergo-contract-snapshots` blocker.1
   *            at i002). a regression that re-crashes this command would have stayed
   *            green under the suite as it stood.
   */
  given('[case6] route.stone.get with --stone omitted', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-stone-get-nostone',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-stone-get', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] --route is passed and --stone is not', () => {
      const result = useThen('the get command refuses the invocation', async () =>
        invokeRouteSkill({
          skill: 'route.stone.get',
          args: { route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller forgot a flag)', () => {
        // 🔴 the whole point. it was **1** before the boundary, and a 1 tells a hook
        //    the server broke — the opposite of the truth
        expect(result.code).toEqual(2);
      });

      then('the refusal is on stderr, not stdout, and classed caller-fault', () => {
        // 🔴 .why the class is pinned beside the message = `error: <Class>: <message>` is
        //    this repo's failloud render, and the class names WHO must fix it —
        //    `BadRequestError` says the caller, `MalfunctionError` says the server
        //    (`rule.require.failloud`). a bare message assertion would stay green through
        //    a re-class, so the driver would be told the opposite of the truth about
        //    whose fault it is while the suite reported no change
        expect(result.stderr).toContain(
          '✋ ConstraintError: --stone is required',
        );
        expect(result.stdout).not.toContain('--stone is required');
      });

      then('no stack trace, no absolute path, no node version', () => {
        // 🔴 the three artifacts of the crash this boundary replaced. each is asserted
        //    by name rather than left to the snapshot, so a reader of the assertions
        //    alone can see what the boundary guarantees
        expect(result.stderr).not.toContain('at Object.');
        expect(result.stderr).not.toContain('throw new');
        expect(result.stderr).not.toContain('Node.js v');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('stone.get --stone absent');
      });
    });
  });

  given('[case7] route.stone.judge with --mechanism omitted', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-stone-judge-nomech',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-stone-judge', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the judge is invoked with no mechanism', () => {
      const result = useThen('the judge refuses the invocation', async () =>
        invokeRouteSkill({
          skill: 'route.stone.judge',
          args: { stone: '1.feature', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller forgot a flag)', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal names the flag, on stderr, classed caller-fault', () => {
        // .why the class rides along = see the peer note in [case6]; the class is the
        //    half that says whose fault it is, and it is the half a bare message
        //    assertion cannot hold
        expect(result.stderr).toContain(
          '✋ ConstraintError: --mechanism is required',
        );
        expect(result.stdout).not.toContain('--mechanism is required');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('stone.judge --mechanism absent');
      });
    });

    // 🔴 .why the next two when-blocks = `routeStoneJudge` throws THREE distinct
    //    `BadRequestError`s and only one was pinned above. the other two sit on the
    //    same re-wrapped boundary, so a re-class or a stream move would reach them
    //    identically and no bar would go red
    //    (`rule.require.contract-snapshot-exhaustiveness`)
    when('[t1] the mechanism is named and the stone is not', () => {
      const result = useThen('the judge refuses the invocation', async () =>
        invokeRouteSkill({
          skill: 'route.stone.judge',
          args: { mechanism: 'reviewed?', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller forgot a flag)', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal names the flag, on stderr, classed caller-fault', () => {
        expect(result.stderr).toContain(
          '✋ ConstraintError: --stone is required',
        );
        expect(result.stdout).not.toContain('--stone is required');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('stone.judge --stone absent');
      });
    });

    when('[t2] the mechanism names a value the contract does not hold', () => {
      const result = useThen('the judge refuses the mechanism', async () =>
        invokeRouteSkill({
          skill: 'route.stone.judge',
          args: { stone: '1.feature', route: '.', mechanism: 'bogus?' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller named a bad value)', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal quotes the value back, on stderr', () => {
        // .why the value is quoted back = the caller typed it, so the echo is what
        //    lets them spot a typo without a re-read of their own command
        expect(result.stderr).toContain(
          '✋ ConstraintError: unknown mechanism "bogus?"',
        );
        expect(result.stdout).not.toContain('unknown mechanism');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('stone.judge unknown mechanism');
      });
    });
  });

  given('[case8] route.stone.set with an --as the contract does not name', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-stone-set-badas',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-stone-set', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] --as carries a value outside the allowed set', () => {
      const result = useThen('the set command refuses the action', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'bogus' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller must fix the value)', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal enumerates the allowed actions, on stderr', () => {
        // 🔴 .why enumerated = `rule.require.errors-name-the-fix`. a bare "invalid --as"
        //    tells the driver naught about what to type instead, and this message is the
        //    one place the full passage vocabulary is rendered to a human
        expect(result.stderr).toContain('--as must be');
        expect(result.stderr).toContain('"promised"');
        expect(result.stdout).not.toContain('--as must be');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('stone.set --as invalid');
      });
    });
  });

  given('[case9] route.bind.set with --route omitted', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-bind-set-noroute',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-bind-set', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the bind is invoked with no route', () => {
      const result = useThen('the bind refuses the invocation', async () =>
        invokeRouteSkill({
          skill: 'route.bind.set',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller forgot a flag)', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal names the flag and points at --help, on stderr', () => {
        // 🔴 .why = the intent is unchanged — the refusal names the flag, points at --help,
        //    and sits on stderr. what changed is the SHAPE it arrives in: this one entrypoint
        //    hand-rolled a bare `console.error` while its eight peers in this same file throw
        //    a `BadRequestError` and let the boundary render it. the bare form was the lone
        //    divergence in the file, so the outlier moved, never the house shape
        //    (`ergo-snapshot-visual-blemishes` blocker.1 at i004)
        expect(result.stderr).toContain(
          '✋ ConstraintError: --route is required',
        );
        expect(result.stderr).toContain('--help');
        expect(result.stdout).not.toContain('--route is required');
      });

      then('the refusal carries the same hint payload as its peers', () => {
        // .why = uniformity is what the blocker graded, so it earns an assertion rather than
        //        a snapshot alone — a snapshot re-take would absorb a drift here in silence
        expect(result.stderr).toContain('hint: --help for usage');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('bind.set --route absent');
      });
    });
  });

  /**
   * 🔴 .what = the boundary is ONE mechanism, proven across four subcommands that share
   *            it — never eleven copies that happen to agree today.
   *
   * 🔴 .why = `parseArgs` sits ABOVE every entrypoint's own `try`, so a fault it raises
   *           can be caught by the outer boundary alone. that makes a bare `--into` the
   *           one refusal reachable from EVERY re-wrapped subcommand, and therefore the
   *           sharpest probe of the claim "the boundary is uniform". the extant pins for
   *           this message all ride on `route.stone.set`, which is exactly the verb whose
   *           own read of `--into` could mask it.
   *
   * ⚠️ .note = `route.stone.set` is deliberately ABSENT from this table. its `--into` is
   *            a real flag with its own refusals elsewhere in the corpus, so a pin here
   *            would grade that verb rather than the shared boundary.
   */
  given('[case10] a bare --into on subcommands that do not own the flag', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-bare-into',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-bare-into', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    const SUBCOMMANDS = [
      'route.stone.get',
      'route.drive',
      'route.bind.get',
      'route.guard.upgrade',
    ] as const;

    for (const skill of SUBCOMMANDS) {
      when(`[t0] ${skill} is invoked with a bare --into`, () => {
        const result = useThen(`${skill} refuses the bare flag`, async () =>
          invokeRouteSkill({
            skill,
            args: { into: true },
            cwd: scene.tempDir,
          }),
        );

        then('exit code is 2 (constraint — the caller must fix the flag)', () => {
          expect(result.code).toEqual(2);
        });

        then('the refusal is the shared one, on stderr', () => {
          // 🔴 the same three lines on every verb — that sameness IS the claim. a
          //    per-verb hint here would be decoy guidance for a command the driver
          //    never ran, which is why the boundary keeps its message generic
          expect(result.stderr).toContain(
            '✋ ConstraintError: --into given with no value',
          );
          expect(result.stderr).toContain('fix: give each flag its value');
          expect(result.stdout).not.toContain('--into given with no value');
        });

        then('no stack trace, no node version', () => {
          expect(result.stderr).not.toContain('at Object.');
          expect(result.stderr).not.toContain('Node.js v');
        });

        then('stderr matches snapshot', () => {
          expect(result.stderr).toMatchSnapshot(`${skill} bare --into`);
        });
      });
    }
  });

  given('[case11] route.review with an --open the host does not hold', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'usage-review-badopener',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-usage-review-open', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the named opener is absent from PATH', () => {
      const result = useThen('route.review refuses the opener', async () =>
        invokeRouteSkill({
          skill: 'route.review',
          args: {
            route: '.',
            open: 'no-such-opener-abcxyz',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller must fix the opener)', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal quotes the opener back, on stderr', () => {
        // 🔴 .why this is its own case = this branch refuses BEFORE the inner try, so
        //    it renders a tree of its own rather than the `error: <Class>: <message>`
        //    shape every other refusal on this boundary carries. a shape that singular
        //    is a shape a regression can move with no peer to disagree with it
        expect(result.stderr).toContain(
          "opener 'no-such-opener-abcxyz' not found in PATH",
        );
        expect(result.stdout).not.toContain('not found in PATH');
      });

      then('no stack trace, no node version', () => {
        expect(result.stderr).not.toContain('at Object.');
        expect(result.stderr).not.toContain('Node.js v');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('route.review absent opener');
      });
    });
  });
});
