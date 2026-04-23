import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { execAsync } from './.test/invokeRouteSkill';
import {
  createGoalYaml,
  genTempDirForGoals,
  invokeGoalSkill,
  invokeGoalTriageNext,
  sanitizeGoalOutputForSnapshot,
} from './.test/invokeGoalSkill';

/**
 * .what = acceptance tests for goal.triage.next hook
 * .why = verifies unfinished goals are shown with correct output and exit codes
 *        for both onStop (session end) and onBoot (session start) hooks
 */
describe('achiever.goal.triage.next.acceptance', () => {
  given('[case1] no goals directory exists', () => {
    const scene = {
      tempDir: genTempDirForGoals({ slug: 'triage-next-no-goals' }),
    };

    when('[t0] goal.triage.next is called', () => {
      const result = useThen('invoke goal.triage.next', async () => {
        // create feature branch (goals on main are forbidden)
        await execAsync('git checkout -b feat/test-no-goals', {
          cwd: scene.tempDir,
        });
        return invokeGoalTriageNext({
          when: 'hook.onStop',
          scope: 'repo',
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout is empty', () => {
        expect(result.stdout).toEqual('');
      });

      then('stderr is empty', () => {
        expect(result.stderr).toEqual('');
      });
    });
  });

  given('[case2] goals directory exists but empty', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'triage-next-empty' });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-empty-goals', {
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] goal.triage.next is called', () => {
      const result = useThen('invoke goal.triage.next', async () => {
        return invokeGoalTriageNext({
          when: 'hook.onStop',
          scope: 'repo',
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output is silent', () => {
        expect(result.stdout).toEqual('');
        expect(result.stderr).toEqual('');
      });
    });
  });

  given('[case3] inflight goals exist', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'triage-next-inflight' });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-inflight', { cwd: tempDir });

      // create an inflight goal
      const goalYaml = createGoalYaml({
        slug: 'fix-auth-test',
        why: {
          ask: 'fix the flaky test in auth.test.ts',
          purpose: 'ci should pass before merge',
          benefit: 'team can ship',
        },
        what: { outcome: 'auth.test.ts passes reliably' },
        how: {
          task: 'run test in isolation, identify flake source',
          gate: '10 consecutive passes',
        },
        status: { choice: 'inflight', reason: 'actively on this' },
        source: 'peer:human',
      });

      await invokeGoalSkill({
        skill: 'goal.memory.set',
        args: { scope: 'repo' },
        cwd: tempDir,
        stdin: goalYaml,
      });

      return { tempDir };
    });

    when('[t0] goal.triage.next is called', () => {
      const result = useThen('invoke goal.triage.next', async () => {
        return invokeGoalTriageNext({
          when: 'hook.onStop',
          scope: 'repo',
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains owl wisdom', () => {
        expect(result.stderr).toContain(
          'to forget an ask is to break a promise',
        );
      });

      then('stderr contains goal slug', () => {
        expect(result.stderr).toContain('fix-auth-test');
      });

      then('stderr shows inflight status', () => {
        expect(result.stderr).toContain('inflight');
      });

      then('stderr contains stop hand emoji', () => {
        expect(result.stderr).toContain('✋');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case4] enqueued goals exist but no inflight', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'triage-next-enqueued' });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-enqueued', { cwd: tempDir });

      // create an enqueued goal
      const goalYaml = createGoalYaml({
        slug: 'update-readme-env',
        why: {
          ask: 'update the readme to mention the new env var',
          purpose: 'docs should be current for new contributors',
          benefit: 'reduces first-time setup friction',
        },
        what: { outcome: 'readme documents the new env var' },
        how: {
          task: 'edit readme, add env var to configuration section',
          gate: 'env var name and example are documented',
        },
        status: { choice: 'enqueued', reason: 'goal created from triage' },
        source: 'peer:human',
      });

      await invokeGoalSkill({
        skill: 'goal.memory.set',
        args: { scope: 'repo' },
        cwd: tempDir,
        stdin: goalYaml,
      });

      return { tempDir };
    });

    when('[t0] goal.triage.next is called', () => {
      const result = useThen('invoke goal.triage.next', async () => {
        return invokeGoalTriageNext({
          when: 'hook.onStop',
          scope: 'repo',
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains owl wisdom', () => {
        expect(result.stderr).toContain(
          'to forget an ask is to break a promise',
        );
      });

      then('stderr contains goal slug', () => {
        expect(result.stderr).toContain('update-readme-env');
      });

      then('stderr shows enqueued status', () => {
        expect(result.stderr).toContain('enqueued');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case5] both inflight and enqueued goals exist', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'triage-next-mixed' });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-mixed', { cwd: tempDir });

      // create an inflight goal
      const inflightGoal = createGoalYaml({
        slug: 'fix-auth-test',
        why: {
          ask: 'fix the flaky test',
          purpose: 'ci stability',
          benefit: 'team can ship',
        },
        what: { outcome: 'auth.test.ts passes' },
        how: { task: 'debug flake', gate: 'passes 10x' },
        status: { choice: 'inflight', reason: 'on it' },
        source: 'peer:human',
      });

      await invokeGoalSkill({
        skill: 'goal.memory.set',
        args: { scope: 'repo' },
        cwd: tempDir,
        stdin: inflightGoal,
      });

      // create an enqueued goal
      const enqueuedGoal = createGoalYaml({
        slug: 'update-readme',
        why: {
          ask: 'update docs',
          purpose: 'docs should be current',
          benefit: 'helps contributors',
        },
        what: { outcome: 'readme updated' },
        how: { task: 'edit readme', gate: 'env var documented' },
        status: { choice: 'enqueued', reason: 'queued' },
        source: 'peer:human',
      });

      await invokeGoalSkill({
        skill: 'goal.memory.set',
        args: { scope: 'repo' },
        cwd: tempDir,
        stdin: enqueuedGoal,
      });

      return { tempDir };
    });

    when('[t0] goal.triage.next is called', () => {
      const result = useThen('invoke goal.triage.next', async () => {
        return invokeGoalTriageNext({
          when: 'hook.onStop',
          scope: 'repo',
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr shows only inflight goal (priority)', () => {
        expect(result.stderr).toContain('fix-auth-test');
        expect(result.stderr).toContain('inflight');
      });

      then('stderr does not show enqueued goal', () => {
        // when inflight exists, only show inflight
        expect(result.stderr).not.toContain('update-readme');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case6] hook.onBoot with inflight goals', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({
        slug: `triage-next-boot-inflight-${Date.now()}`,
      });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-boot-inflight', {
        cwd: tempDir,
      });

      // create an inflight goal
      const goalYaml = createGoalYaml({
        slug: 'fix-auth-test',
        why: {
          ask: 'fix the flaky test in auth.test.ts',
          purpose: 'ci should pass before merge',
          benefit: 'team can ship',
        },
        what: { outcome: 'auth.test.ts passes reliably' },
        how: {
          task: 'run test in isolation, identify flake source',
          gate: '10 consecutive passes',
        },
        status: { choice: 'inflight', reason: 'actively on this' },
        source: 'peer:human',
      });

      const setResult = await invokeGoalSkill({
        skill: 'goal.memory.set',
        args: { scope: 'repo' },
        cwd: tempDir,
        stdin: goalYaml,
      });
      if (setResult.code !== 0) {
        throw new Error(`goal.memory.set failed: ${setResult.stderr}`);
      }

      return { tempDir };
    });

    when('[t0] goal.triage.next --when hook.onBoot is called', () => {
      const result = useThen('invoke goal.triage.next', async () => {
        return invokeGoalTriageNext({
          when: 'hook.onBoot',
          scope: 'repo',
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains goal slug', () => {
        expect(result.stderr).toContain('fix-auth-test');
      });

      then('stderr shows inflight status', () => {
        expect(result.stderr).toContain('inflight');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case7] hook.onBoot with enqueued goals', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({
        slug: `triage-next-boot-enqueued-${Date.now()}`,
      });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-boot-enqueued', {
        cwd: tempDir,
      });

      // create an enqueued goal
      const goalYaml = createGoalYaml({
        slug: 'update-readme-env',
        why: {
          ask: 'update the readme to mention the new env var',
          purpose: 'docs should be current for new contributors',
          benefit: 'reduces first-time setup friction',
        },
        what: { outcome: 'readme documents the new env var' },
        how: {
          task: 'edit readme, add env var to configuration section',
          gate: 'env var name and example are documented',
        },
        status: { choice: 'enqueued', reason: 'goal created from triage' },
        source: 'peer:human',
      });

      const setResult = await invokeGoalSkill({
        skill: 'goal.memory.set',
        args: { scope: 'repo' },
        cwd: tempDir,
        stdin: goalYaml,
      });
      if (setResult.code !== 0) {
        throw new Error(`goal.memory.set failed: ${setResult.stderr}`);
      }

      return { tempDir };
    });

    when('[t0] goal.triage.next --when hook.onBoot is called', () => {
      const result = useThen('invoke goal.triage.next', async () => {
        return invokeGoalTriageNext({
          when: 'hook.onBoot',
          scope: 'repo',
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains goal slug', () => {
        expect(result.stderr).toContain('update-readme-env');
      });

      then('stderr shows enqueued status', () => {
        expect(result.stderr).toContain('enqueued');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case8] hook.onBoot with no goals', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({
        slug: `triage-next-boot-no-goals-${Date.now()}`,
      });
      return { tempDir };
    });

    when('[t0] goal.triage.next --when hook.onBoot is called', () => {
      const result = useThen('invoke goal.triage.next', async () => {
        // create feature branch (goals on main are forbidden)
        await execAsync('git checkout -b feat/test-boot-no-goals', {
          cwd: scene.tempDir,
        });
        return invokeGoalTriageNext({
          when: 'hook.onBoot',
          scope: 'repo',
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout is empty', () => {
        expect(result.stdout).toEqual('');
      });

      then('stderr is empty', () => {
        expect(result.stderr).toEqual('');
      });
    });
  });

  given('[case9] all goals are fulfilled', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'triage-next-fulfilled' });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-fulfilled', { cwd: tempDir });

      // create a fulfilled goal
      const goalYaml = createGoalYaml({
        slug: 'done-task',
        why: {
          ask: 'do the task',
          purpose: 'it needs to be done',
          benefit: 'done is better than perfect',
        },
        what: { outcome: 'task is done' },
        how: { task: 'do it', gate: 'it is done' },
        status: { choice: 'fulfilled', reason: 'completed successfully' },
        source: 'peer:human',
      });

      await invokeGoalSkill({
        skill: 'goal.memory.set',
        args: { scope: 'repo' },
        cwd: tempDir,
        stdin: goalYaml,
      });

      return { tempDir };
    });

    when('[t0] goal.triage.next is called', () => {
      const result = useThen('invoke goal.triage.next', async () => {
        return invokeGoalTriageNext({
          when: 'hook.onStop',
          scope: 'repo',
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output is silent (all goals complete)', () => {
        expect(result.stdout).toEqual('');
        expect(result.stderr).toEqual('');
      });
    });
  });
});
