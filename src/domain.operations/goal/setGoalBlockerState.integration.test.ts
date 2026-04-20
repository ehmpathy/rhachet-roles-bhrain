import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { setGoalBlockerState } from './setGoalBlockerState';

describe('setGoalBlockerState.integration', () => {
  given('[case1] file system write', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-setGoalBlockerState-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] called on fresh state', () => {
      then('increments count to 1 and writes file', async () => {
        const result = await setGoalBlockerState({
          scopeDir: tempDir,
          goalSlug: 'fix-auth',
        });

        expect(result.state.count).toEqual(1);
        expect(result.state.goalSlug).toEqual('fix-auth');

        // verify file exists
        const statePath = path.join(tempDir, '.blockers.latest.json');
        const content = await fs.readFile(statePath, 'utf-8');
        const parsed = JSON.parse(content);
        expect(parsed.count).toEqual(1);
        expect(parsed.goalSlug).toEqual('fix-auth');
      });
    });

    when('[t1] called multiple times', () => {
      then('increments count each time', async () => {
        await setGoalBlockerState({ scopeDir: tempDir, goalSlug: 'goal-1' });
        await setGoalBlockerState({ scopeDir: tempDir, goalSlug: 'goal-2' });
        const result = await setGoalBlockerState({
          scopeDir: tempDir,
          goalSlug: 'goal-3',
        });

        expect(result.state.count).toEqual(3);
        expect(result.state.goalSlug).toEqual('goal-3');
      });
    });

    when('[t2] scopeDir does not exist', () => {
      then('creates directory and writes file', async () => {
        const nestedDir = path.join(tempDir, 'nested', 'deep');

        const result = await setGoalBlockerState({
          scopeDir: nestedDir,
          goalSlug: 'fix-test',
        });

        expect(result.state.count).toEqual(1);

        // verify directory was created
        const stat = await fs.stat(nestedDir);
        expect(stat.isDirectory()).toBe(true);
      });
    });
  });
});
