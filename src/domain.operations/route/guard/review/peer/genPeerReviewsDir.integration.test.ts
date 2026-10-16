import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { genPeerReviewsDir } from './genPeerReviewsDir';

describe('genPeerReviewsDir', () => {
  given('[case1] a route with no peer reviews dir', () => {
    const route = genTempDir({ slug: 'gen-peer-reviews-dir' });

    when('[t0] it is called', () => {
      const result = useThen('it returns the dir', async () =>
        genPeerReviewsDir({ route }),
      );

      then('the dir sits at .reviews/peer under the route', () => {
        expect(result.path).toEqual(path.join(route, '.reviews', 'peer'));
      });

      then('the dir now exists on disk', () => {
        expect(fs.statSync(result.path).isDirectory()).toBe(true);
      });
    });

    when('[t1] it is called again', () => {
      then(
        'it converges — the second call returns the same dir, no EEXIST',
        async () => {
          const first = await genPeerReviewsDir({ route });
          const second = await genPeerReviewsDir({ route });
          expect(second.path).toEqual(first.path);
          expect(fs.statSync(second.path).isDirectory()).toBe(true);
        },
      );
    });
  });

  given('[case2] a peer reviews dir that already holds a given', () => {
    const route = genTempDir({ slug: 'gen-peer-reviews-dir-kept' });
    const dir = path.join(route, '.reviews', 'peer');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'prior.md'), 'prior given\n');

    when('[t0] it is called', () => {
      then('the prior file survives — a findsert never clears', async () => {
        await genPeerReviewsDir({ route });
        expect(fs.readFileSync(path.join(dir, 'prior.md'), 'utf-8')).toEqual(
          'prior given\n',
        );
      });
    });
  });
});
