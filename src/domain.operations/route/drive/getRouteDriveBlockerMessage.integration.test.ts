import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { asStableGuardEmit } from '../__test_assets__/asStableGuardEmit';
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

  // 🔴 the scene MUST be a git repo, or the snapshot below clamps no property.
  //    `asGuardDisplayPath` relativizes a printed path against the repo root; with
  //    no root to find, `getRepoRootWithFallback` falls back to `process.cwd()` and
  //    emits a `../../../../tmp/…` crawl. `asStableGuardEmit` swaps BOTH that crawl
  //    and the raw absolute route to the same `<route>` token, so the relativized
  //    output and the un-relativized output stabilize to identical bytes — the
  //    snapshot would pass whether or not the cast runs at all.
  //
  //    with a root, the cast yields a bare `.reviews/peer/…` that no swap touches,
  //    so the snapshot goes red the moment the cast is removed (r2 blocker.3, i007)
  execSync('git init', { cwd: route, stdio: 'ignore' });

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
      // .note = wrapped in an object because `useBeforeAll` holds a `Record`, and the
      //         dispatch returns a nullable. the null case is a real outcome here —
      //         [case1], [case2], and [case4] each expect it — so the nullability is
      //         asserted below rather than cast away
      const dispatch = useBeforeAll(async () => ({
        message: await getRouteDriveBlockerMessage({
          blockerReport: new RouteStoneGuardBlockerReport({
            stone: '1.vision',
            blocker: 'review.peer.uncontemplated',
            reason: null,
          }),
          stone: scene.stone,
          route: scene.route,
        }),
      }));

      then('returns the reply-prompt and blocksStop=true', async () => {
        expect(dispatch.message).not.toBeNull();
        expect(dispatch.message!.blocksStop).toBe(true);
        expect(dispatch.message!.stdout).toContain('arch');
      });

      then('matches snapshot — the held stop, as a driver reads it', () => {
        // 🔴 the three assertions above pin `blocksStop`, one slug, and non-nullness
        //    — and leave every other byte of a DRIVER-FACING surface free to regress.
        //    this is the last output a driver receives before a stop is held, so
        //    `rule.require.contract-snapshot-exhaustiveness` binds it as surely as
        //    any cli stdout: a reword of the guidance, a dropped branch, or a path
        //    rendered in the wrong form would all ship unseen behind
        //    `toContain('arch')` (r2 blocker.3, i007).
        //
        // .note = what this pins that the shared formatter's own snapshot cannot is
        //         the ASSEMBLY — that this dispatch reaches the `reply-prompt` case
        //         at all, with the repo root it resolved and the reviewer set that
        //         `getStoneGuardReviewPeerUncontemplatedUnforgiven` handed back
        expect(
          asStableGuardEmit({
            emit: dispatch.message!.stdout,
            route: scene.route,
          }),
        ).toMatchSnapshot('stophook - held stop, reply owed');
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
