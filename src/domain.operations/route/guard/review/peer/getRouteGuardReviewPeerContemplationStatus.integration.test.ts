import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { computeStoneReviewInputHash } from '../computeStoneReviewInputHash';
import { getRouteGuardReviewPeerContemplationStatus } from './getRouteGuardReviewPeerContemplationStatus';

/**
 * .what = builds a temp route with a stone artifact + peer given/taken files
 * .why = the orchestrator recomputes the hash deterministically, so we first
 *        learn the hash, then write files keyed to it so they pair
 */
const genRouteScene = async (input: {
  givens: { slug: string; blockers: number; nitpicks: number }[];
  takens: { slug: string; hash: 'current' | 'stale' }[];
}): Promise<{ route: string; stone: RouteStone; hashCurrent: string }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-contemplate-'));

  // a stone artifact so the hash computation has a stable input
  await fs.writeFile(path.join(route, '1.vision.yield.md'), '# vision\n');

  const stone = new RouteStone({
    name: '1.vision',
    path: path.join(route, '1.vision.stone'),
    guard: null,
  });

  // learn the current hash the orchestrator will recompute
  const hashCurrent = await computeStoneReviewInputHash({ stone, route });

  const reviewsDir = path.join(route, '.reviews', 'peer');
  await fs.mkdir(reviewsDir, { recursive: true });

  // write each given at the current hash, with its blocker/nitpick counts
  for (const g of input.givens) {
    const name = `1.vision._.review.i001.${hashCurrent}.r001._.given.by_peer.${g.slug}.md`;
    await fs.writeFile(
      path.join(reviewsDir, name),
      `${g.blockers} blockers\n${g.nitpicks} nitpicks\n`,
    );
  }

  // write each taken at either the current hash or a stale prior hash
  for (const t of input.takens) {
    const hash = t.hash === 'current' ? hashCurrent : 'stalehash0';
    const name = `1.vision._.review.i001.${hash}.r001._.taken.by_self.${t.slug}.md`;
    await fs.writeFile(path.join(reviewsDir, name), 'fixed by X\n');
  }

  return { route, stone, hashCurrent };
};

describe('getRouteGuardReviewPeerContemplationStatus', () => {
  given(
    '[case1] all-slug scope, every blocker given has a current taken',
    () => {
      const scene = useBeforeAll(async () =>
        genRouteScene({
          givens: [
            { slug: 'arch', blockers: 2, nitpicks: 1 },
            { slug: 'mech', blockers: 1, nitpicks: 0 },
          ],
          takens: [
            { slug: 'arch', hash: 'current' },
            { slug: 'mech', hash: 'current' },
          ],
        }),
      );

      when('[t0] the status is computed with no scope', () => {
        then('is ready with no uncontemplated reviewers', async () => {
          const status = await getRouteGuardReviewPeerContemplationStatus({
            route: scene.route,
            stone: scene.stone,
          });
          expect(status.ready).toBe(true);
          expect(status.uncontemplated).toEqual([]);
        });
      });
    },
  );

  given('[case2] all-slug scope, one absent + one stale', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({
        givens: [
          { slug: 'absent', blockers: 2, nitpicks: 0 },
          { slug: 'stale', blockers: 1, nitpicks: 0 },
        ],
        takens: [{ slug: 'stale', hash: 'stale' }],
      }),
    );

    when('[t0] the status is computed with no scope', () => {
      then('is not ready and tags each uncontemplated reviewer', async () => {
        const status = await getRouteGuardReviewPeerContemplationStatus({
          route: scene.route,
          stone: scene.stone,
        });
        expect(status.ready).toBe(false);
        // the entries are enriched with the given counts + both paths
        expect(status.uncontemplated).toContainEqual(
          expect.objectContaining({ slug: 'absent', tag: 'absent' }),
        );
        expect(status.uncontemplated).toContainEqual(
          expect.objectContaining({ slug: 'stale', tag: 'stale' }),
        );
      });
    });
  });

  given('[case3] single-slug scope narrows readiness to one reviewer', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({
        givens: [
          { slug: 'arch', blockers: 2, nitpicks: 0 },
          { slug: 'mech', blockers: 1, nitpicks: 0 },
        ],
        takens: [{ slug: 'arch', hash: 'current' }],
      }),
    );

    when('[t0] scoped to the answered reviewer (arch)', () => {
      then('is ready — the other reviewer is out of scope', async () => {
        const status = await getRouteGuardReviewPeerContemplationStatus({
          route: scene.route,
          stone: scene.stone,
          scope: { slug: 'arch' },
        });
        expect(status.ready).toBe(true);
      });
    });

    when('[t1] scoped to the unanswered reviewer (mech)', () => {
      then('is not ready — only that reviewer is considered', async () => {
        const status = await getRouteGuardReviewPeerContemplationStatus({
          route: scene.route,
          stone: scene.stone,
          scope: { slug: 'mech' },
        });
        expect(status.ready).toBe(false);
        expect(status.uncontemplated).toHaveLength(1);
        expect(status.uncontemplated).toContainEqual(
          expect.objectContaining({ slug: 'mech', tag: 'absent' }),
        );
      });
    });
  });

  given('[case4] a clean reviewer needs no taken', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({
        givens: [{ slug: 'arch', blockers: 0, nitpicks: 0 }],
        takens: [],
      }),
    );

    when('[t0] the status is computed', () => {
      then('is ready despite no taken (0 blockers)', async () => {
        const status = await getRouteGuardReviewPeerContemplationStatus({
          route: scene.route,
          stone: scene.stone,
        });
        expect(status.ready).toBe(true);
      });
    });
  });
});
