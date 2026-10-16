import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getAllStoneGuardPartitionGaps } from './getAllStoneGuardPartitionGaps';
import { setRouteGuardPartitions } from './setRouteGuardPartitions';

const ROUTE = '.behavior/v2026_01_01.demo';
const STONE = '5.1.test';

/**
 * .what = a guard whose peer lanes carry the given slugs
 */
const genGuard = (input: { cwd: string; peers: string[] }) =>
  new RouteStoneGuard({
    path: path.join(input.cwd, ROUTE, `${STONE}.guard`),
    artifacts: [`${STONE}*.md`],
    reviews: {
      self: [],
      peer: input.peers.map((slug) => ({
        slug,
        run: `${slug} --rules 'x.md'`,
        budget: Infinity,
        level: 1,
      })),
    },
    judges: [],
    protect: [],
  });

/**
 * .what = a temp git repo whose branch changes files in two domains plus the route spec
 * .why = untracked files count as since-main targets, so no commit is needed
 */
const genRepoWithChanges = (input: { slug: string; files: string[] }) =>
  useBeforeAll(async () => {
    const cwd = genTempDir({ slug: input.slug, git: true });
    for (const file of input.files) {
      fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
      fs.writeFileSync(path.join(cwd, file), `// ${file}\n`, 'utf-8');
    }
    return { cwd };
  });

const FILES_CLAIMED = [
  'src/route/stones/a.ts',
  'src/review/c.ts',
  `${ROUTE}/0.wish.md`,
];
const SET_COVERS = [
  `route={src/route/*,src/route/stones/**,${ROUTE}/**}`,
  `review={src/review/**,${ROUTE}/**}`,
];

describe('getAllStoneGuardPartitionGaps', () => {
  given('[case1] a route with no partitions declared', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-gaps-none',
      files: FILES_CLAIMED,
    });

    when('[t0] the stone is checked', () => {
      then('no gap is found', async () => {
        const gaps = await getAllStoneGuardPartitionGaps({
          stone: {
            name: STONE,
            guard: genGuard({ cwd: scene.cwd, peers: ['r1'] }),
          },
          route: ROUTE,
          cwd: scene.cwd,
        });
        expect(gaps).toEqual([]);
      });
    });
  });

  given('[case2] a declared set that claims every changed file', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-gaps-covered',
      files: FILES_CLAIMED,
    });

    when('[t0] the stone is checked', () => {
      then('no gap is found', async () => {
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          partition: SET_COVERS,
        });
        const gaps = await getAllStoneGuardPartitionGaps({
          stone: {
            name: STONE,
            guard: genGuard({ cwd: scene.cwd, peers: ['r1', 'r2'] }),
          },
          route: ROUTE,
          cwd: scene.cwd,
        });
        expect(gaps).toEqual([]);
      });
    });
  });

  given('[case3] a changed file in a subdir no glob lists', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-gaps-unlisted',
      files: [...FILES_CLAIMED, 'src/route/drive/b.ts'],
    });

    when('[t0] the stone is checked', () => {
      const result = useThen('the check succeeds', async () => {
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          partition: SET_COVERS,
        });
        // wrapped in an object: the useThen proxy does not forward an array's length
        const gaps = await getAllStoneGuardPartitionGaps({
          stone: {
            name: STONE,
            guard: genGuard({ cwd: scene.cwd, peers: ['r1', 'r2'] }),
          },
          route: ROUTE,
          cwd: scene.cwd,
        });
        return { gaps };
      });

      then('one gap is found, for the @all scope, once for both lanes', () => {
        expect(result.gaps.length).toEqual(1);
        expect(result.gaps[0]!.scope).toEqual({ kind: 'all' });
        expect(result.gaps[0]!.unclaimed).toEqual(['src/route/drive/b.ts']);
      });

      then('the file is placed in the nearest partition', () => {
        expect(result.gaps[0]!.placed).toEqual([
          {
            path: 'src/route/drive/b.ts',
            slug: 'route',
            glob: 'src/route/drive/**',
          },
        ]);
      });

      then(
        'the command claims the gap into its held partition, the smallest repair',
        () => {
          expect(result.gaps[0]!.command).toContain(
            `rhx route.guard.partition --route ${ROUTE} --for review --peer @all`,
          );
          expect(result.gaps[0]!.command).toContain(
            "--claim 'src/route/drive/**' --into route",
          );
          expect(result.gaps[0]!.command).not.toContain('--partition');
          expect(result.gaps[0]!.command).not.toMatch(/[{}]/);
          expect(result.gaps[0]!.command).toContain('--mode apply');
        },
      );

      then('the command matches the snapshot', () => {
        expect(result.gaps[0]!.command).toMatchSnapshot();
      });
    });
  });

  given('[case4] an override for one peer, beside a sound @all set', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-gaps-override',
      files: FILES_CLAIMED,
    });

    when('[t0] the stone is checked', () => {
      const result = useThen('the check succeeds', async () => {
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          partition: SET_COVERS,
        });
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'peer', stone: STONE, peer: 'r2' },
          partition: [`solo={src/review/**,${ROUTE}/**}`],
        });
        // wrapped in an object: the useThen proxy does not forward an array's length
        const gaps = await getAllStoneGuardPartitionGaps({
          stone: {
            name: STONE,
            guard: genGuard({ cwd: scene.cwd, peers: ['r1', 'r2'] }),
          },
          route: ROUTE,
          cwd: scene.cwd,
        });
        return { gaps };
      });

      then('only the override scope holds a gap', () => {
        expect(result.gaps.length).toEqual(1);
        expect(result.gaps[0]!.scope).toEqual({
          kind: 'peer',
          stone: STONE,
          peer: 'r2',
        });
        expect(result.gaps[0]!.unclaimed).toEqual(['src/route/stones/a.ts']);
      });

      then('its command names that peer and stone', () => {
        expect(result.gaps[0]!.command).toContain(`--peer r2 --stone ${STONE}`);
      });

      then('the peer-scope command matches the snapshot', () => {
        expect(result.gaps[0]!.command).toMatchSnapshot();
      });
    });
  });

  given('[case5] a stone with no peer reviews', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-gaps-nopeers',
      files: [...FILES_CLAIMED, 'src/route/drive/b.ts'],
    });

    when('[t0] the stone is checked', () => {
      then(
        'no gap is found, even under a set that leaves a file out',
        async () => {
          await setRouteGuardPartitions({
            route: ROUTE,
            cwd: scene.cwd,
            scope: { kind: 'all' },
            partition: SET_COVERS,
          });
          const noPeers = await getAllStoneGuardPartitionGaps({
            stone: {
              name: STONE,
              guard: genGuard({ cwd: scene.cwd, peers: [] }),
            },
            route: ROUTE,
            cwd: scene.cwd,
          });
          const noGuard = await getAllStoneGuardPartitionGaps({
            stone: { name: STONE, guard: null },
            route: ROUTE,
            cwd: scene.cwd,
          });
          expect(noPeers).toEqual([]);
          expect(noGuard).toEqual([]);
        },
      );
    });
  });

  given(
    '[case-abs] a covered set, checked with the route given as an absolute path',
    () => {
      const scene = genRepoWithChanges({
        slug: 'partition-gaps-absolute-route',
        files: FILES_CLAIMED,
      });

      when('[t0] the stone is checked', () => {
        then(
          'no gap is found — the same verdict the relative route gets',
          async () => {
            // 🔴 before the cast, an absolute route matched no changed file as the route spec,
            //    so every partition read as one that lacks it — a false halt on a sound set
            await setRouteGuardPartitions({
              route: ROUTE,
              cwd: scene.cwd,
              scope: { kind: 'all' },
              partition: SET_COVERS,
            });
            const gaps = await getAllStoneGuardPartitionGaps({
              stone: {
                name: STONE,
                guard: genGuard({ cwd: scene.cwd, peers: ['r1', 'r2'] }),
              },
              route: path.join(scene.cwd, ROUTE),
              cwd: scene.cwd,
            });
            expect(gaps).toEqual([]);
          },
        );
      });
    },
  );
});
