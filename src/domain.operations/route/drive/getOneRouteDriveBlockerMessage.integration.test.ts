import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';
import { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { asStableGuardEmit } from '../__test_assets__/asStableGuardEmit';
import { setRouteGuardPartitions } from '../guard/partition/setRouteGuardPartitions';
import { computeStoneReviewInputHash } from '../guard/review/computeStoneReviewInputHash';
import { getOneRouteDriveBlockerMessage } from './getOneRouteDriveBlockerMessage';

/**
 * .what = builds a temp route with a stone artifact + peer given/taken files
 * .why = the feedbackUnabsorbed dispatch recomputes the hash live, so we learn the
 *        hash first, then write files keyed to it so they pair
 */
const genRouteScene = async (input: {
  givens: { slug: string; blockers: number; nitpicks: number }[];
  takens: { slug: string }[];
}): Promise<{ route: string; stone: RouteStone }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-blocker-msg-'));

  // 🔴 the scene MUST be a git repo, or the snapshot below clamps no property.
  //    `asGuardDisplayPath` relativizes a printed path against the repo root; with no
  //    root to find, `getRepoRootWithFallback` falls back to `process.cwd()` and emits
  //    a `../../../../tmp/…` crawl. `asStableGuardEmit` swaps BOTH that crawl and the
  //    raw absolute route to the same `<route>` token, so a relativized and an
  //    un-relativized output would stabilize to identical bytes and the snapshot
  //    would pass either way. with a root, the cast yields a bare `.reviews/peer/…`
  //    that no swap touches, so the snapshot goes red the moment the cast is removed.
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

const PARTITION_ROUTE = '.behavior/v2026_01_01.demo';
const PARTITION_STONE = '5.1.test';
const FILES_PARTITIONED = [
  'src/route/stones/a.ts',
  'src/review/c.ts',
  `${PARTITION_ROUTE}/0.wish.md`,
];

/**
 * .what = a temp git repo whose route declares a partition set, and a guarded stone with two
 *         peer lanes
 * .why = the malpartitioned dispatch recomputes the gaps live against the branch, so the
 *        scene must hold real changed files and a real declaration
 */
const genPartitionScene = async (input: {
  slug: string;
  files: string[];
}): Promise<{ cwd: string; route: string; stone: RouteStone }> => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  for (const file of input.files) {
    await fs.mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
    await fs.writeFile(path.join(cwd, file), `// ${file}\n`, 'utf-8');
  }
  await setRouteGuardPartitions({
    route: PARTITION_ROUTE,
    cwd,
    scope: { kind: 'all' },
    partition: [
      `route={src/route/stones/**,${PARTITION_ROUTE}/**}`,
      `review={src/review/**,${PARTITION_ROUTE}/**}`,
    ],
  });
  const route = path.join(cwd, PARTITION_ROUTE);
  const stone = new RouteStone({
    name: PARTITION_STONE,
    path: path.join(route, `${PARTITION_STONE}.stone`),
    guard: new RouteStoneGuard({
      path: path.join(route, `${PARTITION_STONE}.guard`),
      artifacts: [`${PARTITION_STONE}*.md`],
      reviews: {
        self: [],
        peer: ['r1', 'r2'].map((slug) => ({
          slug,
          run: `${slug} --rules 'x.md'`,
          budget: Infinity,
          level: 1,
        })),
      },
      judges: [],
      protect: [],
    }),
  });
  return { cwd, route, stone };
};

describe('getOneRouteDriveBlockerMessage', () => {
  given('[case1] no blocker report', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({ givens: [], takens: [] }),
    );

    when('[t0] the dispatcher runs with a null report', () => {
      then('returns null — caller shows generic guidance', async () => {
        const message = await getOneRouteDriveBlockerMessage({
          blockerReport: null,
          stone: scene.stone,
          route: scene.route,
          brain: null,
          effort: null,
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
        const message = await getOneRouteDriveBlockerMessage({
          blockerReport: new RouteStoneGuardBlockerReport({
            stone: '1.vision',
            blocker: 'judge',
            reason: null,
          }),
          stone: scene.stone,
          route: scene.route,
          brain: null,
          effort: null,
        });
        expect(message).toBeNull();
      });
    });
  });

  given('[case3] feedbackUnabsorbed with an absent taken', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({
        givens: [{ slug: 'arch', blockers: 2, nitpicks: 1 }],
        takens: [],
      }),
    );

    when('[t0] the dispatcher runs with the feedbackUnabsorbed blocker', () => {
      // .note = wrapped in an object because `useBeforeAll` holds a `Record`, and the
      //         dispatch returns a nullable. the null case is a real outcome here —
      //         [case1], [case2], and [case4] each expect it — so the nullability is
      //         asserted below rather than cast away
      const dispatch = useBeforeAll(async () => ({
        message: await getOneRouteDriveBlockerMessage({
          blockerReport: new RouteStoneGuardBlockerReport({
            stone: '1.vision',
            blocker: 'review.peer.unabsorbed',
            reason: null,
          }),
          stone: scene.stone,
          route: scene.route,
          brain: null,
          effort: null,
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
        //    any cli stdout: a reword of the guidance, a dropped branch, or a
        //    wrong-form path would all ship unseen behind `toContain('arch')`.
        //
        // .note = what this pins that the shared formatter's own snapshot cannot is
        //         the ASSEMBLY — that this dispatch reaches the `reply-prompt` case
        //         at all, with the repo root it resolved and the reviewer set that
        //         `getAllStoneGuardReviewPeerFeedbackUnabsorbedUnforgiven` handed back
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
    '[case4] feedbackUnabsorbed but the driver has since written the taken',
    () => {
      const scene = useBeforeAll(async () =>
        genRouteScene({
          givens: [{ slug: 'arch', blockers: 2, nitpicks: 1 }],
          takens: [{ slug: 'arch' }],
        }),
      );

      when('[t0] the dispatcher recomputes live', () => {
        then('returns null — the blocker is stale (satisfied)', async () => {
          const message = await getOneRouteDriveBlockerMessage({
            blockerReport: new RouteStoneGuardBlockerReport({
              stone: '1.vision',
              blocker: 'review.peer.unabsorbed',
              reason: null,
            }),
            stone: scene.stone,
            route: scene.route,
            brain: null,
            effort: null,
          });
          expect(message).toBeNull();
        });
      });
    },
  );

  given(
    '[case5] malpartitioned, and a changed file still sits in no partition',
    () => {
      const scene = useBeforeAll(async () =>
        genPartitionScene({
          slug: 'drive-blocker-malpartitioned',
          files: [...FILES_PARTITIONED, 'src/route/drive/b.ts'],
        }),
      );

      when('[t0] the dispatcher runs with the malpartitioned blocker', () => {
        const dispatch = useBeforeAll(async () => ({
          message: await getOneRouteDriveBlockerMessage({
            blockerReport: new RouteStoneGuardBlockerReport({
              stone: PARTITION_STONE,
              blocker: 'review.peer.malpartitioned',
              reason: null,
            }),
            stone: scene.stone,
            route: scene.route,
            brain: null,
            effort: null,
          }),
        }));

        then(
          'the replay shows the gap and its repair, and holds the stop',
          () => {
            // 🔴 before this branch the dispatcher returned null here, so every drive surface
            //    after the entrance gate showed generic stone guidance — the halt and its
            //    one-command remedy were hidden from the driver who met the stone next
            expect(dispatch.message).not.toBeNull();
            expect(dispatch.message!.blocksStop).toBe(true);
            expect(dispatch.message!.stdout).toContain('src/route/drive/b.ts');
            expect(dispatch.message!.stdout).toContain(
              'rhx route.guard.partition',
            );
          },
        );

        then('the bytes a driver reads are pinned', () => {
          expect(
            dispatch.message!.stdout.split(scene.cwd).join('<cwd>'),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case6] malpartitioned, but the driver has since repaired the set',
    () => {
      const scene = useBeforeAll(async () =>
        genPartitionScene({
          slug: 'drive-blocker-repartitioned',
          files: FILES_PARTITIONED,
        }),
      );

      when('[t0] the dispatcher recomputes live', () => {
        then('returns null — the blocker is stale (repaired)', async () => {
          const message = await getOneRouteDriveBlockerMessage({
            blockerReport: new RouteStoneGuardBlockerReport({
              stone: PARTITION_STONE,
              blocker: 'review.peer.malpartitioned',
              reason: null,
            }),
            stone: scene.stone,
            route: scene.route,
            brain: null,
            effort: null,
          });
          expect(message).toBeNull();
        });
      });
    },
  );
});
