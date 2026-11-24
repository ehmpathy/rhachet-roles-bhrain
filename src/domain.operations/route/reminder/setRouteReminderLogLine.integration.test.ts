import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { setRouteReminderLogLine } from './setRouteReminderLogLine';

/**
 * .what = integration cases for the clone log append
 * .why = the clone log is the watched surface for faults and reaps. each line must land, in order,
 *        in a dir that ignores itself — on a repo root whose handle dir does not exist yet
 */
describe('setRouteReminderLogLine.integration', () => {
  given('[case1] a repo root with no handle dir yet', () => {
    when('[t0] two lines are set', () => {
      then('the log holds both, in order, in a self-ignored dir', async () => {
        const repoRoot = await fs.mkdtemp(
          path.join(os.tmpdir(), 'reminder-log-line-'),
        );
        const clone = { repoRoot, cloneAddr: '@:driver-1' };
        await setRouteReminderLogLine({ ...clone, line: 'first' });
        await setRouteReminderLogLine({ ...clone, line: 'second' });

        const logPath = getRouteReminderLogPath(clone);
        expect(await fs.readFile(logPath, 'utf-8')).toEqual('first\nsecond\n');
        expect(
          await fs.readFile(
            path.join(path.dirname(logPath), '.gitignore'),
            'utf-8',
          ),
        ).toEqual('*\n');
      });
    });
  });
});
