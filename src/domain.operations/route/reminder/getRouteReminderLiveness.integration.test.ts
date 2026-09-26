import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { genRouteWithPassage } from '../.test/genRouteWithPassage';
import { getRouteReminderLiveness } from './getRouteReminderLiveness';

/**
 * .what = integration cases for getRouteReminderLiveness
 * .why = this read is the daemon's whole exit decision — it crosses the fs boundary to the
 *        real passage.jsonl, so it must be proven against real files, not a mock.
 */
describe('getRouteReminderLiveness.integration', () => {
  given('[case1] no passage file exists', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'reminder-none-'));
      return { route };
    });

    when('[t0] liveness is read', () => {
      then('reminder is not live — no active drive to nudge', async () => {
        const result = await getRouteReminderLiveness({ route: scene.route });
        expect(result).toEqual({ live: false, status: null });
      });
    });
  });

  given('[case2] latest write is an active self-drive (passed)', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '1.vision', status: 'blocked' },
          { stone: '1.vision', status: 'approved' },
          { stone: '1.vision', status: 'passed' },
        ],
      }),
    );

    when('[t0] liveness is read', () => {
      then('reminder is live — the drive advances', async () => {
        const result = await getRouteReminderLiveness({ route: scene.route });
        expect(result).toEqual({ live: true, status: 'passed' });
      });
    });
  });

  given('[case3] latest write is a hard wall (blocked)', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'arrived' },
          { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
        ],
      }),
    );

    when('[t0] liveness is read', () => {
      then('reminder is absent — the daemon exits', async () => {
        const result = await getRouteReminderLiveness({ route: scene.route });
        expect(result).toEqual({ live: false, status: 'blocked' });
      });
    });
  });

  // the threaded-snapshot clamp (r11 arch #1): stepRouteDrive reads passage.jsonl ONCE per hook and
  // threads that snapshot, so the reminder must NOT do a second independent read. these two cases
  // seed a disk tail that DISAGREES with the threaded `latest`, and assert the result follows the
  // THREADED value — proof the disk was not re-read. RED if the code ignored `latest` and read disk.
  given('[case5] a threaded active `latest` over a blocked disk tail', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'blocked' }],
      }),
    );

    when('[t0] liveness is read with an active snapshot threaded', () => {
      then(
        'it follows the threaded snapshot (live), not the disk',
        async () => {
          const latest: PassageReport = {
            stone: '5.1.execution',
            status: 'passed',
          };
          const result = await getRouteReminderLiveness({
            route: scene.route,
            latest,
          });
          // the disk tail is `blocked` (not live); the threaded `passed` wins → live
          expect(result).toEqual({ live: true, status: 'passed' });
        },
      );
    });
  });

  given('[case6] a threaded `null` over an active disk tail', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '1.vision', status: 'passed' }],
      }),
    );

    when('[t0] liveness is read with an explicit null threaded', () => {
      then(
        'it honors the null (not live), never re-reads the disk',
        async () => {
          const result = await getRouteReminderLiveness({
            route: scene.route,
            latest: null,
          });
          // the disk tail is `passed` (live); the explicit null wins → not live, no disk read
          expect(result).toEqual({ live: false, status: null });
        },
      );
    });
  });

  given('[case4] a later active write supersedes an earlier block', () => {
    // last-write-wins: a re-drive after a block clears the reminder-absent state
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'blocked' },
          { stone: '5.1.execution', status: 'arrived' },
        ],
      }),
    );

    when('[t0] liveness is read', () => {
      then('reminder is live again — the latest write is active', async () => {
        const result = await getRouteReminderLiveness({ route: scene.route });
        expect(result).toEqual({ live: true, status: 'arrived' });
      });
    });
  });
});
