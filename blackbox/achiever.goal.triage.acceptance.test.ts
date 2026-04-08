import * as fs from 'fs/promises';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { execAsync } from './.test/invokeRouteSkill';
import {
  createGoalYaml,
  createPartialGoalYaml,
  genTempDirForGoals,
  invokeGoalSkill,
  sanitizeGoalOutputForSnapshot,
} from './.test/invokeGoalSkill';

/**
 * .what = acceptance tests for goal triage flow via CLI skills
 * .why = verifies CLI output and triage state transitions via shell invocation
 */
describe('achiever.goal.triage.acceptance', () => {
  given('[case1] multi-part request triage flow', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-triage' });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-triage', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] first ask is created as a goal', () => {
      const result = useThen('invoke goal.memory.set for first ask', async () => {
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

    when('[t1] second ask is created as a goal', () => {
      const result = useThen('invoke goal.memory.set for second ask', async () => {
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
        expect(result.stdout).toContain('update-readme-env');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] third ask is created as a goal', () => {
      const result = useThen('invoke goal.memory.set for third ask', async () => {
        const goalYaml = createGoalYaml({
          slug: 'notify-slack-done',
          why: {
            ask: 'notify me on slack when done',
            purpose: 'human wants visibility into completion',
            benefit: 'can move on to next task promptly',
          },
          what: { outcome: 'slack message sent upon completion' },
          how: {
            task: 'call slack api with completion message',
            gate: 'slack message delivered',
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
        expect(result.stdout).toContain('notify-slack-done');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] all goals are listed', () => {
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

      then('stdout contains all three goals', () => {
        expect(result.stdout).toContain('fix-auth-test');
        expect(result.stdout).toContain('update-readme-env');
        expect(result.stdout).toContain('notify-slack-done');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t4] goals are filtered by status', () => {
      useThen('update first goal to inflight', async () => {
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

      const filterResult = useThen('invoke goal.memory.get --status enqueued', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.get',
          args: { scope: 'repo', status: 'enqueued' },
          cwd: scene.tempDir,
        });
      });

      then('filtered result excludes inflight goal', () => {
        expect(filterResult.stdout).not.toContain('fix-auth-test');
        expect(filterResult.stdout).toContain('update-readme-env');
        expect(filterResult.stdout).toContain('notify-slack-done');
      });

      then('filter stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(filterResult.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] triage of asks with goal coverage', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-triage-coverage' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-triage-coverage', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] goal created with coverage hash', () => {
      const result = useThen('invoke goal.memory.set with --covers', async () => {
        const goalYaml = createGoalYaml({
          slug: 'complete-task',
          why: {
            ask: 'complete this task',
            purpose: 'task must be done',
            benefit: 'progress is made',
          },
          what: { outcome: 'task is complete' },
          how: { task: 'do the work', gate: 'work is done' },
          status: { choice: 'enqueued', reason: 'goal created from triage' },
          source: 'peer:human',
        });

        // simulate an ask hash that this goal covers
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: { scope: 'repo', covers: 'abc123def456' },
          cwd: scene.tempDir,
          stdin: goalYaml,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout mentions coverage', () => {
        // the output should indicate coverage was recorded
        expect(result.stdout).toContain('complete-task');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case3] goal status transitions through full lifecycle', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-triage-lifecycle' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-triage-lifecycle', { cwd: tempDir });

      // create initial goal
      const goalYaml = createGoalYaml({
        slug: 'lifecycle-goal',
        why: {
          ask: 'test the lifecycle',
          purpose: 'verify status transitions',
          benefit: 'confidence in the system',
        },
        what: { outcome: 'all statuses work' },
        how: { task: 'transition through statuses', gate: 'all transitions succeed' },
        status: { choice: 'enqueued', reason: 'initial creation' },
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

    when('[t0] goal transitions to blocked', () => {
      const result = useThen('invoke goal.memory.set --status blocked', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'lifecycle-goal',
            status: 'blocked',
          },
          cwd: scene.tempDir,
          stdin: 'blocked on external dependency',
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows blocked status', () => {
        expect(result.stdout).toContain('blocked');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] goal transitions to inflight', () => {
      const result = useThen('invoke goal.memory.set --status inflight', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'lifecycle-goal',
            status: 'inflight',
          },
          cwd: scene.tempDir,
          stdin: 'dependency resolved, work resumed',
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows inflight status', () => {
        expect(result.stdout).toContain('inflight');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] goal transitions to fulfilled', () => {
      const result = useThen('invoke goal.memory.set --status fulfilled', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'lifecycle-goal',
            status: 'fulfilled',
          },
          cwd: scene.tempDir,
          stdin: 'all transitions verified successfully',
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows fulfilled status', () => {
        expect(result.stdout).toContain('fulfilled');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case4] partial goals via CLI flags', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-partial-flags' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-partial-flags', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] partial goal with slug and one field flag', () => {
      const result = useThen('invoke goal.memory.set with --slug and --why.ask', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'quick-capture-test',
            'why.ask': 'fix the flaky test',
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains goal slug', () => {
        expect(result.stdout).toContain('quick-capture-test');
      });

      then('stdout shows status.choice = incomplete', () => {
        expect(result.stdout).toContain('choice = incomplete');
      });

      then('stdout shows omitted markers for absent fields', () => {
        // fields we did not provide should show inline omitted markers
        expect(result.stdout).toContain('purpose = ✋ omitted');
        expect(result.stdout).toContain('benefit = ✋ omitted');
        expect(result.stdout).toContain('outcome = ✋ omitted');
        expect(result.stdout).toContain('task = ✋ omitted');
        expect(result.stdout).toContain('gate = ✋ omitted');
        // 5 fields should be omitted (we only provided ask)
        const omittedCount = (result.stdout.match(/✋ omitted/g) || []).length;
        expect(omittedCount).toEqual(5);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] partial goal with slug only (minimal capture)', () => {
      const result = useThen('invoke goal.memory.set with only --slug', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'minimal-capture-test',
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains goal slug', () => {
        expect(result.stdout).toContain('minimal-capture-test');
      });

      then('stdout shows status.choice = incomplete', () => {
        expect(result.stdout).toContain('choice = incomplete');
      });

      then('stdout shows omitted markers for all required fields', () => {
        // with only slug provided, all other fields should show omitted
        expect(result.stdout).toContain('✋ omitted');
        // multiple fields should be omitted since we only provided slug
        const omittedCount = (result.stdout.match(/✋ omitted/g) || []).length;
        expect(omittedCount).toBeGreaterThanOrEqual(6); // ask, purpose, benefit, outcome, task, gate
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] partial goal with multiple field flags', () => {
      const result = useThen('invoke goal.memory.set with multiple flags', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'multi-field-test',
            'why.ask': 'fix the flaky test',
            'why.purpose': 'ci needs to pass',
            'what.outcome': 'test passes reliably',
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains goal slug', () => {
        expect(result.stdout).toContain('multi-field-test');
      });

      then('stdout shows status.choice = incomplete (still omitted fields)', () => {
        expect(result.stdout).toContain('choice = incomplete');
      });

      then('omitted markers only for fields not provided', () => {
        // provided fields should show in treebucket format (content block, not inline = value)
        // and specifically should NOT show "= ✋ omitted" pattern
        expect(result.stdout).toContain('benefit = ✋ omitted');
        expect(result.stdout).toContain('task = ✋ omitted');
        expect(result.stdout).toContain('gate = ✋ omitted');
        // 3 fields should be omitted (benefit, task, gate)
        const omittedCount = (result.stdout.match(/✋ omitted/g) || []).length;
        expect(omittedCount).toEqual(3);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] update partial goal with additional fields', () => {
      const result = useThen('invoke goal.memory.set to add more fields', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'quick-capture-test',
            'why.purpose': 'ci must pass before merge',
            'why.benefit': 'team can ship',
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains goal slug', () => {
        expect(result.stdout).toContain('quick-capture-test');
      });

      then('omitted markers shrink (fewer omitted fields)', () => {
        // why.ask, why.purpose, why.benefit are provided - none should show omitted
        // what.outcome, how.task, how.gate should still show omitted
        expect(result.stdout).toContain('outcome = ✋ omitted');
        expect(result.stdout).toContain('task = ✋ omitted');
        expect(result.stdout).toContain('gate = ✋ omitted');
        // 3 fields should be omitted (outcome, task, gate)
        const omittedCount = (result.stdout.match(/✋ omitted/g) || []).length;
        expect(omittedCount).toEqual(3);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t4] complete a partial goal with all rest fields', () => {
      const result = useThen('invoke goal.memory.set to complete the goal', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'quick-capture-test',
            'what.outcome': 'test passes 10 consecutive runs',
            'how.task': 'diagnose flake, apply fix',
            'how.gate': '10 consecutive passes',
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows status.choice is not incomplete', () => {
        // when all fields are filled, status should not be incomplete
        expect(result.stdout).not.toContain('choice = incomplete');
      });

      then('no omitted markers remain', () => {
        // all fields are now provided, no omitted markers should appear
        expect(result.stdout).not.toContain('✋ omitted');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case5] partial goals negative cases', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-partial-negative' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-partial-negative', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] partial goal without slug', () => {
      const result = useThen('invoke goal.memory.set with field flags but no slug', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            'why.ask': 'fix the flaky test',
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stderr contains slug required error', () => {
        expect(result.stderr).toContain('slug');
      });
    });

    when('[t1] invalid status value', () => {
      const result = useThen('invoke goal.memory.set with invalid status', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'invalid-status-test',
            status: 'invalid-status',
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stderr contains status error', () => {
        expect(result.stderr.toLowerCase()).toContain('status');
      });
    });
  });

  given('[case6] goal.infer.triage shows incomplete goals separately', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-triage-incomplete' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-triage-incomplete', { cwd: tempDir });

      // create a complete goal (all required fields)
      const completeGoalYaml = createGoalYaml({
        slug: 'complete-goal',
        why: {
          ask: 'do the complete task',
          purpose: 'test complete goal detection',
          benefit: 'confidence in triage',
        },
        what: { outcome: 'task is fully done' },
        how: { task: 'do all the work', gate: 'all work verified' },
        status: { choice: 'enqueued', reason: 'goal created for test' },
        source: 'peer:human',
      });

      await invokeGoalSkill({
        skill: 'goal.memory.set',
        args: { scope: 'repo' },
        cwd: tempDir,
        stdin: completeGoalYaml,
      });

      // create an incomplete goal (only slug and why.ask)
      await invokeGoalSkill({
        skill: 'goal.memory.set',
        args: {
          scope: 'repo',
          slug: 'incomplete-goal',
          'why.ask': 'do the incomplete task',
        },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] goal.infer.triage is invoked', () => {
      const result = useThen('invoke goal.infer.triage', async () => {
        return invokeGoalSkill({
          skill: 'goal.infer.triage',
          args: { scope: 'repo' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows incomplete goals section', () => {
        expect(result.stdout.toLowerCase()).toContain('incomplete');
      });

      then('stdout shows the incomplete goal slug', () => {
        expect(result.stdout).toContain('incomplete-goal');
      });

      then('stdout shows absent fields for incomplete goal', () => {
        // in triage view, incomplete goals show condensed "absent:" list
        expect(result.stdout).toContain('absent:');
        // the specific fields that were not provided should be listed
        expect(result.stdout).toContain('why.purpose');
        expect(result.stdout).toContain('why.benefit');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] all goals are complete', () => {
      // first complete the incomplete goal
      useThen('complete the incomplete goal', async () => {
        await invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'incomplete-goal',
            'why.purpose': 'test complete detection',
            'why.benefit': 'full confidence',
            'what.outcome': 'goal is complete',
            'how.task': 'fill in all fields',
            'how.gate': 'no absent fields',
          },
          cwd: scene.tempDir,
        });
      });

      const result = useThen('invoke goal.infer.triage after completion', async () => {
        return invokeGoalSkill({
          skill: 'goal.infer.triage',
          args: { scope: 'repo' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout does not show incomplete goals section', () => {
        // when all goals are complete, should not have "incomplete goals" section
        // or should show empty
        expect(result.stdout.toLowerCase()).not.toMatch(/incomplete goals.*\n.*-/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case7] goal.infer.triage negative cases', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-triage-negative' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-triage-negative', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] invalid scope value', () => {
      const result = useThen('invoke goal.infer.triage with invalid scope', async () => {
        return invokeGoalSkill({
          skill: 'goal.infer.triage',
          args: { scope: 'invalid-scope' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stderr contains scope error', () => {
        expect(result.stderr.toLowerCase()).toContain('scope');
      });
    });
  });

  given('[case8] route scope goal persistence', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-route-scope' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-route-scope', { cwd: tempDir });

      // create a .behavior route directory with proper bind flag
      const routeDir = `${tempDir}/.behavior/v2026_04_05.test-route`;
      await execAsync(`mkdir -p "${routeDir}/.route"`, { cwd: tempDir });
      // bind flag: .route/.bind.$branchFlat.flag (branch name with / replaced by .)
      await fs.writeFile(
        `${routeDir}/.route/.bind.feat.test-route-scope.flag`,
        '',
      );

      return { tempDir, routeDir };
    });

    when('[t0] goal.memory.set with --scope route within a route', () => {
      const result = useThen('invoke goal.memory.set --scope route', async () => {
        const goalYaml = createGoalYaml({
          slug: 'route-scoped-goal',
          why: {
            ask: 'test route scope',
            purpose: 'verify route isolation',
            benefit: 'confidence in scope behavior',
          },
          what: { outcome: 'goal persists in route .goals/' },
          how: {
            task: 'create goal with --scope route',
            gate: 'goal file exists in route .goals/',
          },
          status: { choice: 'enqueued', reason: 'route scope test' },
          source: 'peer:human',
        });

        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: { scope: 'route' },
          cwd: scene.routeDir, // invoke from within the route
          stdin: goalYaml,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains goal slug', () => {
        expect(result.stdout).toContain('route-scoped-goal');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] goal.memory.get with --scope route retrieves route goals', () => {
      const result = useThen('invoke goal.memory.get --scope route', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.get',
          args: { scope: 'route' },
          cwd: scene.routeDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains the route-scoped goal', () => {
        expect(result.stdout).toContain('route-scoped-goal');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] goal.infer.triage with --scope route shows route state', () => {
      const result = useThen('invoke goal.infer.triage --scope route', async () => {
        return invokeGoalSkill({
          skill: 'goal.infer.triage',
          args: { scope: 'route' },
          cwd: scene.routeDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows route goals', () => {
        expect(result.stdout).toContain('route-scoped-goal');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] route scope isolation from repo scope', () => {
      // repo scope should NOT see route-scoped goals
      const result = useThen('invoke goal.memory.get --scope repo', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.get',
          args: { scope: 'repo' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout does NOT contain route-scoped goal', () => {
        // repo scope should be empty or not contain the route goal
        expect(result.stdout).not.toContain('route-scoped-goal');
      });
    });
  });

  given('[case9] partial goal blocks onStop until complete (journey)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-onstop-incomplete' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-onstop-incomplete', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] partial goal is created', () => {
      const result = useThen('invoke goal.memory.set with partial goal', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'incomplete-blocks-session',
            'why.ask': 'test onStop halt behavior',
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('goal is incomplete', () => {
        expect(result.stdout).toContain('choice = incomplete');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] hook.onStop fires with incomplete goal', () => {
      const result = useThen('invoke goal.infer.triage --mode hook.onStop', async () => {
        return invokeGoalSkill({
          skill: 'goal.infer.triage',
          args: { scope: 'repo', mode: 'hook.onStop' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2 (halt)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr shows incomplete goals block session', () => {
        expect(result.stderr.toLowerCase()).toContain('incomplete');
      });

      then('stderr has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });

    when('[t2] partial goal is completed', () => {
      const result = useThen('invoke goal.memory.set to complete the goal', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: {
            scope: 'repo',
            slug: 'incomplete-blocks-session',
            'why.purpose': 'verify onStop unblocks',
            'why.benefit': 'confidence in hook behavior',
            'what.outcome': 'session can end',
            'how.task': 'complete all fields',
            'how.gate': 'onStop exits 0',
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('goal is now complete', () => {
        // when all fields filled, no omitted markers should appear
        expect(result.stdout).not.toContain('✋ omitted');
        // status auto-transitions from incomplete to enqueued
        expect(result.stdout).toContain('choice = enqueued');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] hook.onStop fires with complete goals', () => {
      const result = useThen('invoke goal.infer.triage --mode hook.onStop after completion', async () => {
        return invokeGoalSkill({
          skill: 'goal.infer.triage',
          args: { scope: 'repo', mode: 'hook.onStop' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0 (pass)', () => {
        expect(result.code).toEqual(0);
      });

      then('session can end (no halt message)', () => {
        expect(result.stderr).not.toContain('incomplete');
      });

      then('output is silent (good vibes)', () => {
        // silent success: both stdout and stderr should be empty or minimal
        expect(
          sanitizeGoalOutputForSnapshot(
            `stdout: ${result.stdout}\nstderr: ${result.stderr}`,
          ),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case10] route scope negative cases', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-route-negative' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-route-negative', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] --scope route outside a route directory', () => {
      const result = useThen('invoke goal.memory.set --scope route', async () => {
        const goalYaml = createGoalYaml({
          slug: 'should-fail',
          why: {
            ask: 'test',
            purpose: 'test',
            benefit: 'test',
          },
          what: { outcome: 'test' },
          how: { task: 'test', gate: 'test' },
          status: { choice: 'enqueued', reason: 'test' },
          source: 'peer:human',
        });

        return invokeGoalSkill({
          skill: 'goal.memory.set',
          args: { scope: 'route' },
          cwd: scene.tempDir, // NOT in a route directory
          stdin: goalYaml,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stderr contains route error', () => {
        expect(result.stderr.toLowerCase()).toContain('route');
      });
    });

    when('[t1] goal.memory.get --scope route outside a route', () => {
      const result = useThen('invoke goal.memory.get --scope route', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.get',
          args: { scope: 'route' },
          cwd: scene.tempDir, // NOT in a route directory
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stderr contains route error', () => {
        expect(result.stderr.toLowerCase()).toContain('route');
      });
    });

    when('[t2] goal.infer.triage --scope route outside a route', () => {
      const result = useThen('invoke goal.infer.triage --scope route', async () => {
        return invokeGoalSkill({
          skill: 'goal.infer.triage',
          args: { scope: 'route' },
          cwd: scene.tempDir, // NOT in a route directory
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stderr contains route error', () => {
        expect(result.stderr.toLowerCase()).toContain('route');
      });
    });
  });
});
