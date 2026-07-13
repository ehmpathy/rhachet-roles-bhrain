import * as fs from 'fs/promises';
import * as os from 'os';
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

  given('[case7] a guard file with structured peer reviews (timeout)', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.peer.timeout',
      '1.vision.guard',
    );

    when('[t0] guard is parsed', () => {
      then('peer reviews with quoted timeout are parsed', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const peerReviews = getGuardPeerReviews(result);
        const quickReview = peerReviews.find(
          (r) => r.slug === 'quick-with-quotes',
        );

        expect(quickReview).toBeDefined();
        expect(quickReview!.timeout).toEqual('PT30S');
      });

      then('peer reviews with unquoted timeout are parsed', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const peerReviews = getGuardPeerReviews(result);
        const slowReview = peerReviews.find(
          (r) => r.slug === 'slow-without-quotes',
        );

        expect(slowReview).toBeDefined();
        expect(slowReview!.timeout).toEqual('PT90S');
      });

      then('peer reviews without timeout have undefined', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const peerReviews = getGuardPeerReviews(result);
        const defaultReview = peerReviews.find(
          (r) => r.slug === 'default-timeout',
        );

        expect(defaultReview).toBeDefined();
        expect(defaultReview!.timeout).toBeUndefined();
      });
    });
  });

  given(
    '[case8] a guard file with structured peer reviews (budget + level)',
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

  given('[case6] flat reviews with duplicate slugs', () => {
    when('[t0] multiple peer reviews derive same slug from cmd', () => {
      then('slugs are standardized to be unique via .N suffix', async () => {
        // create temp guard with duplicate slugs
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'test-guard-dup-slug-'),
        );
        const guardFile = path.join(tempDir, '1.test.guard');
        // all three commands start with $rhx, so derived slugs would collide
        await fs.writeFile(
          guardFile,
          `artifacts:
  - src/**/*
reviews:
  - $rhx --rules briefs/arch.md
  - $rhx --rules briefs/ergo.md
  - $rhx --rules briefs/mech.md
`,
        );

        const result = await parseStoneGuard({ path: guardFile });
        const peerReviews = getGuardPeerReviews(result);

        expect(peerReviews).toHaveLength(3);
        // each slug should have .N suffix since they all derived from $rhx
        expect(peerReviews[0]?.slug).toEqual('$rhx.1');
        expect(peerReviews[1]?.slug).toEqual('$rhx.2');
        expect(peerReviews[2]?.slug).toEqual('$rhx.3');
      });

      then('unique slugs are left as-is', async () => {
        // create temp guard with unique slugs
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'test-guard-unique-slug-'),
        );
        const guardFile = path.join(tempDir, '1.test.guard');
        await fs.writeFile(
          guardFile,
          `artifacts:
  - src/**/*
reviews:
  - arch-review --rules briefs/arch.md
  - ergo-review --rules briefs/ergo.md
  - mech-review --rules briefs/mech.md
`,
        );

        const result = await parseStoneGuard({ path: guardFile });
        const peerReviews = getGuardPeerReviews(result);

        expect(peerReviews).toHaveLength(3);
        // unique slugs should not have suffix
        expect(peerReviews[0]?.slug).toEqual('arch-review');
        expect(peerReviews[1]?.slug).toEqual('ergo-review');
        expect(peerReviews[2]?.slug).toEqual('mech-review');
      });
    });
  });

  given(
    '[case-slug-uniqueness] a slug shared by a self AND a peer reviewer',
    () => {
      when('[t0] guard is parsed', () => {
        then(
          'throws a loud BadRequestError that names the duplicate slug',
          async () => {
            const tempDir = await fs.mkdtemp(
              path.join(os.tmpdir(), 'test-guard-slug-collision-'),
            );
            const guardFile = path.join(tempDir, '1.test.guard');
            await fs.writeFile(
              guardFile,
              `reviews:
  self:
    - slug: architect
      say: "review it"
  peer:
    - slug: architect
      run: rhx review --rules briefs/arch.md
judges:
  - rhx judge --mechanism reviewed?
`,
            );

            await expect(parseStoneGuard({ path: guardFile })).rejects.toThrow(
              'architect',
            );
          },
        );
      });
    },
  );

  given('[case-slug-distinct] distinct self + peer slugs', () => {
    when('[t0] guard is parsed', () => {
      then('parses without error', async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'test-guard-slug-distinct-'),
        );
        const guardFile = path.join(tempDir, '1.test.guard');
        await fs.writeFile(
          guardFile,
          `reviews:
  self:
    - slug: reflect
      say: "review it"
  peer:
    - slug: architect
      run: rhx review --rules briefs/arch.md
judges:
  - rhx judge --mechanism reviewed?
`,
        );

        const result = await parseStoneGuard({ path: guardFile });
        expect(getGuardSelfReviews(result)).toHaveLength(1);
        expect(getGuardPeerReviews(result)).toHaveLength(1);
      });
    });
  });
});
