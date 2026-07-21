import { given, then, when } from 'test-fns';

import { getReviewDisplayPath } from '@src/domain.operations/review/getReviewDisplayPath';

describe('getReviewDisplayPath', () => {
  given('[case1] an output path inside the cwd', () => {
    when('[t0] the display path is derived', () => {
      then('it returns the cwd-relative form', () => {
        const display = getReviewDisplayPath({
          cwd: '/home/user/repo',
          outputAbsolute: '/home/user/repo/.reviews/peer/report.md',
        });
        expect(display).toEqual('.reviews/peer/report.md');
      });
    });
  });

  given('[case2] an output path outside the cwd', () => {
    when('[t0] the display path is derived', () => {
      then('it returns the absolute path, never a `..` crawl', () => {
        const display = getReviewDisplayPath({
          cwd: '/home/user/repo',
          outputAbsolute: '/home/user/other/report.md',
        });
        expect(display).toEqual('/home/user/other/report.md');
        expect(display.startsWith('..')).toBe(false);
      });
    });
  });

  given('[case3] the output path is the cwd itself', () => {
    when('[t0] the display path is derived', () => {
      then('it returns the relative form (not a `..` escape)', () => {
        const display = getReviewDisplayPath({
          cwd: '/home/user/repo',
          outputAbsolute: '/home/user/repo/out.md',
        });
        expect(display).toEqual('out.md');
      });
    });
  });
});
