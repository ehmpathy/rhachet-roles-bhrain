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

import { getTriageState } from './getTriageState';
import { setAsk } from './setAsk';
import { setCoverage } from './setCoverage';
import { setGoal } from './setGoal';

describe('getTriageState.integration', () => {
  given('[case1] empty state', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-getTriageState-empty-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] no asks, no goals', () => {
      then('returns empty arrays', async () => {
        await fs.mkdir(tempDir, { recursive: true });

        const result = await getTriageState({ scopeDir: tempDir });

        expect(result.asks).toHaveLength(0);
        expect(result.asksUncovered).toHaveLength(0);
        expect(result.goals).toHaveLength(0);
        expect(result.coverage).toHaveLength(0);
      });
    });

    when('[t1] directory does not exist', () => {
      then('returns empty arrays', async () => {
        const result = await getTriageState({
          scopeDir: path.join(tempDir, 'nonexistent'),
        });

        expect(result.asks).toHaveLength(0);
        expect(result.asksUncovered).toHaveLength(0);
        expect(result.goals).toHaveLength(0);
        expect(result.coverage).toHaveLength(0);
      });
    });
  });

  given('[case2] asks with no coverage', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-getTriageState-uncovered-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] asks exist but no coverage', () => {
      then('all asks are uncovered', async () => {
        // create asks
        await setAsk({ content: 'fix the test', scopeDir: tempDir });
        await setAsk({ content: 'update the readme', scopeDir: tempDir });

        const result = await getTriageState({ scopeDir: tempDir });

        expect(result.asks).toHaveLength(2);
        expect(result.asksUncovered).toHaveLength(2);
        expect(result.coverage).toHaveLength(0);
      });
    });
  });

  given('[case3] partial coverage', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-getTriageState-partial-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] some asks covered, some not', () => {
      then('uncovered asks are identified', async () => {
        // create asks
        const ask1 = await setAsk({
          content: 'fix the test',
          scopeDir: tempDir,
        });
        await setAsk({ content: 'update the readme', scopeDir: tempDir });

        // cover only the first ask
        await setCoverage({
          hashes: [ask1.ask.hash],
          goalSlug: 'fix-test',
          scopeDir: tempDir,
        });

        const result = await getTriageState({ scopeDir: tempDir });

        expect(result.asks).toHaveLength(2);
        expect(result.asksUncovered).toHaveLength(1);
        expect(result.asksUncovered[0]?.content).toEqual('update the readme');
        expect(result.coverage).toHaveLength(1);
      });
    });
  });

  given('[case4] full coverage', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-getTriageState-full-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] all asks covered', () => {
      then('no uncovered asks', async () => {
        // create asks
        const ask1 = await setAsk({
          content: 'fix the test',
          scopeDir: tempDir,
        });
        const ask2 = await setAsk({
          content: 'update the readme',
          scopeDir: tempDir,
        });

        // cover both
        await setCoverage({
          hashes: [ask1.ask.hash, ask2.ask.hash],
          goalSlug: 'multi-goal',
          scopeDir: tempDir,
        });

        const result = await getTriageState({ scopeDir: tempDir });

        expect(result.asks).toHaveLength(2);
        expect(result.asksUncovered).toHaveLength(0);
        expect(result.coverage).toHaveLength(2);
      });
    });
  });

  given('[case5] with extant goals', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-getTriageState-goals-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] goals exist', () => {
      then('goals are returned', async () => {
        // create a goal
        const goal = new Goal({
          slug: 'fix-test',
          why: new GoalWhy({
            ask: 'fix the test',
            purpose: 'ci should pass',
            benefit: 'ship faster',
          }),
          what: new GoalWhat({ outcome: 'test passes' }),
          how: new GoalHow({ task: 'debug', gate: 'passes' }),
          status: new GoalStatus({ choice: 'enqueued', reason: 'new' }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        await setGoal({ goal, scopeDir: tempDir });

        const result = await getTriageState({ scopeDir: tempDir });

        expect(result.goals).toHaveLength(1);
        expect(result.goals[0]?.slug).toEqual('fix-test');
      });
    });
  });

  given('[case6] complete triage scenario', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-getTriageState-complete-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] realistic triage state', () => {
      then('all components are returned correctly', async () => {
        // create asks
        const ask1 = await setAsk({
          content: 'fix the flaky test',
          scopeDir: tempDir,
        });
        const ask2 = await setAsk({
          content: 'update the readme',
          scopeDir: tempDir,
        });
        const ask3 = await setAsk({
          content: 'notify me on slack',
          scopeDir: tempDir,
        });

        // create goal for first ask
        const goal = new Goal({
          slug: 'fix-flaky-test',
          why: new GoalWhy({
            ask: 'fix the flaky test',
            purpose: 'ci should pass',
            benefit: 'team can ship',
          }),
          what: new GoalWhat({ outcome: 'test passes reliably' }),
          how: new GoalHow({
            task: 'debug flake',
            gate: '10 consecutive passes',
          }),
          status: new GoalStatus({ choice: 'inflight', reason: 'started' }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        await setGoal({
          goal,
          covers: [ask1.ask.hash],
          scopeDir: tempDir,
        });

        const result = await getTriageState({ scopeDir: tempDir });

        // verify asks
        expect(result.asks).toHaveLength(3);

        // verify uncovered (ask2 and ask3)
        expect(result.asksUncovered).toHaveLength(2);
        const uncoveredContent = result.asksUncovered.map((a) => a.content);
        expect(uncoveredContent).toContain('update the readme');
        expect(uncoveredContent).toContain('notify me on slack');

        // verify goals
        expect(result.goals).toHaveLength(1);
        expect(result.goals[0]?.slug).toEqual('fix-flaky-test');

        // verify coverage
        expect(result.coverage).toHaveLength(1);
        expect(result.coverage[0]?.hash).toEqual(ask1.ask.hash);
      });
    });
  });
});
