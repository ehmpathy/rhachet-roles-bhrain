import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { archiveStoneSelfReviewTriggers } from './archiveStoneSelfReviewTriggers';

/**
 * .what = clamps the SELECTION this operation owns — which markers it reaches, and which
 *         it must leave alone
 * .why = the move itself belongs to `archiveRouteFiles`, which has its own clamps. what is
 *        unique here is the glob, and the glob is the part that was measurably wrong: the
 *        extant cleanup globbed `…triggered.*.md`, matched ZERO of the `.since`/`.uptil`
 *        markers, and so a rewind cleared the promise and kept the clock (13 live markers
 *        counted on one route).
 *
 * ⚠️ .note = [case1] is the bite check. narrow the glob back to `…triggered.*.md` and it goes
 *            red at `absent`/0 rather than `archived`/4 — which is exactly the state the
 *            round found in the wild, and the state no extant test could see.
 */
const genRouteWithMarkers = async (): Promise<string> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-triggers-'));
  await fs.mkdir(path.join(route, '.route'), { recursive: true });
  const write = async (name: string): Promise<void> =>
    fs.writeFile(path.join(route, '.route', name), `body of ${name}`);

  // two slugs of stone 1.vision, each with both marker kinds
  await write('1.vision.guard.selfreview.has-grounded.triggered.since');
  await write('1.vision.guard.selfreview.has-grounded.triggered.uptil');
  await write('1.vision.guard.selfreview.has-questioned.triggered.since');
  await write('1.vision.guard.selfreview.has-questioned.triggered.uptil');

  // a DIFFERENT stone's marker, which must survive
  await write('2.criteria.guard.selfreview.has-grounded.triggered.since');

  // an unrelated guard artifact of the same stone, which must also survive
  await write('1.vision.guard.promise.has-grounded.md');

  return route;
};

const isPathFound = async (at: string): Promise<boolean> =>
  fs
    .access(at)
    .then(() => true)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

describe('archiveStoneSelfReviewTriggers', () => {
  given('[case1] a stone with markers across two slugs', () => {
    const scene = useBeforeAll(async () => {
      const route = await genRouteWithMarkers();
      const outcome = await archiveStoneSelfReviewTriggers({
        stone: '1.vision',
        route,
      });
      return { route, outcome };
    });

    when('[t0] its triggers are archived', () => {
      then(
        'every marker of that stone is counted — BOTH kinds, every slug',
        () => {
          // .why = 🔴 the operand the extant cleanup got wrong. `.since` and `.uptil` carry no
          //        `.md` suffix, so a `…triggered.*.md` glob reports a clean sweep of zero
          //        files and the rewind silently keeps the clock it claimed to clear
          expect(scene.outcome).toEqual({ outcome: 'archived', count: 4 });
        },
      );

      then('each one is reachable in the archive, body intact', async () => {
        // .why = it ARCHIVES rather than deletes: the marker's mtime is the only record of
        //        when a review was asked for, and the freshness bar reads it
        for (const name of [
          '1.vision.guard.selfreview.has-grounded.triggered.since',
          '1.vision.guard.selfreview.has-grounded.triggered.uptil',
          '1.vision.guard.selfreview.has-questioned.triggered.since',
          '1.vision.guard.selfreview.has-questioned.triggered.uptil',
        ]) {
          const body = await fs.readFile(
            path.join(scene.route, '.route', '.archive', name),
            'utf-8',
          );
          expect(body).toEqual(`body of ${name}`);
        }
      });

      then('and none of them is left at its live path', async () => {
        expect(
          await isPathFound(
            path.join(
              scene.route,
              '.route',
              '1.vision.guard.selfreview.has-grounded.triggered.since',
            ),
          ),
        ).toBe(false);
      });
    });

    when('[t1] a neighbour stone shares the route', () => {
      then('its marker is untouched', async () => {
        // .why = the rewind names ONE stone. a glob loose enough to reach a peer stone
        //        would clear an ask the driver is still mid-answer on
        expect(
          await isPathFound(
            path.join(
              scene.route,
              '.route',
              '2.criteria.guard.selfreview.has-grounded.triggered.since',
            ),
          ),
        ).toBe(true);
      });
    });

    when('[t2] the same stone has other guard artifacts', () => {
      then('the promise file is untouched', async () => {
        // .why = the promise has its own owner in the rewind. for this operation to reach it
        //        would clear a checkpoint twice and double-count it in the emit
        expect(
          await isPathFound(
            path.join(
              scene.route,
              '.route',
              '1.vision.guard.promise.has-grounded.md',
            ),
          ),
        ).toBe(true);
      });
    });
  });

  given('[case2] a stone with no markers at all', () => {
    when('[t0] its triggers are archived', () => {
      then('it reports absent rather than a throw', async () => {
        // .why = a rewind runs over every affected stone, and most of them never carried a
        //        self review. an absence is the common case, never a fault
        const route = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-none-'));
        await fs.mkdir(path.join(route, '.route'), { recursive: true });

        expect(
          await archiveStoneSelfReviewTriggers({ stone: '1.vision', route }),
        ).toEqual({ outcome: 'absent', count: 0 });
      });
    });
  });
});
