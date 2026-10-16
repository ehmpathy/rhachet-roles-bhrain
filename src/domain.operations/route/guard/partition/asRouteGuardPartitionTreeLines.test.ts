import { given, then, when } from 'test-fns';

import { asReviewPartitionsFromFlags } from '@src/domain.operations/review/partition/asReviewPartitionsFromFlags';
import { getAllTargetsByPartition } from '@src/domain.operations/review/partition/getAllTargetsByPartition';

import { asRouteGuardPartitionTreeLines } from './asRouteGuardPartitionTreeLines';

const ROUTE = '.behavior/v2026_01_01.demo';
const TARGETS = [
  'src/review/a.ts',
  'src/review/a.test.ts',
  'src/route/b.ts',
  'src/shared/c.ts',
  `${ROUTE}/1.vision.md`,
];
const SPLIT = getAllTargetsByPartition({
  targets: TARGETS,
  partitions: asReviewPartitionsFromFlags({
    partition: [
      `review={src/review/**,src/shared/**,${ROUTE}/**}`,
      `route={src/route/**,src/shared/**,${ROUTE}/**}`,
    ],
  }),
  route: ROUTE,
});
const TOKENS_BY_PATH = new Map([
  ['src/review/a.ts', 40_000],
  ['src/review/a.test.ts', 20_000],
  ['src/route/b.ts', 30_000],
  ['src/shared/c.ts', 5_000],
  [`${ROUTE}/1.vision.md`, 100_000],
]);

describe('asRouteGuardPartitionTreeLines', () => {
  given('[case1] a first @all set, previewed', () => {
    const text = asRouteGuardPartitionTreeLines({
      mode: 'plan',
      route: ROUTE,
      scope: { kind: 'all' },
      targets: TARGETS,
      split: SPLIT,
      tokensByPath: TOKENS_BY_PATH,
      replaced: null,
      claimed: null,
      pruned: null,
    }).join('\n');

    when('[t0] the tree is rendered', () => {
      then(
        '🔴 each partition shows the mass of its file bodies, and the share it holds in common',
        () => {
          // review: a.ts 40k + a.test.ts 20k own; shared/c.ts 5k + vision 100k common
          expect(text).toContain(
            'review: 2 narrow targets + 2 common targets · ~165,000 tokens of file bodies, ~105,000 common',
          );
          expect(text).toContain(
            'route: 1 narrow target + 2 common targets · ~135,000 tokens of file bodies, ~105,000 common',
          );
        },
      );

      then('beneath each partition row sit the globs it claims', () => {
        const lines = text.split('\n');
        const rowReview = lines.findIndex((line) =>
          line.includes('review: 2 narrow targets'),
        );
        const rowRoute = lines.findIndex((line) =>
          line.includes('route: 1 narrow target'),
        );
        expect(lines[rowReview + 1]).toContain('└─ ');
        expect(lines[rowReview + 1]).toContain('src/review/**');
        expect(lines[rowRoute + 1]).toContain('src/route/**');
      });

      then('the title echoes the typed flag', () => {
        expect(text).toContain('🗿 route.guard.partition --mode plan');
      });

      then('it says naught was written, and how to write it', () => {
        expect(text).toContain('naught written');
        expect(text).toContain('to write it: add --mode apply');
      });

      then('it names the reach: every reviewer, every stone', () => {
        expect(text).toContain('peer = @all (every reviewer, every stone)');
      });

      then('it replaces none', () => {
        expect(text).toContain('replaces: none');
      });

      then('the lines match the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case2] a per-peer override, applied over a prior one', () => {
    const text = asRouteGuardPartitionTreeLines({
      mode: 'apply',
      route: ROUTE,
      scope: { kind: 'peer', stone: '3.blueprint', peer: 'r2' },
      targets: TARGETS,
      split: SPLIT,
      tokensByPath: null,
      replaced: ['solo={src/**}'],
      claimed: null,
      pruned: null,
    }).join('\n');

    when('[t0] the tree is rendered', () => {
      then('it names the peer, the stone, and that it overrides @all', () => {
        expect(text).toContain('peer = r2 on 3.blueprint (overrides @all)');
      });

      then('it names the one partition it replaced, whole', () => {
        expect(text).toContain('replaces: 1 partition, whole');
      });

      then('the lines match the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case3] a set with a glob that matches no changed file', () => {
    const split = getAllTargetsByPartition({
      targets: TARGETS,
      partitions: asReviewPartitionsFromFlags({
        partition: [
          `review=src/review/**,src/shared/**,${ROUTE}/**`,
          `route=src/route/**,src/shared/**,${ROUTE}/**`,
          'route=blackbox/driver.rout.*',
        ],
      }),
      route: ROUTE,
    });
    const text = asRouteGuardPartitionTreeLines({
      mode: 'plan',
      route: ROUTE,
      scope: { kind: 'all' },
      targets: TARGETS,
      split,
      tokensByPath: null,
      replaced: null,
      claimed: null,
      pruned: null,
    }).join('\n');

    when('[t0] the tree is rendered', () => {
      then('🔴 it flags the zero-match glob by slug — the silent typo', () => {
        expect(text).toContain(
          '🟡 1 glob that matched no changed file — a typo, or no change there yet',
        );
        expect(text).toContain('route: blackbox/driver.rout.*');
      });

      then('it flags no glob that matched', () => {
        expect(text).not.toContain('route: src/route/**');
      });

      then('the lines match the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case5] a claim into a held set, previewed', () => {
    const text = asRouteGuardPartitionTreeLines({
      mode: 'plan',
      route: ROUTE,
      scope: { kind: 'all' },
      targets: TARGETS,
      split: SPLIT,
      tokensByPath: null,
      replaced: ['review=src/review/**', 'route=src/route/**'],
      claimed: [{ glob: 'src/shared/**', into: 'review' }],
      pruned: null,
    }).join('\n');

    when('[t0] the tree is rendered', () => {
      then('it names each claim as glob → slug, and keeps the rest', () => {
        expect(text).toContain('src/shared/** → review');
        expect(text).toContain('every other partition kept as held');
        expect(text).not.toContain('replaces:');
      });

      then('the lines match the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = 🔴 CLAMP. a prune that dropped stale globs, applied
   * .why = a prune writes the whole set back, so the tree must name what it dropped, and
   *        say the rest stood — else a driver cannot tell a prune from a re-declaration
   */
  given('[case6] a prune from a held set, applied', () => {
    const text = asRouteGuardPartitionTreeLines({
      mode: 'apply',
      route: ROUTE,
      scope: { kind: 'all' },
      targets: TARGETS,
      split: SPLIT,
      tokensByPath: null,
      replaced: ['review=src/review/**,src/gone/**', 'route=src/route/**'],
      claimed: null,
      pruned: [
        { glob: 'src/gone/**', from: null },
        { glob: 'src/shared/**', from: 'route' },
      ],
    }).join('\n');

    when('[t0] the tree is rendered', () => {
      then('it names each prune as glob ← slug, or wherever held', () => {
        expect(text).toContain(
          'prunes: 2 globs, every other partition kept as held',
        );
        expect(text).toContain('src/gone/** ← wherever held');
        expect(text).toContain('src/shared/** ← route');
        expect(text).not.toContain('replaces:');
      });

      then('the lines match the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = 🔴 CLAMP. a written set that holds a stale glob
   * .why = a stale glob once had no drop lever but a re-declaration of every partition, so the
   *        applied tree now closes the flag on the paste-ready prune that drops it
   */
  given(
    '[case7] a written set with a glob that matches no changed file',
    () => {
      const split = getAllTargetsByPartition({
        targets: TARGETS,
        partitions: asReviewPartitionsFromFlags({
          partition: [
            `review=src/review/**,src/shared/**,${ROUTE}/**`,
            `route=src/route/**,src/shared/**,${ROUTE}/**,blackbox/driver.rout.*`,
          ],
        }),
        route: ROUTE,
      });

      when('[t0] the set is applied', () => {
        const text = asRouteGuardPartitionTreeLines({
          mode: 'apply',
          route: ROUTE,
          scope: { kind: 'all' },
          targets: TARGETS,
          split,
          tokensByPath: null,
          replaced: null,
          claimed: null,
          pruned: null,
        }).join('\n');

        then('the flag closes on the paste-ready prune', () => {
          expect(text).toContain(
            `stale? drop them: rhx route.guard.partition --route ${ROUTE} --for review --peer @all --prune 'blackbox/driver.rout.*' --mode apply`,
          );
        });
      });

      when('[t1] the set is only previewed', () => {
        const text = asRouteGuardPartitionTreeLines({
          mode: 'plan',
          route: ROUTE,
          scope: { kind: 'all' },
          targets: TARGETS,
          split,
          tokensByPath: null,
          replaced: null,
          claimed: null,
          pruned: null,
        }).join('\n');

        then('no prune is offered, since the glob is not yet held', () => {
          expect(text).not.toContain('--prune');
        });
      });
    },
  );

  given('[case4] a set whose every glob matched', () => {
    const text = asRouteGuardPartitionTreeLines({
      mode: 'plan',
      route: ROUTE,
      scope: { kind: 'all' },
      targets: TARGETS,
      split: SPLIT,
      tokensByPath: null,
      replaced: null,
      claimed: null,
      pruned: null,
    }).join('\n');

    when('[t0] the tree is rendered', () => {
      then('it carries no unmatched branch', () => {
        expect(text).not.toContain('matched no changed file');
      });
    });
  });
});
