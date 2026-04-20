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
 * .what = acceptance tests for goal escalation after repeated onStop reminders
 * .why = verifies message intensity increases after 5 blocks per usecase.7
 */
describe('achiever.goal.escalation.acceptance', () => {
  given('[case1] repeated onStop calls without progress', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'escalation-repeat' });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-escalation', { cwd: tempDir });

      // create an inflight goal
      const goalYaml = createGoalYaml({
        slug: 'stuck-task',
        why: {
          ask: 'do the task that remains blocked',
          purpose: 'it must be done eventually',
          benefit: 'progress is made',
        },
        what: { outcome: 'task is complete' },
        how: { task: 'figure it out', gate: 'done' },
        status: { choice: 'inflight', reason: 'on it' },
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

    when('[t0] onStop is called once', () => {
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

      then('message is gentle', () => {
        expect(result.stderr).toContain(
          'to forget an ask is to break a promise',
        );
        expect(result.stderr).not.toContain('reminded many times');
      });
    });

    when('[t1] onStop is called 5 times without progress', () => {
      const result = useThen(
        'invoke goal.triage.next 5 times',
        async () => {
          // calls 2-5 (call 1 already happened in [t0])
          for (let i = 0; i < 4; i++) {
            await invokeGoalTriageNext({
              when: 'hook.onStop',
              scope: 'repo',
              cwd: scene.tempDir,
            });
          }

          // call 5 - should escalate
          return invokeGoalTriageNext({
            when: 'hook.onStop',
            scope: 'repo',
            cwd: scene.tempDir,
          });
        },
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('message is escalated', () => {
        expect(result.stderr).toContain('reminded many times');
        expect(result.stderr).toContain('work must be done');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case2] progress resets escalation', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'escalation-reset' });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-escalation-reset', {
        cwd: tempDir,
      });

      // create an inflight goal
      const goalYaml = createGoalYaml({
        slug: 'progress-task',
        why: {
          ask: 'task that will be fulfilled',
          purpose: 'test reset behavior',
          benefit: 'validates escalation reset',
        },
        what: { outcome: 'task is complete' },
        how: { task: 'do it', gate: 'done' },
        status: { choice: 'inflight', reason: 'on it' },
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

    when('[t0] onStop is called 3 times then goal is fulfilled', () => {
      const setup = useThen('build up blocker count then fulfill', async () => {
        // build up blocker count
        for (let i = 0; i < 3; i++) {
          await invokeGoalTriageNext({
            when: 'hook.onStop',
            scope: 'repo',
            cwd: scene.tempDir,
          });
        }

        // fulfill the goal
        await invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            slug: 'progress-task',
            'status.choice': 'fulfilled',
            'status.reason': 'done now',
            scope: 'repo',
          },
          cwd: scene.tempDir,
        });

        return {};
      });

      then('setup completes', () => {
        expect(setup).toBeDefined();
      });
    });

    when('[t1] new goal is created and onStop is called', () => {
      const result = useThen(
        'create new goal and call onStop',
        async () => {
          // create a new inflight goal
          const goalYaml = createGoalYaml({
            slug: 'new-task',
            why: {
              ask: 'new task after progress',
              purpose: 'test fresh start',
              benefit: 'validates reset',
            },
            what: { outcome: 'new task done' },
            how: { task: 'do new task', gate: 'done' },
            status: { choice: 'inflight', reason: 'fresh start' },
            source: 'peer:human',
          });

          await invokeGoalSkill({
            skill: 'goal.memory.set',
            args: { scope: 'repo' },
            cwd: scene.tempDir,
            stdin: goalYaml,
          });

          // call onStop - should be gentle (fresh blocker state)
          return invokeGoalTriageNext({
            when: 'hook.onStop',
            scope: 'repo',
            cwd: scene.tempDir,
          });
        },
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('message is gentle (blocker state reset)', () => {
        expect(result.stderr).toContain(
          'to forget an ask is to break a promise',
        );
        expect(result.stderr).not.toContain('reminded many times');
      });
    });
  });
});
