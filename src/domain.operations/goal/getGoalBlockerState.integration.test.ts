import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getGoalBlockerState } from './getGoalBlockerState';

describe('getGoalBlockerState.integration', () => {
  given('[case1] file system read', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-getGoalBlockerState-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] .blockers.latest.json does not exist', () => {
      then('returns fresh state with count 0', async () => {
        await fs.mkdir(tempDir, { recursive: true });

        const state = await getGoalBlockerState({ scopeDir: tempDir });

        expect(state.count).toEqual(0);
        expect(state.goalSlug).toBeNull();
      });
    });

    when('[t1] .blockers.latest.json exists', () => {
      then('returns parsed state', async () => {
        await fs.mkdir(tempDir, { recursive: true });

        const statePath = path.join(tempDir, '.blockers.latest.json');
        await fs.writeFile(
          statePath,
          JSON.stringify({ count: 3, goalSlug: 'fix-auth' }),
        );

        const state = await getGoalBlockerState({ scopeDir: tempDir });

        expect(state.count).toEqual(3);
        expect(state.goalSlug).toEqual('fix-auth');
      });
    });

    when('[t2] .blockers.latest.json is malformed', () => {
      then('returns fresh state', async () => {
        await fs.mkdir(tempDir, { recursive: true });

        const statePath = path.join(tempDir, '.blockers.latest.json');
        await fs.writeFile(statePath, 'not valid json');

        const state = await getGoalBlockerState({ scopeDir: tempDir });

        expect(state.count).toEqual(0);
        expect(state.goalSlug).toBeNull();
      });
    });
  });
});
