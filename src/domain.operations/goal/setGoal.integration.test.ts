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

import { setGoal, setGoalStatus } from './setGoal';

describe('setGoal.integration', () => {
  given('[case1] file system persistence', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-setGoal-persist-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] goal is created with full schema', () => {
      then('goal.yaml file exists on disk', async () => {
        const goal = new Goal({
          slug: 'fix-auth-test',
          why: new GoalWhy({
            ask: 'fix the flaky test',
            purpose: 'ci should pass',
            benefit: 'team can ship',
          }),
          what: new GoalWhat({
            outcome: 'auth.test.ts passes reliably',
          }),
          how: new GoalHow({
            task: 'run test in isolation, find flake source',
            gate: 'test passes 10 consecutive runs',
          }),
          status: new GoalStatus({
            choice: 'enqueued',
            reason: 'goal created from triage',
          }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        const result = await setGoal({
          goal,
          scopeDir: tempDir,
        });

        // verify path returned
        expect(result.path).toContain('.fix-auth-test.goal.yaml');

        // verify file exists
        const stat = await fs.stat(result.path);
        expect(stat.isFile()).toBe(true);

        // verify yaml content
        const content = await fs.readFile(result.path, 'utf-8');
        expect(content).toContain('slug:');
        expect(content).toContain('fix-auth-test');
        expect(content).toContain('fix the flaky test');
      });

      then('status flag file exists on disk', async () => {
        const goal = new Goal({
          slug: 'update-readme',
          why: new GoalWhy({
            ask: 'update the readme',
            purpose: 'docs should be current',
            benefit: 'new contributors onboard faster',
          }),
          what: new GoalWhat({
            outcome: 'readme mentions env var',
          }),
          how: new GoalHow({
            task: 'edit readme, add env var section',
            gate: 'readme contains env var name and example',
          }),
          status: new GoalStatus({
            choice: 'enqueued',
            reason: 'created from triage',
          }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        await setGoal({
          goal,
          scopeDir: tempDir,
        });

        // verify status flag exists
        const files = await fs.readdir(tempDir);
        const statusFlag = files.find((f) =>
          f.includes('.status=enqueued.flag'),
        );
        expect(statusFlag).toBeDefined();
      });
    });

    when('[t1] goal is created with coverage', () => {
      then('coverage entries are appended to asks.coverage.jsonl', async () => {
        const goal = new Goal({
          slug: 'fix-test',
          why: new GoalWhy({
            ask: 'fix the test',
            purpose: 'ci should pass',
            benefit: 'ship faster',
          }),
          what: new GoalWhat({
            outcome: 'test passes',
          }),
          how: new GoalHow({
            task: 'debug and fix',
            gate: 'test passes',
          }),
          status: new GoalStatus({
            choice: 'enqueued',
            reason: 'triage',
          }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        const result = await setGoal({
          goal,
          covers: ['hash1', 'hash2'],
          scopeDir: tempDir,
        });

        // verify covered hashes returned
        expect(result.covered).toEqual(['hash1', 'hash2']);

        // verify coverage file exists
        const coveragePath = path.join(tempDir, 'asks.coverage.jsonl');
        const content = await fs.readFile(coveragePath, 'utf-8');
        const lines = content.trim().split('\n');
        expect(lines).toHaveLength(2);

        const parsed = lines.map((line) => JSON.parse(line));
        expect(parsed[0].hash).toEqual('hash1');
        expect(parsed[0].goalSlug).toEqual('fix-test');
        expect(parsed[1].hash).toEqual('hash2');
      });
    });
  });

  given('[case2] goal status update', () => {
    const tempDir = path.join(os.tmpdir(), `test-setGoalStatus-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] goal status is updated', () => {
      then('old status flag is removed, new flag created', async () => {
        // first create a goal
        const goal = new Goal({
          slug: 'my-goal',
          why: new GoalWhy({
            ask: 'do the task',
            purpose: 'needs done',
            benefit: 'progress',
          }),
          what: new GoalWhat({
            outcome: 'task is done',
          }),
          how: new GoalHow({
            task: 'do it',
            gate: 'done',
          }),
          status: new GoalStatus({
            choice: 'enqueued',
            reason: 'initial',
          }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        await setGoal({ goal, scopeDir: tempDir });

        // verify enqueued flag exists
        let files = await fs.readdir(tempDir);
        expect(files.some((f) => f.includes('.status=enqueued.flag'))).toBe(
          true,
        );

        // update status to inflight
        await setGoalStatus({
          slug: 'my-goal',
          status: {
            choice: 'inflight',
            reason: 'work started',
          },
          scopeDir: tempDir,
        });

        // verify enqueued flag removed, inflight flag exists
        files = await fs.readdir(tempDir);
        expect(files.some((f) => f.includes('.status=enqueued.flag'))).toBe(
          false,
        );
        expect(files.some((f) => f.includes('.status=inflight.flag'))).toBe(
          true,
        );
      });

      then('goal yaml is updated with new reason', async () => {
        // create a goal
        const goal = new Goal({
          slug: 'test-goal',
          why: new GoalWhy({
            ask: 'test',
            purpose: 'test',
            benefit: 'test',
          }),
          what: new GoalWhat({
            outcome: 'test',
          }),
          how: new GoalHow({
            task: 'test',
            gate: 'test',
          }),
          status: new GoalStatus({
            choice: 'enqueued',
            reason: 'initial reason',
          }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        await setGoal({ goal, scopeDir: tempDir });

        // update with new reason
        const result = await setGoalStatus({
          slug: 'test-goal',
          status: {
            choice: 'fulfilled',
            reason: 'test passes 10 consecutive runs',
          },
          scopeDir: tempDir,
        });

        // verify yaml contains new reason
        const content = await fs.readFile(result.path, 'utf-8');
        expect(content).toContain('test passes 10 consecutive runs');
      });
    });

    when('[t1] goal not found', () => {
      then('error is thrown', async () => {
        await fs.mkdir(tempDir, { recursive: true });

        await expect(
          setGoalStatus({
            slug: 'nonexistent',
            status: {
              choice: 'fulfilled',
              reason: 'done',
            },
            scopeDir: tempDir,
          }),
        ).rejects.toThrow('goal not found: nonexistent');
      });
    });
  });
});
