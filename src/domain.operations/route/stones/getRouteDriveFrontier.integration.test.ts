import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getRouteDriveFrontier } from './getRouteDriveFrontier';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

/**
 * .what = integration tests for getRouteDriveFrontier — the one-read stone-frontier snapshot
 * .why = both stepRouteDrive (next-stone pick) and getRouteDriveComplete (reminder reap gate) read
 *        this ONE snapshot; verify it composes stones + artifacts + the next-one frontier so the
 *        shared read is self-consistent (rule.prefer.most-common-denominator).
 */
describe('getRouteDriveFrontier.integration', () => {
  given('[case1] route.simple fixture — 3 stones, none passed', () => {
    const routePath = path.join(ASSETS_DIR, 'route.simple');

    when('[t0] the frontier is read', () => {
      then('it returns every stone and its artifacts', async () => {
        const frontier = await getRouteDriveFrontier({ route: routePath });
        expect(frontier.stones).toHaveLength(3);
        expect(frontier.artifacts).toHaveLength(3);
      });

      then('the next-one frontier is the first unpassed stone', async () => {
        const frontier = await getRouteDriveFrontier({ route: routePath });
        expect(frontier.nextStones).toHaveLength(1);
      });
    });
  });

  given('[case2] route.approved fixture — its stone is passed', () => {
    const routePath = path.join(ASSETS_DIR, 'route.approved');

    when('[t0] the frontier is read', () => {
      then(
        'stones are present but the next-one frontier is empty',
        async () => {
          const frontier = await getRouteDriveFrontier({ route: routePath });
          expect(frontier.stones.length).toBeGreaterThan(0);
          expect(frontier.nextStones).toHaveLength(0);
        },
      );
    });
  });
});
