import { given, then, when } from 'test-fns';

import { asReviewPartitionPlanLines } from './asReviewPartitionPlanLines';
import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';
import { getAllTargetsByPartition } from './getAllTargetsByPartition';
import { getOneReviewPartitionCosts } from './getOneReviewPartitionCosts';

const ROUTE = '.behavior/v2026_01_01.demo';

describe('asReviewPartitionPlanLines', () => {
  given('[case1] two partitions with several globs each, one too large', () => {
    const split = getAllTargetsByPartition({
      targets: [
        'src/review/a.ts',
        'src/review/b.ts',
        'src/route/c.ts',
        'src/domain.objects/Stone.ts',
        `${ROUTE}/1.vision.md`,
      ],
      partitions: asReviewPartitionsFromFlags({
        partition: [
          `review={src/review/**,src/domain.objects/**,${ROUTE}/**}`,
          `route={src/route/**,src/domain.objects/**,${ROUTE}/**}`,
        ],
      }),
      route: ROUTE,
    });
    const costs = getOneReviewPartitionCosts({
      split,
      tokensByPath: new Map([
        ['src/review/a.ts', 20_000],
        ['src/review/b.ts', 21_000],
        ['src/route/c.ts', 160_000],
        ['src/domain.objects/Stone.ts', 4_000],
        [`${ROUTE}/1.vision.md`, 800],
      ]),
      tokensOfHead: 3_000,
      contextWindowTokens: 200_000,
    });

    when('[t0] the plan is rendered', () => {
      const text = asReviewPartitionPlanLines({
        split,
        costs,
        route: null,
      }).join('\n');

      then('common and narrow are peer branches', () => {
        expect(text).toContain('   ├─ common');
        expect(text).toContain('   ├─ narrow');
      });

      then(
        'the globs the partitions share verbatim are shown under common',
        () => {
          expect(text).toContain('src/domain.objects/**');
          expect(text).toContain(`${ROUTE}/**`);
        },
      );

      then('each slug lists its globs verbatim and its cost', () => {
        expect(text).toContain('│  ├─ review');
        expect(text).toContain('│  └─ route');
        expect(text).toContain('src/route/**');
        expect(text).toContain('narrow:');
        expect(text).toContain('common:');
        expect(text).toContain('total:');
      });

      then(
        '🔴 clamp. the common cost node is labeled as its narrow peers are',
        () => {
          expect(text).toContain(
            '   │     └─ common:   2 files    4.8k tokens',
          );
          expect(text).not.toContain('└─   2 files');
        },
      );

      then('a partition that fits is marked ✓; one that does not, ✗', () => {
        expect(text).toContain('✓');
        expect(text).toContain('✗ exceeds the window');
      });

      then('each count agrees with its noun', () => {
        expect(text).toContain('1 file');
        expect(text).not.toContain('1 files');
      });

      then('the unclaimed count closes the plan', () => {
        expect(text).toContain('└─ unclaimed: 0');
      });

      then(
        'a token figure reads at the branch scale, never rounded up past its mass',
        () => {
          // 160,000 + 4,000 + 800 + 3,000 = 167,800 — a rounded `168k` overstates it
          expect(text).toContain('167.8k tokens');
          expect(text).not.toContain('168k');
        },
      );

      then('the plan matches the snapshot', () => {
        expect(text).toContain(
          '🦉 review --mode plan — split into 2 partitions',
        );
        expect(text).not.toContain('(plan)');
        expect(text).toContain('167.8k tokens ✗ exceeds the window');
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case1b] 🔴 CLAMP. a partition of more than a thousand files', () => {
    // the scope dumps beside this block comma-group every file count, so a bare
    // `1200 files` here read one figure two ways on one page
    const bigTargets = Array.from(
      { length: 1_200 },
      (_, at) => `src/big/f${at}.ts`,
    );
    const split = getAllTargetsByPartition({
      targets: [...bigTargets, 'src/small/a.ts', `${ROUTE}/1.vision.md`],
      partitions: asReviewPartitionsFromFlags({
        partition: [
          `big={src/big/**,${ROUTE}/**}`,
          `small={src/small/**,${ROUTE}/**}`,
        ],
      }),
      route: ROUTE,
    });
    const costs = getOneReviewPartitionCosts({
      split,
      tokensByPath: new Map([
        ...bigTargets.map((one): [string, number] => [one, 10]),
        ['src/small/a.ts', 500],
        [`${ROUTE}/1.vision.md`, 800],
      ]),
      tokensOfHead: 3_000,
      contextWindowTokens: 200_000,
    });

    when('[t0] the plan is rendered', () => {
      const text = asReviewPartitionPlanLines({
        split,
        costs,
        route: null,
      }).join('\n');

      then('the file count is comma-grouped, as its peer dumps are', () => {
        expect(text).toContain('1,200 files');
        expect(text).not.toContain('1200 files');
      });
    });
  });

  given('[case2] partitions that share no glob verbatim', () => {
    const split = getAllTargetsByPartition({
      targets: ['src/a/x.ts', 'src/b/y.ts'],
      partitions: asReviewPartitionsFromFlags({
        partition: ['a=src/a/**', 'b=src/b'],
      }),
      route: null,
    });
    const costs = getOneReviewPartitionCosts({
      split,
      tokensByPath: new Map([
        ['src/a/x.ts', 500],
        ['src/b/y.ts', 700],
      ]),
      tokensOfHead: 0,
      contextWindowTokens: 200_000,
    });

    when('[t0] the plan is rendered', () => {
      const text = asReviewPartitionPlanLines({
        split,
        costs,
        route: null,
      }).join('\n');

      then('common says no glob was shared verbatim', () => {
        expect(text).toContain('(no glob shared verbatim)');
      });

      then('the plan matches the snapshot', () => {
        expect(text).toContain('└─ (no glob shared verbatim)');
        expect(text).not.toContain('✗');
        expect(text).toMatchSnapshot();
      });
    });
  });
});
