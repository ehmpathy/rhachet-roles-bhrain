import * as path from 'path';
import { given, then, when } from 'test-fns';

import {
  asStonePromiseFilenameGlob,
  asStonePromiseGlob,
  asStonePromiseSlug,
  getStonePromisePaths,
} from './getStonePromisePaths';

describe('getStonePromisePaths', () => {
  given('[case1] a stone and a slug', () => {
    when('[t0] the paths are computed', () => {
      then('the promise sits under the .route dir', () => {
        const result = getStonePromisePaths({
          stone: '1.vision',
          slug: 'all-done',
          route: '/tmp/route',
        });
        expect(result.filename).toEqual('1.vision.guard.promise.all-done.md');
        expect(result.promisePath).toEqual(
          path.join(
            '/tmp/route',
            '.route',
            '1.vision.guard.promise.all-done.md',
          ),
        );
      });
    });
  });

  given('[case2] the template and the parser', () => {
    // 🔴 the clamp is aimed at the AGREEMENT, never at either value. a hand-typed
    //    filename beside a hand-typed regex is two guesses that can drift apart in
    //    silence; a round trip through both can only pass if they agree
    when('[t0] a filename is minted and parsed back', () => {
      then('every slug shape round trips', () => {
        for (const slug of ['all-done', 'i1.p1', 'has-grounded-in-reality']) {
          const { filename } = getStonePromisePaths({
            stone: '1.vision',
            slug,
            route: '/tmp/route',
          });
          expect(asStonePromiseSlug({ filename })).toEqual(slug);
        }
      });
    });

    when('[t1] a filename of another kind is parsed', () => {
      then('it yields null rather than a bogus slug', () => {
        expect(
          asStonePromiseSlug({
            filename: '1.vision.guard.selfreview.abc.triggered.since',
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case3] the two globs over one stone', () => {
    // 🔴 the clamp holds each glob against the TEMPLATE rather than against a literal:
    //    a glob that stops to match the filename its own writer mints is the silent-drop
    //    failure this operation exists to make impossible
    const { filename } = getStonePromisePaths({
      stone: '1.vision',
      slug: 'all-done',
      route: '/tmp/route',
    });

    when('[t0] the route-relative glob is taken', () => {
      then('it prefixes the same template', () => {
        expect(asStonePromiseGlob({ stone: '1.vision' })).toEqual(
          `.route/${filename.replace('all-done', '*')}`,
        );
      });
    });

    when('[t1] the dir-relative glob is taken', () => {
      then('it is the same template, unprefixed', () => {
        expect(asStonePromiseFilenameGlob({ stone: '1.vision' })).toEqual(
          filename.replace('all-done', '*'),
        );
      });
    });

    when('[t2] the two globs are compared', () => {
      then('they differ by the .route prefix alone', () => {
        expect(asStonePromiseGlob({ stone: '1.vision' })).toEqual(
          `.route/${asStonePromiseFilenameGlob({ stone: '1.vision' })}`,
        );
      });
    });
  });

  given('[case4] a stone whose name carries a dot', () => {
    when('[t0] the glob is taken', () => {
      then('the stone name survives intact', () => {
        expect(
          asStonePromiseGlob({ stone: '5.1.execution.from_vision' }),
        ).toEqual('.route/5.1.execution.from_vision.guard.promise.*.md');
      });
    });
  });
});
