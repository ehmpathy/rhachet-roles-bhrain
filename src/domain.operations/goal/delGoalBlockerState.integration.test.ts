import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { delGoalBlockerState } from './delGoalBlockerState';
import { getGoalBlockerState } from './getGoalBlockerState';
import { setGoalBlockerState } from './setGoalBlockerState';

describe('delGoalBlockerState.integration', () => {
  given('[case1] file system delete', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-delGoalBlockerState-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] .blockers.latest.json exists', () => {
      then('removes file and returns cleared true', async () => {
        // set up blocker state
        await setGoalBlockerState({ scopeDir: tempDir, goalSlug: 'fix-auth' });

        // verify file exists
        const statePath = path.join(tempDir, '.blockers.latest.json');
        const statBefore = await fs.stat(statePath);
        expect(statBefore.isFile()).toBe(true);

        // delete
        const result = await delGoalBlockerState({ scopeDir: tempDir });

        expect(result.cleared).toBe(true);

        // verify file no longer exists
        await expect(fs.stat(statePath)).rejects.toThrow('ENOENT');
      });
    });

    when('[t1] .blockers.latest.json does not exist', () => {
      then('returns cleared true (idempotent)', async () => {
        await fs.mkdir(tempDir, { recursive: true });

        const result = await delGoalBlockerState({ scopeDir: tempDir });

        expect(result.cleared).toBe(true);
      });
    });

    when('[t2] del then get', () => {
      then('get returns fresh state', async () => {
        // set up blocker state with count 5
        await setGoalBlockerState({ scopeDir: tempDir, goalSlug: 'goal-1' });
        await setGoalBlockerState({ scopeDir: tempDir, goalSlug: 'goal-2' });
        await setGoalBlockerState({ scopeDir: tempDir, goalSlug: 'goal-3' });
        await setGoalBlockerState({ scopeDir: tempDir, goalSlug: 'goal-4' });
        await setGoalBlockerState({ scopeDir: tempDir, goalSlug: 'goal-5' });

        const stateBefore = await getGoalBlockerState({ scopeDir: tempDir });
        expect(stateBefore.count).toEqual(5);

        // delete
        await delGoalBlockerState({ scopeDir: tempDir });

        // get should return fresh state
        const stateAfter = await getGoalBlockerState({ scopeDir: tempDir });
        expect(stateAfter.count).toEqual(0);
        expect(stateAfter.goalSlug).toBeNull();
      });
    });
  });
});
