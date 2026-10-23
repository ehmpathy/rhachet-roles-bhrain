import { given, then, when } from 'test-fns';

import { getOneReviewCountsViaRegex } from '@src/domain.operations/review.tally/getOneReviewCountsViaRegex';

import { genReviewFileHeader } from './genReviewFileHeader';
import { genReviewOutputStdout } from './genReviewOutputStdout';

const PATHS_OF_TEST = {
  logsRelative: '.log/bhrain/review/run-1',
  reviewRelative: '.reviews/peer/report.md',
};

describe('genReviewFileHeader', () => {
  given('[case1] a review that found blockers and nitpicks', () => {
    when('[t0] the header is rendered', () => {
      const header = genReviewFileHeader({
        paths: PATHS_OF_TEST,
        summary: { blockersCount: 3, nitpicksCount: 2 },
      });

      then('the owl is called, and each count carries its marker', () => {
        expect(header).toContain('🦉 needs your talons');
        expect(header).toContain('3 blockers 🔴');
        expect(header).toContain('2 nitpicks 🟠');
      });

      then('it closes with the rule the review body follows', () => {
        expect(header.endsWith('\n\n---\n')).toEqual(true);
      });

      then('it renders whole', () => {
        expect(header).toContain('   └─ summary\n      ├─ 3 blockers 🔴\n');
        expect(header).toMatchSnapshot();
      });
    });
  });

  given('[case2] a review that found naught', () => {
    when('[t0] the header is rendered', () => {
      const header = genReviewFileHeader({
        paths: PATHS_OF_TEST,
        summary: { blockersCount: 0, nitpicksCount: 0 },
      });

      then('it reads all clear', () => {
        expect(header).toContain('✨ all clear');
      });

      then(
        '🔴 a zero count carries NO marker — that would read as an alarm',
        () => {
          expect(header).toContain('0 blockers\n');
          expect(header).not.toContain('🔴');
          expect(header).not.toContain('🟠');
        },
      );

      then('it renders whole', () => {
        expect(header).toContain('      ├─ 0 blockers\n      └─ 0 nitpicks\n');
        expect(header).toMatchSnapshot();
      });
    });
  });

  given('[case3] a review with nitpicks but no blocker', () => {
    when('[t0] the header is rendered', () => {
      const header = genReviewFileHeader({
        paths: PATHS_OF_TEST,
        summary: { blockersCount: 0, nitpicksCount: 4 },
      });

      then(
        '🔴 the file header never reads ALL CLEAR — nitpicks are a note',
        () => {
          expect(header).toContain('🦉 just a few hoots');
          expect(header).not.toContain('✨ all clear');
          expect(header).toContain('4 nitpicks 🟠');
        },
      );

      then(
        '🔴 it grades the review as stdout does — one grade, two voices',
        () => {
          // the terminal and the durable file must agree on the grade; only the
          // phrase for a clean review differs (a file records, a terminal greets)
          const stdout = genReviewOutputStdout({
            tokens: {
              input: null,
              cacheSet: null,
              cacheGet: null,
              output: null,
              total: null,
            },
            cost: { total: null },
            time: { total: '1s' },
            paths: PATHS_OF_TEST,
            summary: { blockersCount: 0, nitpicksCount: 4 },
          });
          expect(stdout).toContain('🦉 just a few hoots');
          expect(header).toContain('🦉 just a few hoots');
        },
      );

      then('it renders whole', () => {
        expect(header).toContain(
          '      ├─ 0 blockers\n      └─ 4 nitpicks 🟠\n',
        );
        expect(header).not.toContain('🦉 needs your talons');
        expect(header).toMatchSnapshot();
      });
    });
  });

  given('[case4] a review that found exactly one of each', () => {
    when('[t0] the header is rendered', () => {
      const header = genReviewFileHeader({
        paths: PATHS_OF_TEST,
        summary: { blockersCount: 1, nitpicksCount: 1 },
      });

      then('🔴 each count agrees with its noun — never `1 blockers`', () => {
        expect(header).toContain('1 blocker 🔴');
        expect(header).toContain('1 nitpick 🟠');
        expect(header).not.toContain('1 blockers');
        expect(header).not.toContain('1 nitpicks');
      });

      then('and the verdict parser still reads the singular', () => {
        // the guard reads this header; a singular it could not parse would
        // turn a real one-blocker review into a malfunction
        expect(getOneReviewCountsViaRegex({ content: header })).toMatchObject({
          detected: true,
          blockers: 1,
          nitpicks: 1,
        });
      });

      then('it renders whole', () => {
        expect(header).toContain(
          '      ├─ 1 blocker 🔴\n      └─ 1 nitpick 🟠\n',
        );
        expect(header.startsWith('🦉 needs your talons\n')).toEqual(true);
        expect(header).toMatchSnapshot();
      });
    });
  });
});
