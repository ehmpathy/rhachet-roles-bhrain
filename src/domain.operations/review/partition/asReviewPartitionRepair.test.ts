import { given, then, when } from 'test-fns';

import { asReviewPartitionRepair } from './asReviewPartitionRepair';
import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';
import { getAllTargetsByPartition } from './getAllTargetsByPartition';

const ROUTE = '.behavior/v2026_01_01.demo';

/**
 * .what = the split a set yields over the given targets
 * .why = the repair's contract is that it claims each file it was given, through the one
 *        split every lane runs — so the test reads it back through that split
 */
const asSplitOf = (input: { partition: string[]; targets: string[] }) =>
  getAllTargetsByPartition({
    targets: input.targets,
    partitions: asReviewPartitionsFromFlags({ partition: input.partition }),
    route: ROUTE,
  });

/**
 * .what = a set where `meter` already claims one `blackbox/` file, so the nearest root of
 *         any other `blackbox/` file is meter's
 */
const PARTITION = [
  `meter={src/domain.operations/review/meter/**,blackbox/review._.cost.acceptance.test.ts,${ROUTE}/**}`,
  `route={src/domain.operations/route/**,${ROUTE}/**}`,
  `rest={package.json,docs/**,${ROUTE}/**}`,
];

describe('asReviewPartitionRepair', () => {
  given(
    '[case1] an unclaimed route acceptance test beside a meter acceptance test',
    () => {
      const unclaimed = 'blackbox/driver.route.foo.acceptance.test.ts';
      const targets = [
        'src/domain.operations/review/meter/a.ts',
        'src/domain.operations/route/b.ts',
        'blackbox/review._.cost.acceptance.test.ts',
        'blackbox/keyrack.unlock.acceptance.test.ts',
        unclaimed,
        `${ROUTE}/0.wish.md`,
      ];

      when('[t0] the set is repaired', () => {
        const repair = asReviewPartitionRepair({
          partition: PARTITION,
          unclaimed: [unclaimed],
          routeAbsentFrom: [],
          route: ROUTE,
          command: null,
        });

        then(
          '🔴 the file joins the route partition — the domain it tests',
          () => {
            expect(repair.placed).toEqual([
              {
                path: unclaimed,
                slug: 'route',
                glob: 'blackbox/{,__snapshots__/}driver.route.*',
              },
            ]);
          },
        );

        then('🔴 the glob is narrower than the bare `blackbox/**`', () => {
          const glob = repair.placed[0]!.glob;
          expect(glob).not.toEqual('blackbox/**');
          expect(repair.partition.join('\n')).not.toContain('blackbox/**');
        });

        then('the repaired set claims the file in `route`', () => {
          const split = asSplitOf({ partition: repair.partition, targets });
          expect(split.unclaimed).toEqual([
            'blackbox/keyrack.unlock.acceptance.test.ts',
          ]);
        });

        then(
          '🔴 the caller is handed only the flag to add, with no outer brace',
          () => {
            expect(repair.form).toEqual('append');
            expect(repair.command).toEqual(
              "  --partition 'route=blackbox/{,__snapshots__/}driver.route.*'",
            );
          },
        );

        then('the repaired flags match the snapshot', () => {
          expect(repair.partition[1]).toEqual(
            `route=src/domain.operations/route/**,${ROUTE}/**,blackbox/{,__snapshots__/}driver.route.*`,
          );
          expect(repair.command).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case2] an unclaimed blackbox file no partition shares a word with',
    () => {
      const unclaimed = 'blackbox/keyrack.unlock.acceptance.test.ts';

      when('[t0] the set is repaired', () => {
        const repair = asReviewPartitionRepair({
          partition: PARTITION,
          unclaimed: [unclaimed],
          routeAbsentFrom: [],
          route: ROUTE,
          command: null,
        });

        then('it joins the meter partition, whose root sits above it', () => {
          // no domain word matches, so the deepest root breaks the tie — but the glob
          // still never widens to the whole layer
          expect(repair.placed).toEqual([
            {
              path: unclaimed,
              slug: 'meter',
              glob: 'blackbox/{,__snapshots__/}keyrack.unlock.*',
            },
          ]);
        });

        then('🔴 a partition named rest is never the home', () => {
          expect(repair.command).not.toContain('rest=');
        });

        then('the repaired command matches the snapshot', () => {
          expect(repair.command).toContain(
            "--partition 'meter=blackbox/{,__snapshots__/}keyrack.unlock.*'",
          );
          expect(repair.command).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case3] unclaimed files under no declared root and no shared word',
    () => {
      const unclaimed = [
        'blackbox/keyrack.unlock.acceptance.test.ts',
        'blackbox/keyrack.fill.acceptance.test.ts',
      ];

      when('[t0] the set is repaired', () => {
        const repair = asReviewPartitionRepair({
          partition: [`route=src/domain.operations/route/**,${ROUTE}/**`],
          unclaimed,
          routeAbsentFrom: [],
          route: ROUTE,
          command: null,
        });

        then(
          '🔴 they join a new domain named by their shared stem, never rest',
          () => {
            expect(repair.placed.map((item) => item.slug)).toEqual([
              'keyrack',
              'keyrack',
            ]);
            expect(repair.partition[1]).toEqual(
              `keyrack=blackbox/{,__snapshots__/}keyrack.*,${ROUTE}/**`,
            );
            expect(repair.command).not.toContain('rest');
          },
        );

        then('🔴 the domain glob is no whole layer', () => {
          expect(repair.command).not.toContain('blackbox/**');
        });

        then('the repaired command matches the snapshot', () => {
          expect(repair.command).toContain(
            `--partition 'keyrack=blackbox/{,__snapshots__/}keyrack.*,${ROUTE}/**'`,
          );
          expect(repair.command).toMatchSnapshot();
        });

        then('the repaired set leaves none of them unclaimed', () => {
          const split = asSplitOf({
            partition: repair.partition,
            targets: [...unclaimed, 'src/domain.operations/route/b.ts'],
          });
          expect(split.unclaimed).toEqual([]);
        });
      });
    },
  );

  given('[case3b] an unclaimed blackbox test and the snapshot it wrote', () => {
    // measured 2026-10-12 on this route: the repair claimed a blackbox snapshot as
    // `blackbox/__snapshots__/**` — every domain's snapshots in one partition — and the
    // test beside it as a second, stem-only claim that missed its own snapshot
    const unclaimed = [
      'blackbox/keyrack.unlock.acceptance.test.ts',
      'blackbox/__snapshots__/keyrack.unlock.acceptance.test.ts.snap',
    ];

    when('[t0] the set is repaired', () => {
      const repair = asReviewPartitionRepair({
        partition: [`route=src/domain.operations/route/**,${ROUTE}/**`],
        unclaimed,
        routeAbsentFrom: [],
        route: ROUTE,
        command: null,
      });

      then('🔴 the test and its snapshot share one domain glob', () => {
        expect(repair.placed.map((item) => item.glob)).toEqual([
          'blackbox/{,__snapshots__/}keyrack.*',
          'blackbox/{,__snapshots__/}keyrack.*',
        ]);
      });

      then('🔴 the snapshot dir is never claimed whole', () => {
        expect(repair.command).not.toContain('__snapshots__/**');
      });

      then('the repaired set leaves none of them unclaimed', () => {
        const split = asSplitOf({
          partition: repair.partition,
          targets: [...unclaimed, 'src/domain.operations/route/b.ts'],
        });
        expect(split.unclaimed).toEqual([]);
      });
    });
  });

  given(
    '[case3c] an unclaimed blackbox snapshot, its test held by a declared partition',
    () => {
      // the snapshot joins the partition that holds its test's word, by stem — never the
      // whole snapshot dir
      const unclaimed = [
        'blackbox/__snapshots__/review._.cost.acceptance.test.ts.snap',
      ];

      when('[t0] the set is repaired', () => {
        const repair = asReviewPartitionRepair({
          partition: PARTITION,
          unclaimed,
          routeAbsentFrom: [],
          route: ROUTE,
          command: null,
        });

        then('🔴 the snapshot dir is never claimed whole', () => {
          expect(repair.placed[0]!.glob).not.toContain('__snapshots__/**');
          expect(repair.placed[0]!.glob).toContain('{,__snapshots__/}');
        });

        then('the repaired set leaves it unclaimed by none', () => {
          const split = asSplitOf({
            partition: repair.partition,
            targets: unclaimed,
          });
          expect(split.unclaimed).toEqual([]);
        });
      });
    },
  );

  given(
    '[case4] an unclaimed file in a directory several partitions already split',
    () => {
      // measured 2026-10-07 on this route: six partitions root a glob at
      // `src/contract/cli`, so word count and root depth tie, and the first declared
      // (`warmer`) won the file — with a claim of the whole dir that pulled every cli file
      // into warmer beside its true partition
      const unclaimed = 'src/contract/cli/learn.integration.test.ts';
      const partition = [
        `warmer=src/domain.operations/review/warmer/**,src/contract/cli/reviewWarmer*,${ROUTE}/**`,
        `review-cli=src/contract/cli/review.ts,src/contract/cli/review.by.*,${ROUTE}/**`,
        `route-cli=src/contract/cli/route*,${ROUTE}/**`,
        `cli=src/contract/cli/index*,src/contract/cli/as*,${ROUTE}/**`,
      ];
      const targets = [
        unclaimed,
        'src/contract/cli/reviewWarmer.ts',
        'src/contract/cli/review.ts',
        'src/contract/cli/route.ts',
        'src/contract/cli/index.ts',
      ];

      when('[t0] the set is repaired', () => {
        const repair = asReviewPartitionRepair({
          partition,
          unclaimed: [unclaimed],
          routeAbsentFrom: [],
          route: ROUTE,
          command: null,
        });

        then(
          '🔴 the file joins the partition whose slug its path names',
          () => {
            expect(repair.placed[0]!.slug).toEqual('cli');
          },
        );

        then(
          '🔴 the glob claims the file by its stem, never the shared dir',
          () => {
            expect(repair.placed[0]!.glob).toEqual(
              'src/contract/cli/{,__snapshots__/}learn.*',
            );
            expect(repair.command).not.toContain('src/contract/cli/**');
          },
        );

        then('🔴 no peer cli file is pulled into a second partition', () => {
          const split = asSplitOf({ partition: repair.partition, targets });
          expect(split.unclaimed).toEqual([]);
          expect(split.common).not.toContain('src/contract/cli/route.ts');
          expect(split.common).not.toContain('src/contract/cli/review.ts');
        });

        then('the repaired command matches the snapshot', () => {
          expect(repair.command).toContain(
            'src/contract/cli/{,__snapshots__/}learn.*',
          );
          expect(repair.command).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case9] 🔴 a new subdomain dir whose files lean toward two different homes',
    () => {
      // .why = dogfood 2026-10-08: a moved `review/poke/` dir held 3 files that named `warmer`
      //        and 4 that named `review`. each group claimed the whole dir, so the repair put
      //        `poke/**` into BOTH partitions and every poke file rode in two prompts
      const partition = [
        `warmer={src/x/warmer/**,${ROUTE}/**}`,
        `fault={src/x/fault/**,${ROUTE}/**}`,
      ];
      const unclaimed = [
        'src/x/poke/setOneWarmerPoke.ts',
        'src/x/poke/asWarmerPokeHead.ts',
        'src/x/poke/isErrorOfFault.ts',
      ];
      const targets = [...unclaimed, `${ROUTE}/0.wish.md`];

      when('[t0] the set is repaired', () => {
        const repair = asReviewPartitionRepair({
          partition,
          unclaimed,
          routeAbsentFrom: [],
          route: ROUTE,
          command: {
            head: 'rhx route.guard.partition',
            tail: '  --mode apply',
          },
        });

        then('every file of the dir shares ONE home — the majority one', () => {
          expect([...new Set(repair.placed.map((item) => item.slug))]).toEqual([
            'warmer',
          ]);
        });

        then('the dir is claimed once, never into two partitions', () => {
          expect(repair.command.split('src/x/poke/**').length - 1).toEqual(1);
        });

        then('no file of the dir lands in two partitions', () => {
          const split = asSplitOf({ partition: repair.partition, targets });
          expect(split.unclaimed).toEqual([]);
          unclaimed.forEach((path) => expect(split.common).not.toContain(path));
        });

        then('the repaired command matches the snapshot', () => {
          expect(repair.command).toContain(
            "--claim 'src/x/poke/**' --into warmer",
          );
          expect(repair.command).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case10] 🔴 CLAMP. a file whose filename shares a word with a subdir of another domain',
    () => {
      // .why = dogfood 2026-10-10: the repair grew `route` with `research/render/**`, a domain
      //        `route` holds no part of. two reads sent it there: a one-file glob at the
      //        `domain.operations` root read as a claim on its whole subtree, and the word
      //        `tree` matched a subdir in `route/guard/{…,tree,…}/**`
      const partition = [
        `route=src/domain.operations/route/*,src/domain.operations/route/guard/{judge,tree}/**,src/domain.operations/getOneGuardProvenance.*,${ROUTE}/**`,
        `review=src/domain.operations/review/*,${ROUTE}/**`,
      ];
      const unclaimed = [
        'src/domain.operations/research/render/computeOutputTree.ts',
      ];
      const targets = [
        ...unclaimed,
        'src/domain.operations/route/guard/tree/getOneTree.ts',
      ];

      when('[t0] the set is repaired', () => {
        const repair = asReviewPartitionRepair({
          partition,
          unclaimed,
          routeAbsentFrom: [],
          route: ROUTE,
          command: {
            head: 'rhx route.guard.partition',
            tail: '  --mode apply',
          },
        });

        then('🔴 it joins the domain its own dir names, never `route`', () => {
          expect(repair.placed[0]!.slug).toEqual('research');
          expect(repair.placed[0]!.glob).toEqual(
            'src/domain.operations/research/**',
          );
        });

        then(
          'the repaired set leaves the file claimed, in one partition',
          () => {
            const split = asSplitOf({ partition: repair.partition, targets });
            expect(split.unclaimed).toEqual([]);
            expect(split.common).not.toContain(unclaimed[0]);
          },
        );

        then('the repaired command matches the snapshot', () => {
          expect(repair.command).toContain(
            `research=src/domain.operations/research/**,${ROUTE}/**`,
          );
          expect(repair.command).toMatchSnapshot();
        });
      });

      when('[t1] the file names a slug of the other domain', () => {
        const repair = asReviewPartitionRepair({
          partition,
          unclaimed: [
            'src/domain.operations/research/render/asReviewSummary.ts',
          ],
          routeAbsentFrom: [],
          route: ROUTE,
          command: null,
        });

        then('a named slug still crosses the dir', () => {
          expect(repair.placed[0]!.slug).toEqual('review');
        });
      });
    },
  );
});
