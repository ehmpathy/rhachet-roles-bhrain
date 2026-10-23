import { given, then, when } from 'test-fns';

import { asReviewPartitionsFromFlags } from '@src/domain.operations/review/partition/asReviewPartitionsFromFlags';
import { getAllTargetsByPartition } from '@src/domain.operations/review/partition/getAllTargetsByPartition';

import { asRouteGuardPartitionRepair } from './asRouteGuardPartitionRepair';

const ROUTE = '.behavior/v2026_01_01.demo';

/**
 * .what = the split a repaired set yields over the same targets
 * .why = the repair's contract is that it claims each file it was given, through the one
 *        split every lane runs — so the test reads it back through that split
 */
const asSplitOf = (input: { partition: string[]; targets: string[] }) =>
  getAllTargetsByPartition({
    targets: input.targets,
    partitions: asReviewPartitionsFromFlags({ partition: input.partition }),
    route: ROUTE,
  });

describe('asRouteGuardPartitionRepair', () => {
  given(
    '[case1] a file in a subdir no glob lists, under a declared root',
    () => {
      const partition = [
        `route=src/route/*,src/route/judges/**,src/route/stones/**,${ROUTE}/**`,
        `review=src/review/**,${ROUTE}/**`,
      ];
      const targets = [
        'src/route/stones/a.ts',
        'src/route/drive/getBlocker.ts',
        'src/review/b.ts',
        `${ROUTE}/0.wish.md`,
      ];

      when('[t0] the set is repaired', () => {
        const repair = asRouteGuardPartitionRepair({
          partition,
          unclaimed: ['src/route/drive/getBlocker.ts'],
          routeAbsentFrom: [],
          route: ROUTE,
          scope: { kind: 'all' },
        });

        then('the file joins the partition whose root contains it', () => {
          expect(repair.placed).toEqual([
            {
              path: 'src/route/drive/getBlocker.ts',
              slug: 'route',
              glob: 'src/route/drive/**',
            },
          ]);
        });

        then('the repaired set leaves no target unclaimed', () => {
          const split = asSplitOf({ partition: repair.partition, targets });
          expect(split.unclaimed).toEqual([]);
          expect(split.routeAbsentFrom).toEqual([]);
        });

        then('the declared set is red before the repair', () => {
          const split = asSplitOf({ partition, targets });
          expect(split.unclaimed).toEqual(['src/route/drive/getBlocker.ts']);
        });

        then('the command matches the snapshot', () => {
          expect(repair.command).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] a file under no declared root', () => {
    const partition = [`review=src/review/**,${ROUTE}/**`];
    const targets = ['src/review/b.ts', 'package.json', 'docs/x/y.md'];

    when('[t0] the set is repaired', () => {
      const repair = asRouteGuardPartitionRepair({
        partition,
        unclaimed: ['package.json', 'docs/x/y.md'],
        routeAbsentFrom: [],
        route: ROUTE,
        scope: { kind: 'all' },
      });

      then(
        '🔴 each file joins a new named domain partition, never rest',
        () => {
          expect(repair.partition[0]).toEqual(
            `review=src/review/**,${ROUTE}/**`,
          );
          expect(repair.partition).toContain(`config=package.json,${ROUTE}/**`);
          expect(repair.partition.join('\n')).not.toMatch(/^rest=/m);
        },
      );

      then('a new partition owes the whole set, declared', () => {
        expect(repair.form).toEqual('declare');
        expect(repair.command).not.toMatch(/[{}]/);
      });

      then('the repaired set leaves no target unclaimed', () => {
        const split = asSplitOf({ partition: repair.partition, targets });
        expect(split.unclaimed).toEqual([]);
        expect(split.routeAbsentFrom).toEqual([]);
      });

      then('the new-domain command matches the snapshot', () => {
        expect(repair.command).toMatchSnapshot();
      });
    });
  });

  given('[case3] a partition that lacks the route spec', () => {
    const partition = [
      `review=src/review/**,${ROUTE}/**`,
      'meter=src/meter/**',
    ];
    const targets = ['src/review/b.ts', 'src/meter/c.ts'];

    when('[t0] the set is repaired', () => {
      const repair = asRouteGuardPartitionRepair({
        partition,
        unclaimed: [],
        routeAbsentFrom: ['meter'],
        route: ROUTE,
        scope: { kind: 'all' },
      });

      then('that partition gains the route spec', () => {
        expect(repair.partition).toEqual([
          `review=src/review/**,${ROUTE}/**`,
          `meter=src/meter/**,${ROUTE}/**`,
        ]);
      });

      then('the repaired set holds the route in every partition', () => {
        const split = asSplitOf({ partition: repair.partition, targets });
        expect(split.routeAbsentFrom).toEqual([]);
      });

      then('the route-spec repair command matches the snapshot', () => {
        expect(repair.command).toContain(`--claim '${ROUTE}/**' --into meter`);
        expect(repair.command).toMatchSnapshot();
      });
    });
  });

  given('[case4] an override scope for one reviewer', () => {
    when('[t0] the set is repaired', () => {
      const repair = asRouteGuardPartitionRepair({
        partition: [`review=src/review/**,${ROUTE}/**`],
        unclaimed: ['src/review/deep/x.ts'],
        routeAbsentFrom: [],
        route: ROUTE,
        scope: { kind: 'peer', stone: '5.1.execution', peer: 'mech-rules' },
      });

      then('the command names that reviewer and stone', () => {
        expect(repair.command).toContain(
          '--peer mech-rules --stone 5.1.execution',
        );
      });

      then('the peer-scope command matches the snapshot', () => {
        expect(repair.command).toMatchSnapshot();
      });
    });
  });

  given('[case5] a gap one held partition fits', () => {
    const partition = [
      `route=src/route/*,src/route/judges/**,${ROUTE}/**`,
      `review=src/review/**,${ROUTE}/**`,
      'meter=src/meter/**',
    ];

    when('[t0] the set is repaired', () => {
      const repair = asRouteGuardPartitionRepair({
        partition,
        unclaimed: ['src/route/drive/getBlocker.ts'],
        routeAbsentFrom: ['meter'],
        route: ROUTE,
        scope: { kind: 'all' },
      });

      then(
        '🔴 the command claims into each partition, one line per partition',
        () => {
          expect(repair.command).toContain(
            "--claim 'src/route/drive/**' --into route",
          );
          expect(repair.command).toContain(
            `--claim '${ROUTE}/**' --into meter`,
          );
        },
      );

      then('🔴 the command never re-declares the whole set', () => {
        expect(repair.command).not.toContain('--partition');
        expect(repair.command).not.toContain('review=');
      });

      then('🔴 the command carries no brace', () => {
        expect(repair.command).not.toMatch(/[{}]/);
      });

      then('the claim command matches the snapshot', () => {
        expect(repair.command).toMatchSnapshot();
      });
    });
  });

  given(
    '[case6] a held set with a catch-all `rest`, and files no domain claims',
    () => {
      const partition = [
        `review=src/review/**,${ROUTE}/**`,
        `rest=docs/**,${ROUTE}/**`,
      ];
      const unclaimed = [
        '.agent/repo=.this/role=any/boot.yml',
        'biome.jsonc',
        'src/contract/cli/route.ts',
      ];
      const targets = ['src/review/b.ts', 'docs/x.md', ...unclaimed];

      when('[t0] the set is repaired', () => {
        const repair = asRouteGuardPartitionRepair({
          partition,
          unclaimed,
          routeAbsentFrom: [],
          route: ROUTE,
          scope: { kind: 'all' },
        });

        then('🔴 no file is placed into `rest`', () => {
          expect(repair.placed.map((item) => item.slug)).not.toContain('rest');
          expect(repair.command).not.toContain('--into rest');
        });

        then(
          '🔴 each file lands in a named domain derived from its path',
          () => {
            expect(repair.placed).toEqual([
              {
                path: '.agent/repo=.this/role=any/boot.yml',
                slug: 'agent',
                glob: '.agent/**',
              },
              { path: 'biome.jsonc', slug: 'config', glob: 'biome.jsonc' },
              {
                path: 'src/contract/cli/route.ts',
                slug: 'contract-cli',
                glob: 'src/contract/cli/**',
              },
            ]);
          },
        );

        then('the repaired set leaves no target unclaimed', () => {
          const split = asSplitOf({ partition: repair.partition, targets });
          expect(split.unclaimed).toEqual([]);
          expect(split.routeAbsentFrom).toEqual([]);
        });

        then('🔴 the command carries no brace', () => {
          expect(repair.command).not.toMatch(/[{}]/);
        });

        then('the new-domain command matches the snapshot', () => {
          expect(repair.command).toMatchSnapshot();
        });
      });
    },
  );
});
