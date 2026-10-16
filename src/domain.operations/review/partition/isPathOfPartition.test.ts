import { given, then, when } from 'test-fns';

import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';
import { getAllTargetsByPartition } from './getAllTargetsByPartition';
import { asSubjectOfSnapshot, isPathOfPartition } from './isPathOfPartition';

const TEST_CASES_SUBJECT = [
  {
    description: 'a snapshot beside its test names that test',
    path: 'src/contract/cli/__snapshots__/learn.integration.test.ts.snap',
    subject: 'src/contract/cli/learn.integration.test.ts',
  },
  {
    description: 'a snapshot at the repo root names a root test',
    path: '__snapshots__/a.test.ts.snap',
    subject: 'a.test.ts',
  },
  {
    description: 'a plain source file is no snapshot',
    path: 'src/contract/cli/learn.ts',
    subject: null,
  },
  {
    description: 'a .snap outside a __snapshots__ dir is no jest snapshot',
    path: 'src/contract/cli/learn.snap',
    subject: null,
  },
];

describe('isPathOfPartition', () => {
  given('[case1] the subject of a path', () => {
    TEST_CASES_SUBJECT.map((thisCase) =>
      then(thisCase.description, () => {
        expect(asSubjectOfSnapshot({ path: thisCase.path })).toEqual(
          thisCase.subject,
        );
      }),
    );
  });

  given('[case1b] a flat dir carved by an exclusion', () => {
    const [review, prompt] = asReviewPartitionsFromFlags({
      partition: [
        'review=src/review/*,src/review/__snapshots__/**,!src/review/compile*',
        'prompt=src/review/compile*',
      ],
    });

    when('[t0] a file the exclusion names is asked about', () => {
      const path = 'src/review/compileReviewPrompt.ts';

      then('🔴 the partition that excludes it does not claim it', () => {
        expect(isPathOfPartition({ path, partition: review! })).toEqual(false);
      });

      then('the partition that names it does', () => {
        expect(isPathOfPartition({ path, partition: prompt! })).toEqual(true);
      });
    });

    when('[t1] the snapshot of an excluded test is asked about', () => {
      const path = 'src/review/__snapshots__/compileReviewPrompt.test.ts.snap';

      then(
        '🔴 the exclusion of the test excludes its snapshot, though an inclusion matched the snapshot',
        () => {
          expect(isPathOfPartition({ path, partition: review! })).toEqual(
            false,
          );
          expect(isPathOfPartition({ path, partition: prompt! })).toEqual(true);
        },
      );
    });

    when('[t2] a file the exclusion does not name is asked about', () => {
      then('the carved partition still claims it', () => {
        expect(
          isPathOfPartition({
            path: 'src/review/stepReview.ts',
            partition: review!,
          }),
        ).toEqual(true);
      });
    });

    when('[t3] the whole flat dir is split', () => {
      const split = getAllTargetsByPartition({
        targets: [
          'src/review/stepReview.ts',
          'src/review/compileReviewPrompt.ts',
          'src/review/__snapshots__/compileReviewPrompt.test.ts.snap',
        ],
        partitions: asReviewPartitionsFromFlags({
          partition: [
            'review=src/review/*,src/review/__snapshots__/**,!src/review/compile*',
            'prompt=src/review/compile*',
          ],
        }),
        route: null,
      });

      then(
        '🔴 no file is common — the carve moved the mass, never shared it',
        () => {
          expect(split.common).toEqual([]);
          expect(split.unclaimed).toEqual([]);
          expect(split.partitions.map((one) => one.narrow.length)).toEqual([
            1, 2,
          ]);
        },
      );
    });
  });

  given('[case2] a partition that claims a test by its stem', () => {
    const [cli, route] = asReviewPartitionsFromFlags({
      partition: [
        'cli=src/contract/cli/learn.*',
        'route=src/contract/cli/route*',
      ],
    });

    when('[t0] the snapshot of that test is asked about', () => {
      const path =
        'src/contract/cli/__snapshots__/learn.integration.test.ts.snap';

      then('🔴 the partition of its test claims it', () => {
        expect(isPathOfPartition({ path, partition: cli! })).toEqual(true);
      });

      then('a partition that claims some other test does not', () => {
        expect(isPathOfPartition({ path, partition: route! })).toEqual(false);
      });
    });

    when('[t1] the run is split', () => {
      const split = getAllTargetsByPartition({
        targets: [
          'src/contract/cli/learn.integration.test.ts',
          'src/contract/cli/__snapshots__/learn.integration.test.ts.snap',
          'src/contract/cli/route.ts',
        ],
        partitions: asReviewPartitionsFromFlags({
          partition: [
            'cli=src/contract/cli/learn.*',
            'route=src/contract/cli/route*',
          ],
        }),
        route: null,
      });

      then('🔴 the snapshot is never unclaimed', () => {
        expect(split.unclaimed).toEqual([]);
      });

      then('the snapshot rides narrow with its test, in cli alone', () => {
        const cliShare = split.partitions.find((one) => one.name === 'cli')!;
        expect(cliShare.narrow).toContain(
          'src/contract/cli/__snapshots__/learn.integration.test.ts.snap',
        );
        expect(split.common).toEqual([]);
      });
    });
  });
});
