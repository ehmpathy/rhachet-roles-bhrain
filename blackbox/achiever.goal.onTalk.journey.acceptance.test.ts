import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { execAsync } from './.test/invokeRouteSkill';
import {
  genTempDirForGoals,
  invokeGoalSkill,
  sanitizeGoalOutputForSnapshot,
} from './.test/invokeGoalSkill';

/**
 * .what = journey test for onTalk hook accumulation and triage display
 * .why = verifies the full flow from ask accumulation to uncovered ask display
 *
 * the journey:
 * 1. start with empty state (no asks)
 * 2. accumulate asks via hook.onTalk
 * 3. triage shows uncovered asks with [hash] format
 * 4. create goal to cover asks
 * 5. triage shows coverage progress
 */
describe('achiever.goal.onTalk.journey', () => {
  given('[case1] onTalk accumulates asks then triage shows them', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'ontalk-journey' });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/ontalk-journey', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] before any asks', () => {
      const res = useThen('triage shows zero asks', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: {},
          cwd: scene.tempDir,
        });
      });

      then('exits 0', () => {
        expect(res.code).toEqual(0);
      });

      then('output shows asks = 0', () => {
        expect(res.stdout).toContain('asks = 0');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(res.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] three asks accumulated via onTalk', () => {
      const res = useThen('accumulate three asks', async () => {
        const asks = [
          'fix the flaky test in auth module',
          'add retry logic to the api client',
          'update the readme with new setup steps',
        ];

        const results: Array<{ stdout: string; stderr: string; code: number }> = [];

        for (const ask of asks) {
          const result = await invokeGoalSkill({
            skill: 'goal.triage.infer',
            args: { when: 'hook.onTalk' },
            cwd: scene.tempDir,
            stdin: JSON.stringify({ prompt: ask }),
          });
          results.push(result);
        }

        return { results };
      });

      then('all three calls exit 0', () => {
        for (const result of res.results) {
          expect(result.code).toEqual(0);
        }
      });

      then('asks.inventory.jsonl has 3 entries', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.ontalk-journey/asks.inventory.jsonl',
        );
        const content = await fs.readFile(inventoryPath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        expect(lines.length).toEqual(3);
      });
    });

    when('[t2] triage.infer shows uncovered asks', () => {
      const res = useThen('run triage', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: {},
          cwd: scene.tempDir,
        });
      });

      then('exits 0', () => {
        expect(res.code).toEqual(0);
      });

      then('output shows asks = 3', () => {
        expect(res.stdout).toContain('asks = 3');
      });

      then('output shows uncovered = 3', () => {
        expect(res.stdout).toContain('uncovered = 3');
      });

      then('output shows [hash] with full content for each ask', () => {
        // hash appears on its own line, content in sub.bucket below
        expect(res.stdout).toMatch(/\[[a-f0-9]+\]/); // hash format
        expect(res.stdout).toContain('fix the flaky test in auth module');
        expect(res.stdout).toContain('add retry logic to the api client');
        expect(res.stdout).toContain('update the readme with new setup steps');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(res.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] goal created to cover one ask', () => {
      const res = useThen('create goal with covers', async () => {
        // read asks to get first hash
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.ontalk-journey/asks.inventory.jsonl',
        );
        const content = await fs.readFile(inventoryPath, 'utf-8');
        const lines = content.trim().split('\n');
        const firstAsk = JSON.parse(lines[0]!) as { hash: string };
        const hashToCover = firstAsk.hash;

        // create goal that covers this ask via stdin YAML
        const goalYaml = `slug: fix-flaky-auth-test
why:
  ask: fix the flaky test
  purpose: test stability
  benefit: reliable ci
what:
  outcome: test passes consistently
how:
  task: add retry or fix race condition
  gate: test passes 10 times in a row
status:
  choice: enqueued
  reason: ready to work
source: peer:human
`;

        const result = await invokeGoalSkill({
          skill: 'goal.memory.set',
          args: { covers: hashToCover },
          cwd: scene.tempDir,
          stdin: goalYaml,
        });

        return { result, hashCovered: hashToCover };
      });

      then('goal.memory.set exits 0', () => {
        expect(res.result.code).toEqual(0);
      });

      then('goal file was created', async () => {
        const goalsDir = path.join(scene.tempDir, '.goals/feat.ontalk-journey');
        const files = await fs.readdir(goalsDir);
        const goalFiles = files.filter((f) => f.endsWith('.goal.yaml'));
        expect(goalFiles.length).toBeGreaterThan(0);
      });

      then('asks.coverage.jsonl updated', async () => {
        const coveragePath = path.join(
          scene.tempDir,
          '.goals/feat.ontalk-journey/asks.coverage.jsonl',
        );
        const content = await fs.readFile(coveragePath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        expect(lines.length).toEqual(1);
        const entry = JSON.parse(lines[0]!) as { hash: string };
        expect(entry.hash).toEqual(res.hashCovered);
      });
    });

    when('[t4] triage shows partial coverage', () => {
      const res = useThen('run triage after one goal', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: {},
          cwd: scene.tempDir,
        });
      });

      then('exits 0', () => {
        expect(res.code).toEqual(0);
      });

      then('output shows coverage = 1', () => {
        expect(res.stdout).toContain('coverage = 1');
      });

      then('output shows uncovered = 2', () => {
        expect(res.stdout).toContain('uncovered = 2');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(res.stdout)).toMatchSnapshot();
      });
    });

    when('[t5] all asks covered by goals', () => {
      const res = useThen('cover rest of asks', async () => {
        // read asks to get all hashes
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.ontalk-journey/asks.inventory.jsonl',
        );
        const content = await fs.readFile(inventoryPath, 'utf-8');
        const lines = content.trim().split('\n');

        // read coverage to find which are already covered
        const coveragePath = path.join(
          scene.tempDir,
          '.goals/feat.ontalk-journey/asks.coverage.jsonl',
        );
        const coveredHashes: Set<string> = new Set();
        try {
          const coverageContent = await fs.readFile(coveragePath, 'utf-8');
          const coverageLines = coverageContent.trim().split('\n');
          for (const line of coverageLines) {
            const entry = JSON.parse(line) as { hash: string };
            coveredHashes.add(entry.hash);
          }
        } catch {
          // no coverage yet
        }

        // get hashes not yet covered
        const uncoveredHashes: string[] = [];
        for (const line of lines) {
          const ask = JSON.parse(line) as { hash: string };
          if (!coveredHashes.has(ask.hash)) {
            uncoveredHashes.push(ask.hash);
          }
        }

        // create goals for each uncovered ask
        for (let i = 0; i < uncoveredHashes.length; i++) {
          const hash = uncoveredHashes[i]!;
          const goalYaml = `slug: task-${i + 2}
why:
  ask: task ${i + 2}
  purpose: complete work
  benefit: progress
what:
  outcome: task done
how:
  task: do the work
  gate: verified complete
status:
  choice: enqueued
  reason: ready
source: peer:human
`;

          await invokeGoalSkill({
            skill: 'goal.memory.set',
            args: { covers: hash },
            cwd: scene.tempDir,
            stdin: goalYaml,
          });
        }

        // run final triage
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: {},
          cwd: scene.tempDir,
        });
      });

      then('exits 0', () => {
        expect(res.code).toEqual(0);
      });

      then('output shows asks = 3', () => {
        expect(res.stdout).toContain('asks = 3');
      });

      then('output shows coverage = 3', () => {
        expect(res.stdout).toContain('coverage = 3');
      });

      then('output shows uncovered = 0', () => {
        expect(res.stdout).toContain('uncovered = 0');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(res.stdout)).toMatchSnapshot();
      });
    });
  });
});
