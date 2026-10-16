import { given, then, when } from 'test-fns';

import { asReviewPartitionRefusal } from './asReviewPartitionRefusal';
import { REVIEW_PARTITION_REPAIR_TIP } from './asReviewPartitionRepairLines';
import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';
import { getAllTargetsByPartition } from './getAllTargetsByPartition';
import { getOneReviewPartitionCosts } from './getOneReviewPartitionCosts';

const ROUTE = '.behavior/v2026_01_01.demo';

/**
 * .what = a split of the given targets over the given declarations
 */
const asSplit = (input: {
  targets: string[];
  partition: string[];
  route: string | null;
}) =>
  getAllTargetsByPartition({
    targets: input.targets,
    partitions: asReviewPartitionsFromFlags({ partition: input.partition }),
    route: input.route,
  });

/**
 * .what = the refusal text with the shared tip rows removed
 * .why = the tip names a brace glob as an example; the repair text above it must carry none,
 *        so a brace check reads the repair alone
 */
const asTextSansTip = (input: { text: string }): string =>
  input.text
    .split('\n')
    .filter(
      (line) => !REVIEW_PARTITION_REPAIR_TIP.some((row) => line.includes(row)),
    )
    .join('\n');

describe('asReviewPartitionRefusal', () => {
  given('[case0] more unclaimed targets than a path list can show', () => {
    // 20 unclaimed files over 14 directories — past the 12-path list
    const targets = [
      ...Array.from({ length: 7 }, (_, index) => `blackbox/b${index}.ts`),
      ...Array.from({ length: 13 }, (_, index) => `.scratch/d${index}/x.md`),
      'src/a.ts',
    ];
    const split = asSplit({
      targets,
      partition: ['src=src/**'],
      route: null,
    });

    when('[t0] the refusal is checked', () => {
      const text = (
        asReviewPartitionRefusal({
          split,
          costs: null,
          tokensByPath: null,
          route: null,
          repairVia: null,
        })?.lines ?? []
      ).join('\n');

      then(
        'it names every unclaimed directory with its count, cut at none',
        () => {
          expect(text).toContain('unclaimed, by directory (14 directories)');
          expect(text).toContain('7 files  blackbox');
          expect(text).toContain('.scratch/d12');
          expect(text).not.toContain('… and');
        },
      );

      then('the lines match the snapshot', () => {
        expect(text).toContain('└─    1 file  .scratch/d12');
        expect(text).not.toContain('rest=');
        expect(text).toMatchSnapshot();
      });
    });

    when('[t1] the headline is read', () => {
      const headline = asReviewPartitionRefusal({
        split,
        costs: null,
        tokensByPath: null,
        route: null,
        repairVia: null,
      })?.headline;

      then(
        'it counts the targets in the plural, with no pronoun to agree',
        () => {
          expect(headline).toEqual(
            '20 targets sit in no partition, so a split would leave targets unreviewed',
          );
        },
      );

      then('the headline matches the snapshot', () => {
        expect(headline).toContain('20 targets sit in no partition');
        expect(headline).toMatchSnapshot();
      });
    });
  });

  given('[case0b] one directory too heavy to be one partition', () => {
    // 60 unclaimed files under one depth-3 dir, in two subdomains of 30 each
    const targets = [
      ...Array.from(
        { length: 30 },
        (_, index) => `src/ops/review/meter/m${index}.ts`,
      ),
      ...Array.from(
        { length: 30 },
        (_, index) => `src/ops/review/warmer/w${index}.ts`,
      ),
      ...Array.from({ length: 45 }, (_, index) => `src/ops/route/r${index}.ts`),
      ...Array.from(
        { length: 3 },
        (_, index) => `src/ops/route/__snapshots__/s${index}.snap`,
      ),
      'blackbox/x.ts',
    ];
    const split = asSplit({
      targets,
      partition: ['bb=blackbox/**'],
      route: null,
    });

    when('[t0] the refusal is checked', () => {
      const text = (
        asReviewPartitionRefusal({
          split,
          costs: null,
          tokensByPath: null,
          route: null,
          repairVia: null,
        })?.lines ?? []
      ).join('\n');

      then('🔴 it opens the heavy row to the subdomains below it', () => {
        expect(text).toContain('30 files  src/ops/review/meter');
        expect(text).toContain('30 files  src/ops/review/warmer');
        expect(text).not.toContain('60 files');
      });

      then(
        '🔴 a heavy row of files that sit directly in a dir is named once',
        () => {
          expect(text.split('45 files  src/ops/route\n').length).toEqual(2);
          expect(text).toContain('3 files  src/ops/route/__snapshots__');
        },
      );

      then('the lines match the snapshot', () => {
        expect(text).toContain('unclaimed, by directory (4 directories)');
        expect(text).toContain('45 files  src/ops/route');
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case1] a target that sits in no partition', () => {
    const split = asSplit({
      targets: ['src/a.ts', 'blackbox/x.ts'],
      partition: ['src=src/**'],
      route: null,
    });

    when('[t0] the refusal is checked', () => {
      const refusal = asReviewPartitionRefusal({
        split,
        costs: null,
        tokensByPath: null,
        route: null,
        repairVia: null,
      });

      then('🔴 it refuses, and names the target', () => {
        expect(refusal?.headline).toEqual(
          '1 target sits in no partition, so a split would leave targets unreviewed',
        );
        expect(refusal?.lines.join('\n')).toContain('blackbox/x.ts');
        // 🔴 the fix proposes a named domain, never a catch-all
        expect(refusal?.lines.join('\n')).toContain(
          'declare one more named for its domain',
        );
        expect(refusal?.lines.join('\n')).not.toContain('rest=');
      });

      then('the refusal matches the snapshot', () => {
        const text = [refusal?.headline, ...(refusal?.lines ?? [])].join('\n');
        expect(text).toContain('├─ unclaimed\n   │  └─ blackbox/x.ts');
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case2] a bound route that one partition omits', () => {
    const split = asSplit({
      targets: ['src/a.ts', `${ROUTE}/1.vision.md`],
      partition: [`a={src/**,${ROUTE}/**}`, 'b=src/a.ts'],
      route: ROUTE,
    });

    when('[t0] the refusal is checked', () => {
      const refusal = asReviewPartitionRefusal({
        split,
        costs: null,
        tokensByPath: null,
        route: ROUTE,
        repairVia: null,
      });

      then(
        '🔴 it refuses — the route is a core requirement, never a warn',
        () => {
          expect(refusal?.headline).toContain(
            'the bound route is absent from 1 partition',
          );
          expect(refusal?.lines.join('\n')).toContain(`add '${ROUTE}/**'`);
        },
      );

      then('the refusal matches the snapshot', () => {
        const text = [refusal?.headline, ...(refusal?.lines ?? [])].join('\n');
        expect(text).toContain('├─ absent from\n   │  └─ b');
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case3] a partition that cannot fit alone', () => {
    const split = asSplit({
      targets: [
        'src/a.ts',
        'src/b/meter/x.ts',
        'src/b/meter/y.ts',
        'src/b/cache/z.ts',
        'src/types.ts',
      ],
      partition: ['a={src/a.ts,src/types.ts}', 'b={src/b/**,src/types.ts}'],
      route: null,
    });
    const tokensByPath = new Map([
      ['src/a.ts', 1_000],
      ['src/b/meter/x.ts', 90_000],
      ['src/b/meter/y.ts', 40_000],
      ['src/b/cache/z.ts', 50_000],
      ['src/types.ts', 2_000],
    ]);
    const costs = getOneReviewPartitionCosts({
      split,
      tokensByPath,
      tokensOfHead: 0,
      contextWindowTokens: 200_000,
    });

    when('[t0] the refusal is checked', () => {
      const refusal = asReviewPartitionRefusal({
        split,
        costs: costs.partitions,
        tokensByPath,
        route: null,
        repairVia: null,
      });

      then(
        '🔴 it refuses before any brain is called, and names the partition',
        () => {
          expect(refusal?.headline).toEqual(
            '1 partition still overflows alone',
          );
          expect(refusal?.lines.join('\n')).toContain(
            'b: ~182,000 tokens, 4 files — ~32,000 over the ~150,000 limit',
          );
        },
      );

      then(
        '🔴 it names where the mass sits — the common share, and its own targets by directory, heaviest first',
        () => {
          const text = refusal?.lines.join('\n') ?? '';
          expect(text).toContain('common: ~2,000 tokens, 1 file');
          const meterAt = text.indexOf('src/b/meter');
          const cacheAt = text.indexOf('src/b/cache');
          expect(meterAt).toBeGreaterThan(-1);
          expect(cacheAt).toBeGreaterThan(meterAt);
          expect(text).toContain('130,000 tokens   2 files  src/b/meter');
        },
      );

      then('the refusal matches the snapshot', () => {
        const text = [refusal?.headline, ...(refusal?.lines ?? [])].join('\n');
        expect(text).toContain('the tool never splits a partition again');
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case4] a sound split', () => {
    const split = asSplit({
      targets: ['src/a.ts', `${ROUTE}/1.vision.md`],
      partition: [`a={src/**,${ROUTE}/**}`],
      route: ROUTE,
    });

    when('[t0] the refusal is checked', () => {
      then('there is none', () => {
        expect(
          asReviewPartitionRefusal({
            split,
            costs: null,
            tokensByPath: null,
            route: ROUTE,
            repairVia: null,
          }),
        ).toEqual(null);
      });
    });
  });

  given(
    '[case5] a route set that leaves the prime files unclaimed (the i008 refusal)',
    () => {
      const ROUTE_SET = [
        `review-ops={src/domain.operations/review/partition/**,${ROUTE}/**}`,
        `route-ops={src/domain.operations/route/**,${ROUTE}/**}`,
      ];
      const split = asSplit({
        targets: [
          'src/domain.operations/review/partition/a.ts',
          'src/domain.operations/review/prime/setOnePrime.ts',
          'src/domain.operations/review/prime/setOnePrime.test.ts',
          'src/domain.operations/route/b.ts',
          `${ROUTE}/1.vision.md`,
        ],
        partition: ROUTE_SET,
        route: ROUTE,
      });
      const command = {
        head: `rhx route.guard.partition --route ${ROUTE} --for review --peer @all`,
        tail: '  --mode apply',
      };

      when(
        '[t0] the refusal is checked with the route set it came from',
        () => {
          const text = (
            asReviewPartitionRefusal({
              split,
              costs: null,
              tokensByPath: null,
              route: ROUTE,
              repairVia: { partition: ROUTE_SET, command },
            })?.lines ?? []
          ).join('\n');

          then(
            '🔴 it places each unclaimed file in the partition of its domain',
            () => {
              expect(text).toContain(
                'src/domain.operations/review/prime/setOnePrime.ts → review-ops (+ src/domain.operations/review/prime/**)',
              );
            },
          );

          then(
            '🔴 it prints the smallest command: one claim into the partition that fits',
            () => {
              expect(text).toContain(command.head);
              expect(text).toContain(
                "--claim 'src/domain.operations/review/prime/**' --into review-ops",
              );
              expect(text).not.toContain('--partition');
              expect(asTextSansTip({ text })).not.toMatch(/[{}]/);
              expect(text).not.toContain('rest');
              expect(text).toContain('--mode apply');
            },
          );

          then('the lines match the snapshot', () => {
            expect(text).toContain(
              'repair — run this to claim each gap into its partition',
            );
            expect(text).toMatchSnapshot();
          });
        },
      );

      when('[t1] the refusal is checked with the caller own flags', () => {
        const text = (
          asReviewPartitionRefusal({
            split,
            costs: null,
            tokensByPath: null,
            route: ROUTE,
            repairVia: { partition: ROUTE_SET, command: null },
          })?.lines ?? []
        ).join('\n');

        then(
          '🔴 it prints the corrected --partition flags, with no command',
          () => {
            expect(text).toContain(
              "--partition 'review-ops=src/domain.operations/review/prime/**'",
            );
            expect(asTextSansTip({ text })).not.toMatch(/[{}]/);
            expect(text).not.toContain('rhx route.guard.partition');
            expect(text).not.toContain('--mode apply');
          },
        );

        then('the lines match the snapshot', () => {
          expect(text).toContain('beside yours');
          expect(text).toMatchSnapshot();
        });
      });
    },
  );

  given('[case6] a route set where one partition lacks the route spec', () => {
    const ROUTE_SET = [`a={src/**,${ROUTE}/**}`, 'b=src/a.ts'];
    const split = asSplit({
      targets: ['src/a.ts', `${ROUTE}/1.vision.md`],
      partition: ROUTE_SET,
      route: ROUTE,
    });

    when('[t0] the refusal is checked with the route set it came from', () => {
      const text = (
        asReviewPartitionRefusal({
          split,
          costs: null,
          tokensByPath: null,
          route: ROUTE,
          repairVia: {
            partition: ROUTE_SET,
            command: {
              head: `rhx route.guard.partition --route ${ROUTE} --for review --peer @all`,
              tail: '  --mode apply',
            },
          },
        })?.lines ?? []
      ).join('\n');

      then(
        '🔴 the command adds the route spec to the partition that lacked it',
        () => {
          expect(text).toContain(`--claim '${ROUTE}/**' --into b`);
          expect(asTextSansTip({ text })).not.toMatch(/[{}]/);
          expect(text).toMatchSnapshot();
        },
      );

      then(
        '🔴 it closes on the one shared tip, in its own did-you-know block apart from the repair text, so a paste never carries it',
        () => {
          const lines = text.split('\n');
          const rowHeader = lines.indexOf('✨ did you know?');
          const rowCaption = lines.findIndex((line) =>
            line.includes('repair — run this'),
          );
          // the block opens after the repair text, behind a blank line
          expect(rowHeader).toBeGreaterThan(rowCaption);
          expect(lines[rowHeader - 1]).toEqual('');
          expect(lines.slice(rowHeader + 1)).toEqual([
            `   ├─ ${REVIEW_PARTITION_REPAIR_TIP[0]}`,
            `   └─ ${REVIEW_PARTITION_REPAIR_TIP[1]}`,
          ]);
          // no row wears a `tip:` label
          expect(text).not.toContain('tip:');
        },
      );
    });
  });
});
