import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import {
  Goal,
  GoalHow,
  GoalStatus,
  GoalWhat,
  GoalWhy,
} from '@src/domain.objects/Achiever/Goal';

import { getGoals } from './getGoals';
import { setGoal, setGoalStatus } from './setGoal';

describe('getGoals.integration', () => {
  given('[case1] read all goals', () => {
    const tempDir = path.join(os.tmpdir(), `test-getGoals-all-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] multiple goals exist', () => {
      then('all goals are returned', async () => {
        // create two goals
        const goal1 = new Goal({
          slug: 'goal-one',
          why: new GoalWhy({
            ask: 'first ask',
            purpose: 'first purpose',
            benefit: 'first benefit',
          }),
          what: new GoalWhat({ outcome: 'first outcome' }),
          how: new GoalHow({ task: 'first task', gate: 'first gate' }),
          status: new GoalStatus({ choice: 'enqueued', reason: 'triage' }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        const goal2 = new Goal({
          slug: 'goal-two',
          why: new GoalWhy({
            ask: 'second ask',
            purpose: 'second purpose',
            benefit: 'second benefit',
          }),
          what: new GoalWhat({ outcome: 'second outcome' }),
          how: new GoalHow({ task: 'second task', gate: 'second gate' }),
          status: new GoalStatus({ choice: 'inflight', reason: 'started' }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        await setGoal({ goal: goal1, scopeDir: tempDir });
        await setGoal({ goal: goal2, scopeDir: tempDir });

        const result = await getGoals({ scopeDir: tempDir });

        expect(result.goals).toHaveLength(2);
        expect(result.goals.map((g) => g.slug).sort()).toEqual([
          'goal-one',
          'goal-two',
        ]);
      });
    });

    when('[t1] no goals exist', () => {
      then('empty list is returned', async () => {
        await fs.mkdir(tempDir, { recursive: true });

        const result = await getGoals({ scopeDir: tempDir });

        expect(result.goals).toHaveLength(0);
      });
    });

    when('[t2] directory does not exist', () => {
      then('empty list is returned', async () => {
        const result = await getGoals({
          scopeDir: path.join(tempDir, 'nonexistent'),
        });

        expect(result.goals).toHaveLength(0);
      });
    });
  });

  given('[case2] filter by status', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-getGoals-filter-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] filter by inflight status', () => {
      then('only inflight goals are returned', async () => {
        // create goals with different statuses
        const enqueuedGoal = new Goal({
          slug: 'enqueued-goal',
          why: new GoalWhy({
            ask: 'ask',
            purpose: 'purpose',
            benefit: 'benefit',
          }),
          what: new GoalWhat({ outcome: 'outcome' }),
          how: new GoalHow({ task: 'task', gate: 'gate' }),
          status: new GoalStatus({ choice: 'enqueued', reason: 'new' }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        const inflightGoal = new Goal({
          slug: 'inflight-goal',
          why: new GoalWhy({
            ask: 'ask',
            purpose: 'purpose',
            benefit: 'benefit',
          }),
          what: new GoalWhat({ outcome: 'outcome' }),
          how: new GoalHow({ task: 'task', gate: 'gate' }),
          status: new GoalStatus({ choice: 'inflight', reason: 'started' }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        await setGoal({ goal: enqueuedGoal, scopeDir: tempDir });
        await setGoal({ goal: inflightGoal, scopeDir: tempDir });

        const result = await getGoals({
          scopeDir: tempDir,
          filter: { status: 'inflight' },
        });

        expect(result.goals).toHaveLength(1);
        expect(result.goals[0]?.slug).toEqual('inflight-goal');
      });
    });
  });

  given('[case3] filter by slug', () => {
    const tempDir = path.join(os.tmpdir(), `test-getGoals-slug-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] filter by specific slug', () => {
      then('only that goal is returned', async () => {
        const goal1 = new Goal({
          slug: 'target-goal',
          why: new GoalWhy({
            ask: 'target ask',
            purpose: 'target purpose',
            benefit: 'target benefit',
          }),
          what: new GoalWhat({ outcome: 'target outcome' }),
          how: new GoalHow({ task: 'target task', gate: 'target gate' }),
          status: new GoalStatus({ choice: 'enqueued', reason: 'new' }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        const goal2 = new Goal({
          slug: 'other-goal',
          why: new GoalWhy({
            ask: 'other ask',
            purpose: 'other purpose',
            benefit: 'other benefit',
          }),
          what: new GoalWhat({ outcome: 'other outcome' }),
          how: new GoalHow({ task: 'other task', gate: 'other gate' }),
          status: new GoalStatus({ choice: 'enqueued', reason: 'new' }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        await setGoal({ goal: goal1, scopeDir: tempDir });
        await setGoal({ goal: goal2, scopeDir: tempDir });

        const result = await getGoals({
          scopeDir: tempDir,
          filter: { slug: 'target-goal' },
        });

        expect(result.goals).toHaveLength(1);
        expect(result.goals[0]?.slug).toEqual('target-goal');
        expect(result.goals[0]?.why?.ask).toEqual('target ask');
      });
    });
  });

  given('[case4] status from flag file', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-getGoals-status-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] goal status is updated via setGoalStatus', () => {
      then('getGoals returns updated status', async () => {
        // create goal with enqueued status
        const goal = new Goal({
          slug: 'status-test',
          why: new GoalWhy({
            ask: 'ask',
            purpose: 'purpose',
            benefit: 'benefit',
          }),
          what: new GoalWhat({ outcome: 'outcome' }),
          how: new GoalHow({ task: 'task', gate: 'gate' }),
          status: new GoalStatus({ choice: 'enqueued', reason: 'initial' }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        await setGoal({ goal, scopeDir: tempDir });

        // verify enqueued
        let result = await getGoals({ scopeDir: tempDir });
        expect(result.goals[0]?.status.choice).toEqual('enqueued');

        // update to fulfilled
        await setGoalStatus({
          slug: 'status-test',
          status: { choice: 'fulfilled', reason: 'completed' },
          scopeDir: tempDir,
        });

        // verify fulfilled
        result = await getGoals({ scopeDir: tempDir });
        expect(result.goals[0]?.status.choice).toEqual('fulfilled');
        expect(result.goals[0]?.status.reason).toEqual('completed');
      });
    });
  });
});
