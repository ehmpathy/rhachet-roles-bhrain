import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asRouteGuardPartitionCoverageLines } from './asRouteGuardPartitionCoverageLines';
import { getAllStoneGuardPartitionCoverage } from './getAllStoneGuardPartitionCoverage';
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
 * .what = a temp git repo whose branch changes the given files
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

/**
 * .what = the bytes of the route's partition declaration, or null when absent
 * .why = a read must leave the declaration exactly as it found it
 */
const getDeclarationBytes = (input: { cwd: string }): string | null => {
  const file = path.join(input.cwd, ROUTE, '.route', 'partitions.json');
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf-8');
};

const SET_WITH_REST = [
  `route={src/route/**,${ROUTE}/**}`,
  `rest={src/**,${ROUTE}/**}`,
];

describe('getAllStoneGuardPartitionCoverage', () => {
  given('[case1] an @all set whose rest partition catches a new dir', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-coverage-rest',
      files: ['src/route/a.ts', 'src/newdir/b.ts', `${ROUTE}/0.wish.md`],
    });

    when('[t0] the stone coverage is read', () => {
      const result = useThen('the read succeeds', async () => {
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          partition: SET_WITH_REST,
        });
        const before = getDeclarationBytes({ cwd: scene.cwd });
        const stone = {
          name: STONE,
          guard: genGuard({ cwd: scene.cwd, peers: ['r1', 'r2'] }),
        };
        const coverages = await getAllStoneGuardPartitionCoverage({
          stone,
          route: ROUTE,
          cwd: scene.cwd,
        });
        const gaps = await getAllStoneGuardPartitionGaps({
          stone,
          route: ROUTE,
          cwd: scene.cwd,
        });
        const after = getDeclarationBytes({ cwd: scene.cwd });
        return { coverages, gaps, before, after };
      });

      then('one scope is read, by both reviewers', () => {
        expect(result.coverages.length).toEqual(1);
        expect(result.coverages[0]!.scope).toEqual({ kind: 'all' });
        expect(result.coverages[0]!.peers).toEqual(['r1', 'r2']);
      });

      then(
        'a partition named rest claims its files as any partition does',
        () => {
          const rest = result.coverages[0]!.split.partitions.find(
            (partition) => partition.name === 'rest',
          );
          expect(rest?.narrow).toEqual(['src/newdir/b.ts']);
        },
      );

      then('there is no gap, and the gate computation agrees', () => {
        expect(result.coverages[0]!.gap).toEqual(null);
        expect(result.gaps).toEqual([]);
      });

      then('the read wrote naught', () => {
        expect(result.after).toEqual(result.before);
      });

      then('the rendered coverage matches the snapshot', () => {
        expect(
          asRouteGuardPartitionCoverageLines({
            route: ROUTE,
            stone: STONE,
            coverages: result.coverages,
            full: false,
          }).join('\n'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2] an override that leaves a changed file unclaimed', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-coverage-gap',
      files: ['src/route/a.ts', 'src/review/c.ts', `${ROUTE}/0.wish.md`],
    });

    when('[t0] the stone coverage is read', () => {
      const result = useThen('the read succeeds', async () => {
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          partition: SET_WITH_REST,
        });
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'peer', stone: STONE, peer: 'r2' },
          partition: [`solo={src/review/**,${ROUTE}/**}`],
        });
        const stone = {
          name: STONE,
          guard: genGuard({ cwd: scene.cwd, peers: ['r1', 'r2'] }),
        };
        const coverages = await getAllStoneGuardPartitionCoverage({
          stone,
          route: ROUTE,
          cwd: scene.cwd,
        });
        const gaps = await getAllStoneGuardPartitionGaps({
          stone,
          route: ROUTE,
          cwd: scene.cwd,
        });
        return { coverages, gaps };
      });

      then('each scope names the reviewers that read it', () => {
        expect(result.coverages.map((c) => c.peers)).toEqual([['r1'], ['r2']]);
      });

      then(
        'the override scope holds the gap, the same gap the gate sees',
        () => {
          const gapsOfCoverage = result.coverages
            .map((c) => c.gap)
            .filter((gap) => gap !== null);
          expect(gapsOfCoverage).toEqual(result.gaps);
          expect(result.gaps[0]!.unclaimed).toEqual(['src/route/a.ts']);
        },
      );
    });
  });

  given('[case3] a stone whose reviewers read no partition set', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-coverage-none',
      files: ['src/route/a.ts', `${ROUTE}/0.wish.md`],
    });

    when('[t0] the stone coverage is read', () => {
      then('no scope is read, and naught is written', async () => {
        const coverages = await getAllStoneGuardPartitionCoverage({
          stone: {
            name: STONE,
            guard: genGuard({ cwd: scene.cwd, peers: ['r1'] }),
          },
          route: ROUTE,
          cwd: scene.cwd,
        });
        expect(coverages).toEqual([]);
        expect(getDeclarationBytes({ cwd: scene.cwd })).toEqual(null);
      });
    });
  });
});
