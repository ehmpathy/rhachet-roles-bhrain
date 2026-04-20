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
            'status.choice': 'inflight',
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
            'status.choice': 'fulfilled',
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
          args: { scope: 'repo', 'status.choice': 'enqueued' },
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

  given('[case6] upsert semantics: same slug twice updates (not duplicates)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-upsert' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-upsert', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] first goal.memory.set creates the goal', () => {
      const result = useThen('invoke goal.memory.set with YAML', async () => {
        const goalYaml = createGoalYaml({
          slug: 'upsert-test-goal',
          why: {
            ask: 'test upsert behavior',
            purpose: 'verify same slug updates',
            benefit: 'no duplicate files',
          },
          what: { outcome: 'original outcome' },
          how: { task: 'set goal twice', gate: 'single file exists' },
          status: { choice: 'enqueued', reason: 'first creation' },
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
        expect(result.stdout).toContain('upsert-test-goal');
      });
    });

    when('[t1] second goal.memory.set with same slug updates (not duplicates)', () => {
      const result = useThen('invoke goal.memory.set again', async () => {
        const goalYaml = createGoalYaml({
          slug: 'upsert-test-goal', // SAME slug
          why: {
            ask: 'test upsert behavior',
            purpose: 'verify same slug updates',
            benefit: 'no duplicate files',
          },
          what: { outcome: 'updated outcome' }, // DIFFERENT outcome
          how: { task: 'set goal twice', gate: 'single file exists' },
          status: { choice: 'inflight', reason: 'updated to inflight' }, // DIFFERENT status
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

      then('stdout contains updated status', () => {
        expect(result.stdout).toContain('inflight');
      });

      then('only one goal file exists (no duplicate)', async () => {
        const goalsDir = `${scene.tempDir}/.goals/feat.test-upsert`;
        const files = await fs.readdir(goalsDir);
        const goalFiles = files.filter((f) => f.endsWith('.goal.yaml'));
        expect(goalFiles).toHaveLength(1);
      });
    });

    when('[t2] goal.memory.get confirms updated content', () => {
      const result = useThen('invoke goal.memory.get', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.get',
          args: { scope: 'repo' },
          cwd: scene.tempDir,
        });
      });

      then('shows updated status', () => {
        expect(result.stdout).toContain('inflight');
      });

      then('shows updated outcome', () => {
        expect(result.stdout).toContain('updated outcome');
      });
    });
  });

  given('[case7] goal.memory.get display modes: list, --slug, --with asks', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-display-modes' });
      await execAsync('npx rhachet roles link --role achiever', { cwd: tempDir });
      await execAsync('git checkout -b feat/test-display-modes', { cwd: tempDir });

      // create two goals
      const goal1 = createGoalYaml({
        slug: 'display-test-goal-1',
        why: {
          ask: 'test display modes',
          purpose: 'verify output formats',
          benefit: 'proper UX',
        },
        what: { outcome: 'first goal outcome' },
        how: { task: 'display test', gate: 'snapshots match' },
        status: { choice: 'enqueued', reason: 'test' },
        source: 'peer:human',
      });

      const goal2 = createGoalYaml({
        slug: 'display-test-goal-2',
        why: {
          ask: 'another test goal',
          purpose: 'verify multiple goals',
          benefit: 'list mode works',
        },
        what: { outcome: 'second goal outcome' },
        how: { task: 'display test', gate: 'snapshots match' },
        status: { choice: 'inflight', reason: 'test' },
        source: 'peer:human',
      });

      // set goals
      await invokeGoalSkill({
        skill: 'goal.memory.set',
        args: { scope: 'repo' },
        cwd: tempDir,
        stdin: goal1,
      });

      await invokeGoalSkill({
        skill: 'goal.memory.set',
        args: { scope: 'repo' },
        cwd: tempDir,
        stdin: goal2,
      });

      // accumulate asks and cover first goal with them
      const asks = [
        'fix the display mode output format',
        'add truncated previews for asks in slug mode',
      ];

      // simulate asks via onTalk
      for (const ask of asks) {
        await invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk' },
          cwd: tempDir,
          stdin: JSON.stringify({ prompt: ask }),
        });
      }

      // read ask hashes to cover them
      const inventoryPath = `${tempDir}/.goals/feat.test-display-modes/asks.inventory.jsonl`;
      const inventoryContent = await fs.readFile(inventoryPath, 'utf-8');
      const askHashes = inventoryContent
        .trim()
        .split('\n')
        .map((line) => (JSON.parse(line) as { hash: string }).hash);

      // cover first goal with both asks
      for (const hash of askHashes) {
        await invokeGoalSkill({
          skill: 'goal.memory.set',
          args: { scope: 'repo', slug: 'display-test-goal-1', covers: hash },
          cwd: tempDir,
        });
      }

      return { tempDir };
    });

    when('[t0] goal.memory.get list mode shows coverage counts', () => {
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

      then('shows both goals', () => {
        expect(result.stdout).toContain('display-test-goal-1');
        expect(result.stdout).toContain('display-test-goal-2');
      });

      then('shows coverage count for first goal', () => {
        expect(result.stdout).toContain('covers = 2 asks');
      });

      then('shows tip for --slug', () => {
        expect(result.stdout).toContain('--slug');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] goal.memory.get --slug shows truncated ask previews', () => {
      const result = useThen('invoke goal.memory.get --slug', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.get',
          args: { scope: 'repo', slug: 'display-test-goal-1' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows only the requested goal', () => {
        expect(result.stdout).toContain('display-test-goal-1');
        expect(result.stdout).not.toContain('display-test-goal-2');
      });

      then('shows covered asks section', () => {
        expect(result.stdout).toContain('covers (2 asks)');
      });

      then('shows truncated ask content', () => {
        // should show first 30 chars of each ask
        expect(result.stdout).toContain('fix the display mode output fo...');
      });

      then('shows tip for --with asks', () => {
        expect(result.stdout).toContain('--with asks');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] goal.memory.get --slug --with asks shows full content', () => {
      const result = useThen('invoke goal.memory.get --slug --with asks', async () => {
        return invokeGoalSkill({
          skill: 'goal.memory.get',
          args: { scope: 'repo', slug: 'display-test-goal-1', with: 'asks' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows full ask content in sub.bucket', () => {
        expect(result.stdout).toContain('fix the display mode output format');
        expect(result.stdout).toContain(
          'add truncated previews for asks in slug mode',
        );
      });

      then('stdout has good vibes', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
