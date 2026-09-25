import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genRouteWithPassage } from '@src/domain.operations/route/.test/genRouteWithPassage';

import { getLatestPassageForRoute } from './getLatestPassageForRoute';

/**
 * .what = integration cases for getLatestPassageForRoute
 * .why = this op names the vision's `tail -1 passage.jsonl` — the drive's current state that
 *        the RouteReminder daemon reads each tick. it MUST return the true chronological last
 *        line (raw file order) across ALL stones, so the reminder's exit decision reads the
 *        real latest write, never a re-bucketed order.
 */

describe('getLatestPassageForRoute.integration', () => {
  given('[case1] no passage file exists', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(
        path.join(os.tmpdir(), 'latest-route-none-'),
      );
      return { route };
    });

    when('[t0] the latest passage is read', () => {
      then('returns null (no active drive)', async () => {
        expect(
          await getLatestPassageForRoute({ route: scene.route }),
        ).toBeNull();
      });
    });
  });

  given(
    '[case2] several stones interleaved, last line is a later stone',
    () => {
      // the route advanced 1.vision → 2.plan; the true tail is 2.plan's blocked
      const scene = useBeforeAll(async () =>
        genRouteWithPassage({
          lines: [
            { stone: '1.vision', status: 'blocked' },
            { stone: '1.vision', status: 'passed' },
            { stone: '2.plan', status: 'arrived' },
            { stone: '2.plan', status: 'blocked', blocker: 'approval' },
          ],
        }),
      );

      when('[t0] the latest passage is read', () => {
        then(
          'returns the last line in file order (2.plan blocked)',
          async () => {
            const latest = await getLatestPassageForRoute({
              route: scene.route,
            });
            expect(latest?.stone).toEqual('2.plan');
            expect(latest?.status).toEqual('blocked');
          },
        );
      });
    },
  );
});
