import * as fs from 'fs/promises';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { execAsync } from './.test/invokeRouteSkill';
import {
  createGoalYaml,
  genTempDirForGoals,
  invokeGoalSkill,
  sanitizeGoalOutputForSnapshot,
} from './.test/invokeGoalSkill';

/**
 * .what = acceptance tests for goal lifecycle via CLI skills
 * .why = verifies CLI output and state transitions via shell invocation
 */
describe('achiever.goal.lifecycle.acceptance', () => {
  given('[case1] goal status transitions via CLI', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-lifecycle' });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-lifecycle', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] goal.memory.set creates new goal', () => {
      const result = useThen('invoke goal.memory.set with full YAML', async () => {
        const goalYaml = createGoalYaml({
          slug: 'fix-auth-test',
          why: {
            ask: 'fix the flaky test',
            purpose: 'ci should pass before merge',
            benefit: 'team can ship',
          },
          what: { outcome: 'auth.test.ts passes reliably' },
          how: {
            task: 'run test in isolation, identify flake source',
            gate: '10 consecutive passes',
          },
          status: { choice: 'enqueued', reason: 'goal created from triage' },
          source: 'peer:human',
        });

        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: { scope: 'repo' },
          cwd: scene.tempDir,
          stdin: goalYaml,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains goal slug', () => {
        expect(result.stdout).toContain('fix-auth-test');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] goal.memory.get retrieves the goal', () => {
      const result = useThen('invoke goal.memory.get', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.get',
          args: { scope: 'repo' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains goal details', () => {
        expect(result.stdout).toContain('fix-auth-test');
        expect(result.stdout).toContain('enqueued');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] goal.memory.set updates status to inflight', () => {
      const result = useThen('invoke goal.memory.set --slug --status', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'fix-auth-test',
            status: 'inflight',
          },
          cwd: scene.tempDir,
          stdin: 'work started on flake diagnosis',
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms status update', () => {
        expect(result.stdout).toContain('inflight');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] goal.memory.get shows updated status', () => {
      const result = useThen('invoke goal.memory.get after status change', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.get',
          args: { scope: 'repo' },
          cwd: scene.tempDir,
        });
      });

      then('goal shows inflight status', () => {
        expect(result.stdout).toContain('inflight');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t4] goal.memory.set updates status to fulfilled', () => {
      const result = useThen('invoke goal.memory.set --status fulfilled', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'fix-auth-test',
            status: 'fulfilled',
          },
          cwd: scene.tempDir,
          stdin: 'test passes 10 consecutive runs after mock stabilization',
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms fulfilled', () => {
        expect(result.stdout).toContain('fulfilled');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t5] goal.memory.get filter by status works', () => {
      useThen('create a second goal', async () => {
        const goalYaml = createGoalYaml({
          slug: 'update-readme',
          why: {
            ask: 'update the readme',
            purpose: 'docs should be current',
            benefit: 'new contributors can onboard',
          },
          what: { outcome: 'readme documents new env var' },
          how: { task: 'edit readme', gate: 'env var is documented' },
          status: { choice: 'enqueued', reason: 'created from triage' },
          source: 'peer:human',
        });

        await invokeGoalSkill({
          skill: 'goal.memory.set',
          args: { scope: 'repo' },
          cwd: scene.tempDir,
          stdin: goalYaml,
        });
      });

      const filterResult = useThen('invoke goal.memory.get --status enqueued', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.get',
          args: { scope: 'repo', status: 'enqueued' },
          cwd: scene.tempDir,
        });
      });

      then('only enqueued goals returned', () => {
        expect(filterResult.stdout).toContain('update-readme');
        expect(filterResult.stdout).not.toContain('fix-auth-test');
      });

      then('filter stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(filterResult.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] negative: goal.memory.set rejects incomplete schema', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-incomplete' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-incomplete', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] incomplete YAML is provided', () => {
      const result = useThen('invoke goal.memory.set with incomplete YAML', async () => {
        const incompleteYaml = `slug: incomplete-goal
why:
  ask: just fix it
`;
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: { scope: 'repo' },
          cwd: scene.tempDir,
          stdin: incompleteYaml,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stderr contains error message', () => {
        expect(result.stderr).toContain('incomplete schema');
      });

      then('stderr lists absent fields', () => {
        // GOAL_REQUIRED_FIELDS: why.ask, why.purpose, why.benefit, what.outcome, how.task, how.gate
        // only why.ask is present in the test YAML
        expect(result.stderr).toContain('why.purpose');
        expect(result.stderr).toContain('why.benefit');
        expect(result.stderr).toContain('what.outcome');
        expect(result.stderr).toContain('how.task');
        expect(result.stderr).toContain('how.gate');
      });
    });
  });

  given('[case3] negative: goal.memory.get on empty goals dir', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-empty' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-empty', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] no goals exist', () => {
      const result = useThen('invoke goal.memory.get', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.get',
          args: { scope: 'repo' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout indicates no goals', () => {
        expect(result.stdout).toContain('(none)');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case4] scope auto-detection: bound to route → default scope is route', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-scope-route' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-scope-route', { cwd: tempDir });

      // create a route and bind it to this branch
      await fs.mkdir(`${tempDir}/.behavior/test-route/.route`, { recursive: true });
      // bind flag: .route/.bind.$branch.flag
      await fs.writeFile(
        `${tempDir}/.behavior/test-route/.route/.bind.feat.test-scope-route.flag`,
        '',
      );

      return { tempDir, routeDir: '.behavior/test-route' };
    });

    when('[t0] goal.memory.set invoked without --scope', () => {
      const result = useThen('invoke goal.memory.set', async () => {
        const goalYaml = createGoalYaml({
          slug: 'route-scoped-goal',
          why: {
            ask: 'test scope auto-detection',
            purpose: 'verify bound route detection',
            benefit: 'scope defaults correctly',
          },
          what: { outcome: 'goal persisted in route' },
          how: { task: 'invoke without --scope', gate: 'path contains route' },
          status: { choice: 'enqueued', reason: 'test goal' },
          source: 'peer:human',
        });

        // note: NO --scope argument, should auto-detect 'route'
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {},
          cwd: scene.tempDir,
          stdin: goalYaml,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output shows --scope route was detected', () => {
        expect(result.stdout).toContain('--scope route');
      });

      then('path is in route/.goals/', () => {
        // should show route path, not .goals/branch
        expect(result.stdout).toContain('.behavior/test-route/.goals/');
      });
    });
  });

  given('[case5] scope auto-detection: not bound to route → default scope is repo', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-scope-repo' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-scope-repo', { cwd: tempDir });

      // no route bind - this is the negative test

      return { tempDir };
    });

    when('[t0] goal.memory.set invoked without --scope', () => {
      const result = useThen('invoke goal.memory.set', async () => {
        const goalYaml = createGoalYaml({
          slug: 'repo-scoped-goal',
          why: {
            ask: 'test scope auto-detection',
            purpose: 'verify unbound defaults to repo',
            benefit: 'scope defaults correctly',
          },
          what: { outcome: 'goal persisted in repo' },
          how: { task: 'invoke without --scope', gate: 'path contains .goals/branch' },
          status: { choice: 'enqueued', reason: 'test goal' },
          source: 'peer:human',
        });

        // note: NO --scope argument, should auto-detect 'repo'
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {},
          cwd: scene.tempDir,
          stdin: goalYaml,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output shows --scope repo was detected', () => {
        expect(result.stdout).toContain('--scope repo');
      });

      then('path is in .goals/branch/', () => {
        // should show .goals/branch path (flattened branch name)
        expect(result.stdout).toContain('.goals/feat.test-scope-repo/');
      });
    });
  });
});
