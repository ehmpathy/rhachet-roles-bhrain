import * as path from 'path';
import { given, then, when } from 'test-fns';

import {
  getGuardPeerReviews,
  getGuardSelfReviews,
  isReviewsStructured,
} from '@src/domain.objects/Driver/RouteStoneGuard';

import { parseStoneGuard } from './parseStoneGuard';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

describe('parseStoneGuard', () => {
  given('[case1] a guard file with artifacts and judges (no reviews)', () => {
    const guardPath = path.join(ASSETS_DIR, 'route.guarded', '1.vision.guard');

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with artifacts and judges', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.path).toEqual(guardPath);
        expect(result.artifacts).toContain('1.vision*.md');
        expect(getGuardPeerReviews(result)).toHaveLength(0);
        expect(result.judges).toHaveLength(1);
      });
    });
  });

  given('[case2] a guard file with flat reviews array', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.guarded',
      '5.implement.guard',
    );

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with reviews as flat array', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.path).toEqual(guardPath);
        expect(result.artifacts).toContain('src/**/*.ts');
        expect(isReviewsStructured(result.reviews)).toBe(false);
        expect(getGuardPeerReviews(result)).toHaveLength(1);
        expect(getGuardSelfReviews(result)).toHaveLength(0);
        expect(result.judges).toHaveLength(2);
      });
    });
  });

  given('[case3] a guard file with structured reviews (self + peer)', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.self-review',
      '1.vision.guard',
    );

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with structured reviews', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.path).toEqual(guardPath);
        expect(result.artifacts).toContain('1.vision*.md');
        expect(isReviewsStructured(result.reviews)).toBe(true);
      });

      then('self reviews are parsed with multiline say', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const selfReviews = getGuardSelfReviews(result);
        expect(selfReviews).toHaveLength(2);
        expect(selfReviews[0]?.slug).toEqual('all-done');
        expect(selfReviews[0]?.say).toContain(
          'did you complete all that was requested',
        );
      });

      then('self reviews with @path reference are expanded', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const selfReviews = getGuardSelfReviews(result);
        expect(selfReviews[1]?.slug).toEqual('tests-pass');
        expect(selfReviews[1]?.say).toContain('do all tests pass');
      });

      then('peer reviews are parsed', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const peerReviews = getGuardPeerReviews(result);
        expect(peerReviews).toHaveLength(1);
        expect(peerReviews[0]).toContain('rhx review');
      });

      then('judges are parsed', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.judges).toHaveLength(2);
      });
    });
  });

  given('[case4] a guard file with flat reviews (backwards compat)', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.self-review',
      '2.research.guard',
    );

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with flat reviews array', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(isReviewsStructured(result.reviews)).toBe(false);
        expect(getGuardPeerReviews(result)).toHaveLength(1);
        expect(getGuardSelfReviews(result)).toHaveLength(0);
      });
    });
  });
});
