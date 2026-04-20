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
 * .what = integration tests for hook.onTalk ask accumulation
 * .why = verifies CLI reads stdin, calls setAsk, emits reminder, exits 0
 *
 * ## exhaustive snapshot coverage
 *
 * | case | variant | type | stdout | stderr |
 * |------|---------|------|--------|--------|
 * | 1 | normal message via stdin | positive | snapped | snapped |
 * | 2 | empty message via stdin | edge | snapped | snapped |
 * | 3 | multiple messages in sequence | positive | snapped | snapped |
 * | 4 | duplicate message | edge | snapped | snapped |
 * | 5 | malformed JSON stdin | edge | snapped | snapped |
 * | 6 | output format matches vision | positive | snapped | snapped |
 * | 7 | special chars and emoji | edge | snapped | snapped |
 * | 8 | multiline message | edge | snapped | snapped |
 * | 9 | invalid scope argument | negative | snapped | snapped |
 * | 10 | --help flag | edge | snapped | snapped |
 * | 11 | prompt field is null | edge | snapped | snapped |
 * | 12 | prompt field is number | edge | snapped | snapped |
 * | 13 | prompt field is absent | edge | snapped | snapped |
 * | 14 | empty stdin | edge | snapped | snapped |
 * | 15 | unrecognized --when argument | edge | snapped | snapped |
 */
describe('achiever.goal.onTalk.integration', () => {
  given('[case1] normal message via stdin', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-normal' });

      // link the achiever role
      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      // create feature branch (goals on main are forbidden)
      await execAsync('git checkout -b feat/test-ontalk', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] hook.onTalk is invoked with prompt', () => {
      const result = useThen('invoke goal.triage.infer --when hook.onTalk', async () => {
        const stdinJson = JSON.stringify({
          prompt: 'help me refactor the auth module',
        });

        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk' },
          cwd: scene.tempDir,
          stdin: stdinJson,
        });
      });

      then('exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('ask appended to asks.inventory.jsonl', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk/asks.inventory.jsonl',
        );
        const content = await fs.readFile(inventoryPath, 'utf-8');
        const lines = content.trim().split('\n');
        expect(lines.length).toEqual(1);
        const ask = JSON.parse(lines[0] as string);
        expect(ask.content).toEqual('help me refactor the auth module');
        expect(ask.hash).toBeDefined();
      });

      then('reminder emitted to stderr', () => {
        expect(result.stderr).toContain('goal.triage.infer');
        expect(result.stderr).toContain('help me refactor the auth module');
        expect(result.stderr).toContain('consider: does this impact your goals?');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] empty message via stdin', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-empty' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-empty', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] hook.onTalk is invoked with empty prompt', () => {
      const result = useThen('invoke with empty stdin', async () => {
        const stdinJson = JSON.stringify({ prompt: '' });

        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk' },
          cwd: scene.tempDir,
          stdin: stdinJson,
        });
      });

      then('exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('no ask appended', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk-empty/asks.inventory.jsonl',
        );
        const exists = await fs
          .access(inventoryPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });

      then('exits silently (no stderr output)', () => {
        expect(result.stderr.trim()).toEqual('');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case3] multiple messages in sequence', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-multi' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-multi', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] three messages are sent in sequence', () => {
      const results = useThen('invoke three times', async () => {
        const messages = [
          'first message',
          'second message',
          'third message',
        ];

        const resultsList = [];
        for (const msg of messages) {
          const result = await invokeGoalSkill({
            skill: 'goal.triage.infer',
            args: { when: 'hook.onTalk' },
            cwd: scene.tempDir,
            stdin: JSON.stringify({ prompt: msg }),
          });
          resultsList.push(result);
        }
        return resultsList;
      });

      then('all exits 0', () => {
        expect(results[0]?.code).toEqual(0);
        expect(results[1]?.code).toEqual(0);
        expect(results[2]?.code).toEqual(0);
      });

      then('all asks appended in order', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk-multi/asks.inventory.jsonl',
        );
        const content = await fs.readFile(inventoryPath, 'utf-8');
        const lines = content.trim().split('\n');
        expect(lines.length).toEqual(3);

        const asks = lines.map((line) => JSON.parse(line));
        expect(asks[0].content).toEqual('first message');
        expect(asks[1].content).toEqual('second message');
        expect(asks[2].content).toEqual('third message');
      });

      then('stderr of message 1 matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(results[0]?.stderr ?? '')).toMatchSnapshot();
      });

      then('stderr of message 2 matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(results[1]?.stderr ?? '')).toMatchSnapshot();
      });

      then('stderr of message 3 matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(results[2]?.stderr ?? '')).toMatchSnapshot();
      });

      then('stdout of message 1 matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(results[0]?.stdout ?? '')).toMatchSnapshot();
      });

      then('stdout of message 2 matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(results[1]?.stdout ?? '')).toMatchSnapshot();
      });

      then('stdout of message 3 matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(results[2]?.stdout ?? '')).toMatchSnapshot();
      });
    });
  });

  given('[case4] duplicate message', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-dup' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-dup', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] same message is sent twice', () => {
      const results = useThen('invoke twice with same content', async () => {
        const resultsList = [];
        for (let i = 0; i < 2; i++) {
          const result = await invokeGoalSkill({
            skill: 'goal.triage.infer',
            args: { when: 'hook.onTalk' },
            cwd: scene.tempDir,
            stdin: JSON.stringify({ prompt: 'same message' }),
          });
          resultsList.push(result);
        }
        return resultsList;
      });

      then('creates separate entries', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk-dup/asks.inventory.jsonl',
        );
        const content = await fs.readFile(inventoryPath, 'utf-8');
        const lines = content.trim().split('\n');
        expect(lines.length).toEqual(2);

        // both entries exist and have same content
        const asks = lines.map((line) => JSON.parse(line));
        expect(asks[0].content).toEqual('same message');
        expect(asks[1].content).toEqual('same message');
      });

      then('stderr of invocation 1 matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(results[0]?.stderr ?? '')).toMatchSnapshot();
      });

      then('stderr of invocation 2 matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(results[1]?.stderr ?? '')).toMatchSnapshot();
      });

      then('stdout of invocation 1 matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(results[0]?.stdout ?? '')).toMatchSnapshot();
      });

      then('stdout of invocation 2 matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(results[1]?.stdout ?? '')).toMatchSnapshot();
      });
    });
  });

  given('[case5] malformed JSON stdin', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-malform' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-malform', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] hook.onTalk is invoked with malformed JSON', () => {
      const result = useThen('invoke with invalid JSON', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk' },
          cwd: scene.tempDir,
          stdin: 'not valid json',
        });
      });

      then('exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('no ask appended', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk-malform/asks.inventory.jsonl',
        );
        const exists = await fs
          .access(inventoryPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });

      then('exits silently', () => {
        expect(result.stderr.trim()).toEqual('');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case6] output format matches vision', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-format' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-format', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] hook.onTalk is invoked', () => {
      const result = useThen('invoke with test prompt', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk' },
          cwd: scene.tempDir,
          stdin: JSON.stringify({ prompt: 'test the format output' }),
        });
      });

      then('owl header present', () => {
        expect(result.stderr).toContain('🦉');
      });

      then('full message in sub.bucket', () => {
        expect(result.stderr).toContain('test the format output');
        // verify treestruct format with ├─ and └─
        expect(result.stderr).toContain('├─');
        expect(result.stderr).toContain('└─');
      });

      then('consider prompt present', () => {
        expect(result.stderr).toContain('consider: does this impact your goals?');
      });

      then('triage command shown', () => {
        expect(result.stderr).toContain('rhx goal.triage.infer');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case7] special chars and emoji', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-emoji' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-emoji', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] message contains emoji and special chars', () => {
      const result = useThen('invoke with emoji message', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk' },
          cwd: scene.tempDir,
          stdin: JSON.stringify({ prompt: 'fix the test 🐢🌊 with special chars: <>&"\'' }),
        });
      });

      then('exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('emoji preserved in inventory', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk-emoji/asks.inventory.jsonl',
        );
        const content = await fs.readFile(inventoryPath, 'utf-8');
        const ask = JSON.parse(content.trim());
        expect(ask.content).toContain('🐢🌊');
        expect(ask.content).toContain('<>&"\'');
      });

      then('emoji preserved in stderr', () => {
        expect(result.stderr).toContain('🐢🌊');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case8] multiline message', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-multiline' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-multiline', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] message contains newlines', () => {
      const result = useThen('invoke with multiline message', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk' },
          cwd: scene.tempDir,
          stdin: JSON.stringify({ prompt: 'line one\nline two\nline three' }),
        });
      });

      then('exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('multiline preserved in inventory', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk-multiline/asks.inventory.jsonl',
        );
        const content = await fs.readFile(inventoryPath, 'utf-8');
        const ask = JSON.parse(content.trim());
        expect(ask.content).toEqual('line one\nline two\nline three');
      });

      then('each line shown in stderr', () => {
        expect(result.stderr).toContain('line one');
        expect(result.stderr).toContain('line two');
        expect(result.stderr).toContain('line three');
      });

      then('multiline stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case9] invalid scope argument (negative path)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-badscope' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-badscope', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] hook.onTalk is invoked with invalid --scope', () => {
      const result = useThen('invoke with bad scope', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk', scope: 'invalid' },
          cwd: scene.tempDir,
          stdin: JSON.stringify({ prompt: 'test message' }),
        });
      });

      then('exits non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('error message indicates invalid scope', () => {
        expect(result.stderr).toContain('invalid scope');
      });

      then('error output matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case10] --help flag (edge case)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-help' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-help', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] --help is invoked', () => {
      const result = useThen('invoke with --help', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { help: true },
          cwd: scene.tempDir,
        });
      });

      then('exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows usage information', () => {
        // help output may go to stdout or stderr
        const output = result.stdout + result.stderr;
        expect(output).toContain('goal.triage.infer');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case11] prompt field is null (edge case)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-nullprompt' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-nullprompt', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] prompt field is null', () => {
      const result = useThen('invoke with null prompt', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk' },
          cwd: scene.tempDir,
          stdin: JSON.stringify({ prompt: null }),
        });
      });

      then('exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('no ask appended', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk-nullprompt/asks.inventory.jsonl',
        );
        const exists = await fs
          .access(inventoryPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case12] prompt field is number (edge case)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-numprompt' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-numprompt', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] prompt field is a number', () => {
      const result = useThen('invoke with number prompt', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk' },
          cwd: scene.tempDir,
          stdin: JSON.stringify({ prompt: 123 }),
        });
      });

      then('exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('no ask appended', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk-numprompt/asks.inventory.jsonl',
        );
        const exists = await fs
          .access(inventoryPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case13] prompt field is absent (edge case)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-noprompt' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-noprompt', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] JSON has no prompt field', () => {
      const result = useThen('invoke with no prompt field', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk' },
          cwd: scene.tempDir,
          stdin: JSON.stringify({ message: 'hello', user: 'test' }),
        });
      });

      then('exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('no ask appended', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk-noprompt/asks.inventory.jsonl',
        );
        const exists = await fs
          .access(inventoryPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case14] empty stdin (edge case)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-nostdin' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-nostdin', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] stdin is empty', () => {
      const result = useThen('invoke with no stdin', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'hook.onTalk' },
          cwd: scene.tempDir,
          stdin: '',
        });
      });

      then('exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('no ask appended', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk-nostdin/asks.inventory.jsonl',
        );
        const exists = await fs
          .access(inventoryPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case15] unrecognized --when argument (edge case)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForGoals({ slug: 'goal-ontalk-badwhen' });

      await execAsync('npx rhachet roles link --role achiever', {
        cwd: tempDir,
      });

      await execAsync('git checkout -b feat/test-ontalk-badwhen', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] --when has unrecognized value', () => {
      const result = useThen('invoke with unrecognized when', async () => {
        return invokeGoalSkill({
          skill: 'goal.triage.infer',
          args: { when: 'invalid.mode' },
          cwd: scene.tempDir,
          stdin: JSON.stringify({ prompt: 'test message' }),
        });
      });

      then('exits 0 (graceful no-op)', () => {
        expect(result.code).toEqual(0);
      });

      then('no ask appended', async () => {
        const inventoryPath = path.join(
          scene.tempDir,
          '.goals/feat.test-ontalk-badwhen/asks.inventory.jsonl',
        );
        const exists = await fs
          .access(inventoryPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
