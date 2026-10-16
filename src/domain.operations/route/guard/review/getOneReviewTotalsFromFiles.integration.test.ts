import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { getOneReviewTotalsFromFiles } from './getOneReviewTotalsFromFiles';

/**
 * .what = writes one review file per body into a temp dir
 * .why = the tally reads the disk; each case varies only the bodies it reads
 */
const genReviewFiles = (input: {
  slug: string;
  bodies: string[];
}): string[] => {
  const dir = genTempDir({ slug: input.slug });
  return input.bodies.map((body, index) => {
    const filePath = path.join(dir, `review.r${index}.md`);
    fs.writeFileSync(filePath, body);
    return filePath;
  });
};

describe('getOneReviewTotalsFromFiles', () => {
  given('[case1] readable reviews only', () => {
    when('[t0] the tally is read', () => {
      const totals = useThen('it succeeds', async () =>
        getOneReviewTotalsFromFiles({
          reviewFiles: genReviewFiles({
            slug: 'review-totals-readable',
            bodies: ['0 blockers\n0 nitpicks\n', '2 blockers\n3 nitpicks\n'],
          }),
        }),
      );

      then('it sums each count', () => {
        expect(totals).toEqual({ totalBlockers: 2, totalNitpicks: 3 });
      });
    });
  });

  // .note = clamp: the tally once folded an unreadable count to 0, the value a clean review
  //         carries, so a stone could pass on a verdict nobody read
  given('[case2] one review whose verdict cannot be read', () => {
    when('[t0] the tally is read', () => {
      const totals = useThen('it succeeds', async () =>
        getOneReviewTotalsFromFiles({
          reviewFiles: genReviewFiles({
            slug: 'review-totals-unreadable',
            bodies: ['0 blockers\n0 nitpicks\n', 'looks solid, ship it\n'],
          }),
        }),
      );

      then(
        'the unreadable review gates as one blocker, never a clean 0',
        () => {
          expect(totals).toEqual({ totalBlockers: 1, totalNitpicks: 0 });
        },
      );
    });
  });

  given('[case3] a review file a rewind deleted after enumeration', () => {
    when('[t0] the tally is read', () => {
      const totals = useThen('it succeeds', async () => {
        const [kept, deleted] = genReviewFiles({
          slug: 'review-totals-deleted',
          bodies: ['1 blocker\n1 nitpick\n', '5 blockers\n0 nitpicks\n'],
        });
        fs.rmSync(deleted!);
        return getOneReviewTotalsFromFiles({ reviewFiles: [kept!, deleted!] });
      });

      then('the deleted file contributes naught', () => {
        expect(totals).toEqual({ totalBlockers: 1, totalNitpicks: 1 });
      });
    });
  });
});
