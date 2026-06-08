import * as path from 'path';
import { given, then, when } from 'test-fns';

import {
  getGuardPeerReviews,
  getGuardSelfReviews,
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
        expect(result.artifacts).toContain('$route/1.vision*.md');
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
      then(
        'returns RouteStoneGuard with reviews converted to structured',
        async () => {
          const result = await parseStoneGuard({ path: guardPath });
          expect(result.path).toEqual(guardPath);
          expect(result.artifacts).toContain('src/**/*'); // matches repo root src/
          // flat reviews are converted to structured at parse time
          const peerReviews = getGuardPeerReviews(result);
          expect(peerReviews).toHaveLength(1);
          expect(peerReviews[0]?.slug).toBeDefined();
          expect(peerReviews[0]?.run).toBeDefined();
          expect(getGuardSelfReviews(result)).toHaveLength(0);
          expect(result.judges).toHaveLength(2);
        },
      );
    });
  });

  given('[case3] a guard file with structured reviews (self + peer)', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.review.self',
      '1.vision.guard',
    );

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with structured reviews', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.path).toEqual(guardPath);
        expect(result.artifacts).toContain('$route/1.vision*.md');
        // all reviews are structured at parse time
        expect(result.reviews.self).toBeDefined();
        expect(result.reviews.peer).toBeDefined();
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
        expect(peerReviews[0]?.run).toContain('rhx review');
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
      'route.review.self',
      '2.research.guard',
    );

    when('[t0] guard is parsed', () => {
      then(
        'returns RouteStoneGuard with flat reviews converted to structured',
        async () => {
          const result = await parseStoneGuard({ path: guardPath });
          // flat reviews are converted to structured at parse time
          const peerReviews = getGuardPeerReviews(result);
          expect(peerReviews).toHaveLength(1);
          expect(peerReviews[0]?.slug).toBeDefined();
          expect(peerReviews[0]?.run).toBeDefined();
          expect(getGuardSelfReviews(result)).toHaveLength(0);
        },
      );
    });
  });

  given('[case5] a guard file with protect directive', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.protected',
      '3.blueprint.guard',
    );

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with protect globs', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.path).toEqual(guardPath);
        expect(result.protect).toHaveLength(2);
        expect(result.protect).toContain('src/**/*.ts');
        expect(result.protect).toContain('src/**/*.tsx');
      });
    });
  });

  given('[case6] a guard file without protect directive', () => {
    const guardPath = path.join(ASSETS_DIR, 'route.guarded', '1.vision.guard');

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with empty protect array', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.protect).toEqual([]);
      });
    });
  });

  given(
    '[case7] a guard file with structured peer reviews (budget + level)',
    () => {
      const guardPath = path.join(
        ASSETS_DIR,
        'route.peer.budget',
        '1.vision.guard',
      );

      when('[t0] guard is parsed', () => {
        then('returns RouteStoneGuard with structured reviews', async () => {
          const result = await parseStoneGuard({ path: guardPath });
          expect(result.path).toEqual(guardPath);
          // all reviews are structured at parse time
          expect(result.reviews.self).toBeDefined();
          expect(result.reviews.peer).toBeDefined();
        });

        then('peer reviews are parsed with structured format', async () => {
          const result = await parseStoneGuard({ path: guardPath });
          const peerReviews = getGuardPeerReviews(result);
          expect(peerReviews).toHaveLength(3);

          // all peer reviews have slug, run, budget, level
          expect(peerReviews.every((r) => r.slug && r.run)).toBe(true);
        });

        then('primo peer review has correct budget and level', async () => {
          const result = await parseStoneGuard({ path: guardPath });
          const peerReviews = getGuardPeerReviews(result);
          const primo = peerReviews.find((r) => r.slug === 'primo');

          expect(primo).toBeDefined();
          expect(primo!.slug).toEqual('primo');
          expect(primo!.run).toContain('rhx review');
          expect(primo!.run).toContain('--brain opus');
          expect(primo!.budget).toEqual(3);
          expect(primo!.level).toEqual(2);
        });

        then('cheapo peer review has correct budget and level', async () => {
          const result = await parseStoneGuard({ path: guardPath });
          const peerReviews = getGuardPeerReviews(result);
          const cheapo = peerReviews.find((r) => r.slug === 'cheapo');

          expect(cheapo).toBeDefined();
          expect(cheapo!.slug).toEqual('cheapo');
          expect(cheapo!.budget).toEqual(10);
          expect(cheapo!.level).toEqual(1);
        });

        then('self reviews are parsed alongside structured peer', async () => {
          const result = await parseStoneGuard({ path: guardPath });
          const selfReviews = getGuardSelfReviews(result);
          expect(selfReviews).toHaveLength(1);
          expect(selfReviews[0]?.slug).toEqual('all-done');
        });
      });
    },
  );
});
