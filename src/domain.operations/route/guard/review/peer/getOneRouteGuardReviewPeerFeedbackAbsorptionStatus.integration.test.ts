import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { computeStoneReviewInputHash } from '../computeStoneReviewInputHash';
import { getOneRouteGuardReviewPeerFeedbackAbsorptionStatus } from './getOneRouteGuardReviewPeerFeedbackAbsorptionStatus';

/**
 * .what = builds a temp route with a stone artifact + peer given/taken files
 * .why = the orchestrator recomputes the hash deterministically, so we first
 *        learn the hash, then write files keyed to it so they pair
 */
const genRouteScene = async (input: {
  givens: { slug: string; blockers: number; nitpicks: number }[];
  takens: { slug: string; hash: 'current' | 'stale' }[];
}): Promise<{ route: string; stone: RouteStone; hashCurrent: string }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-absorb-'));

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

describe('getOneRouteGuardReviewPeerFeedbackAbsorptionStatus', () => {
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
        const read = useThen('the status is computed', async () => ({
          status: await getOneRouteGuardReviewPeerFeedbackAbsorptionStatus({
            route: scene.route,
            stone: scene.stone,
          }),
        }));

        then('is ready with no feedbackUnabsorbed reviewers', () => {
          expect(read.status.ready).toBe(true);
          expect(read.status.feedbackUnabsorbed).toEqual([]);
        });

        then('an unscoped read carries no scoped ready reason', () => {
          expect(read.status.readyReason).toBeUndefined();
          expect(read.status.readyPathTaken).toBeUndefined();
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
      then(
        'is not ready and tags each feedbackUnabsorbed reviewer',
        async () => {
          const status =
            await getOneRouteGuardReviewPeerFeedbackAbsorptionStatus({
              route: scene.route,
              stone: scene.stone,
            });
          expect(status.ready).toBe(false);
          // the entries are enriched with the given counts + both paths
          expect(status.feedbackUnabsorbed).toContainEqual(
            expect.objectContaining({ slug: 'absent', tag: 'absent' }),
          );
          expect(status.feedbackUnabsorbed).toContainEqual(
            expect.objectContaining({ slug: 'stale', tag: 'stale' }),
          );
        },
      );
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
      const read = useThen('the status is computed', async () => ({
        status: await getOneRouteGuardReviewPeerFeedbackAbsorptionStatus({
          route: scene.route,
          stone: scene.stone,
          scope: { slug: 'arch' },
        }),
      }));

      then('is ready — the other reviewer is out of scope', () => {
        expect(read.status.ready).toBe(true);
      });

      then(
        'it says why the scoped reviewer is ready, and where its answer sits',
        () => {
          // clamps the one scoped-readiness helper both fields now share (r006
          // nitpick.3, i013): set only when the read is scoped AND ready
          expect(read.status.readyReason).toEqual('responded');
          expect(read.status.readyPathTaken).toContain(
            `._.taken.by_self.arch.md`,
          );
        },
      );
    });

    when('[t1] scoped to the unanswered reviewer (mech)', () => {
      const read = useThen('the status is computed', async () => ({
        status: await getOneRouteGuardReviewPeerFeedbackAbsorptionStatus({
          route: scene.route,
          stone: scene.stone,
          scope: { slug: 'mech' },
        }),
      }));

      then('neither the ready reason nor the taken path is set', () => {
        expect(read.status.readyReason).toBeUndefined();
        expect(read.status.readyPathTaken).toBeUndefined();
      });

      then('is not ready — only that reviewer is considered', () => {
        const status = read.status;
        expect(status.ready).toBe(false);
        expect(status.feedbackUnabsorbed).toHaveLength(1);
        expect(status.feedbackUnabsorbed).toContainEqual(
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
        const status = await getOneRouteGuardReviewPeerFeedbackAbsorptionStatus(
          {
            route: scene.route,
            stone: scene.stone,
          },
        );
        expect(status.ready).toBe(true);
      });
    });
  });
});
