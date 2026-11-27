import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

/**
 * .what = clamp (F19): each booted min keeps every blocker of the `.md` it condenses
 * .why = the min is what boots; a blocker it drops is a law with its teeth pulled, and the pioneer's text dropped
 *        blockers in two mins. a count of `**blocker**` marks fails, since a min may join several items under one
 *        mark, so the clamp counts blocker ITEMS on each side
 */

/** .what = the count of blocker items in a brief: a `blocker:` line's ` · ` items, plus each segment that ends `**blocker**` */
const getCountOfBlockerItems = (input: { text: string }): number =>
  input.text.split('\n').reduce((sum, line) => {
    const lineBare = line.trim();
    if (lineBare.startsWith('blocker:'))
      return sum + lineBare.slice('blocker:'.length).split(' · ').length;
    return (
      sum +
      lineBare.split(' · ').filter((seg) => seg.includes('**blocker**')).length
    );
  }, 0);

const BRIEFS = join(__dirname, 'briefs');

describe('skepticMinsKeepTheirBlockers', () => {
  given('[case1] the skeptic briefs, each min beside its `.md`', () => {
    const mins = readdirSync(BRIEFS).filter((f) => f.endsWith('.md.min'));
    const pairs = mins
      .map((min) => ({ min, md: min.replace(/\.min$/, '') }))
      .filter((pair) => existsSync(join(BRIEFS, pair.md)));

    when('[t0] the blocker items of each pair are counted', () => {
      const short = pairs
        .map((pair) => ({
          min: pair.min,
          countMin: getCountOfBlockerItems({
            text: readFileSync(join(BRIEFS, pair.min), 'utf8'),
          }),
          countMd: getCountOfBlockerItems({
            text: readFileSync(join(BRIEFS, pair.md), 'utf8'),
          }),
        }))
        .filter((row) => row.countMin < row.countMd);
      then(
        'there are pairs to count: a glob that matched naught passes naught',
        () => {
          expect(pairs.length).toBeGreaterThan(0);
        },
      );
      then('no min holds fewer blocker items than its `.md`', () => {
        expect(short).toEqual([]);
      });
    });
  });
});
