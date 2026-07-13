import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { computeStoneReviewInputHash } from '../guard/review/computeStoneReviewInputHash';
import { getRouteDriveBlockerMessage } from './getRouteDriveBlockerMessage';

/**
 * .what = builds a temp route with a stone artifact + peer given/taken files
 * .why = the uncontemplated dispatch recomputes the hash live, so we learn the
 *        hash first, then write files keyed to it so they pair
 */
const genRouteScene = async (input: {
  givens: { slug: string; blockers: number; nitpicks: number }[];
  takens: { slug: string }[];
}): Promise<{ route: string; stone: RouteStone }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-blocker-msg-'));

  await fs.writeFile(path.join(route, '1.vision.yield.md'), '# vision\n');

  const stone = new RouteStone({
    name: '1.vision',
    path: path.join(route, '1.vision.stone'),
    guard: null,
  });

  const hashCurrent = await computeStoneReviewInputHash({ stone, route });

  const reviewsDir = path.join(route, '.reviews', 'peer');
  await fs.mkdir(reviewsDir, { recursive: true });

  for (const g of input.givens) {
    const name = `1.vision._.review.i001.${hashCurrent}.r001._.given.by_peer.${g.slug}.md`;
    await fs.writeFile(
      path.join(reviewsDir, name),
      `${g.blockers} blockers\n${g.nitpicks} nitpicks\n`,
    );
  }

  for (const t of input.takens) {
    const name = `1.vision._.review.i001.${hashCurrent}.r001._.taken.by_self.${t.slug}.md`;
    await fs.writeFile(path.join(reviewsDir, name), 'fixed by X\n');
  }

  return { route, stone };
};

describe('getRouteDriveBlockerMessage', () => {
  given('[case1] no blocker report', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({ givens: [], takens: [] }),
    );

    when('[t0] the dispatcher runs with a null report', () => {
      then('returns null — caller shows generic guidance', async () => {
        const message = await getRouteDriveBlockerMessage({
          blockerReport: null,
          stone: scene.stone,
          route: scene.route,
        });
        expect(message).toBeNull();
      });
    });
  });

  given('[case2] a non-dispatchable blocker (judge)', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({ givens: [], takens: [] }),
    );

    when('[t0] the dispatcher runs with a judge blocker', () => {
      then('returns null — judge is handled elsewhere', async () => {
        const message = await getRouteDriveBlockerMessage({
          blockerReport: new RouteStoneGuardBlockerReport({
            stone: '1.vision',
            blocker: 'judge',
            reason: null,
          }),
          stone: scene.stone,
          route: scene.route,
        });
        expect(message).toBeNull();
      });
    });
  });

  given('[case3] uncontemplated with an absent taken', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({
        givens: [{ slug: 'arch', blockers: 2, nitpicks: 1 }],
        takens: [],
      }),
    );

    when('[t0] the dispatcher runs with the uncontemplated blocker', () => {
      then('returns the reply-prompt and blocksStop=true', async () => {
        const message = await getRouteDriveBlockerMessage({
          blockerReport: new RouteStoneGuardBlockerReport({
            stone: '1.vision',
            blocker: 'review.peer.uncontemplated',
            reason: null,
          }),
          stone: scene.stone,
          route: scene.route,
        });
        expect(message).not.toBeNull();
        expect(message!.blocksStop).toBe(true);
        expect(message!.stdout).toContain('arch');
      });
    });
  });

  given(
    '[case4] uncontemplated but the driver has since written the taken',
    () => {
      const scene = useBeforeAll(async () =>
        genRouteScene({
          givens: [{ slug: 'arch', blockers: 2, nitpicks: 1 }],
          takens: [{ slug: 'arch' }],
        }),
      );

      when('[t0] the dispatcher recomputes live', () => {
        then('returns null — the blocker is stale (satisfied)', async () => {
          const message = await getRouteDriveBlockerMessage({
            blockerReport: new RouteStoneGuardBlockerReport({
              stone: '1.vision',
              blocker: 'review.peer.uncontemplated',
              reason: null,
            }),
            stone: scene.stone,
            route: scene.route,
          });
          expect(message).toBeNull();
        });
      });
    },
  );
});
