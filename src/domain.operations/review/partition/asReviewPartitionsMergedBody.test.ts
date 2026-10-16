import { given, then, when } from 'test-fns';

import { asReviewPartitionsMergedBody } from './asReviewPartitionsMergedBody';

describe('asReviewPartitionsMergedBody', () => {
  given('[case1] two partitions that share common targets', () => {
    const body = asReviewPartitionsMergedBody({
      sections: [
        {
          name: 'review',
          targetsCount: 40,
          commonCount: 3,
          commonGradedCount: 3,
          reviewRelative: '.behavior/x/.reviews/peer/.partition=1.review/r.md',
          formatted: '# blocker.1\n\nan absent guard\n\n',
        },
        {
          name: 'route',
          targetsCount: 7,
          commonCount: 3,
          commonGradedCount: 0,
          reviewRelative: '.behavior/x/.reviews/peer/.partition=2.route/r.md',
          formatted: 'no concerns',
        },
        {
          name: 'utils',
          targetsCount: 2,
          commonCount: 0,
          commonGradedCount: 0,
          reviewRelative: null,
          formatted: 'the partition failed: timeout',
        },
      ],
    });

    when('[t0] the merged body is rendered', () => {
      then('each partition heads its own section, in run order', () => {
        expect(body.indexOf('## partition: review')).toBeLessThan(
          body.indexOf('## partition: route'),
        );
      });

      then(
        'each section names how many common targets it graded and how many it read as context',
        () => {
          expect(body).toContain(
            '- targets: 40 narrow targets + 3 common targets (3 graded here, 0 read as context)',
          );
          expect(body).toContain(
            '- targets: 7 narrow targets + 3 common targets (0 graded here, 3 read as context)',
          );
        },
      );

      then(
        'a partition with no common targets shows its narrow count alone',
        () => {
          expect(body).toContain('- targets: 2 narrow targets\n');
        },
      );

      then('the count carries its noun, as the split announce names it', () => {
        expect(body).not.toMatch(/\d narrow(?! target)/);
      });

      then(
        'a failed partition keeps its section, its report marked absent',
        () => {
          expect(body).toContain('(none — the partition failed; see below)');
        },
      );

      then('the body matches the snapshot', () => {
        expect(body).toContain('## partition: utils');
        expect(body).toContain(
          '- review: .behavior/x/.reviews/peer/.partition=1.review/r.md',
        );
        expect(body).toMatchSnapshot();
      });
    });
  });

  given('[case2] a partition with exactly one narrow target', () => {
    const body = asReviewPartitionsMergedBody({
      sections: [
        {
          name: 'solo',
          targetsCount: 1,
          commonCount: 0,
          commonGradedCount: 0,
          reviewRelative: '.behavior/x/.reviews/peer/.partition=1.solo/r.md',
          formatted: 'no concerns',
        },
      ],
    });

    when('[t0] the merged body is rendered', () => {
      then('the noun agrees with the count', () => {
        expect(body).toContain('- targets: 1 narrow target\n');
      });

      then('the body matches the snapshot', () => {
        expect(body).toContain('## partition: solo');
        expect(body).toMatchSnapshot();
      });
    });
  });
});
