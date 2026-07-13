import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import { getAllRouteStoneGuardReviewPeerMeters } from './getAllRouteStoneGuardReviewPeerMeters';
import { resetRouteStoneGuardReviewPeerMeters } from './resetRouteStoneGuardReviewPeerMeters';
import { setRouteStoneGuardReviewPeerMeter } from './setRouteStoneGuardReviewPeerMeter';

describe('resetRouteStoneGuardReviewPeerMeters', () => {
  given('[case1] no meters for stone', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-meter-reset-empty-${Date.now()}`,
    );

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] reset is called', () => {
      const result = useThen('reset succeeds', async () => {
        return resetRouteStoneGuardReviewPeerMeters({
          stone: '1.vision',
          route: tempDir,
        });
      });

      then('returns reset: 0', () => {
        expect(result.reset).toEqual(0);
      });
    });
  });

  given('[case2] stone has meters with rounds consumed', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-meter-reset-full-${Date.now()}`,
    );

    beforeAll(async () => {
      // create meters for 1.vision with rounds consumed
      await setRouteStoneGuardReviewPeerMeter({
        meter: new RouteStoneGuardReviewPeerMeter({
          stone: '1.vision',
          reviewer: { slug: 'cheapo' },
          rounds: 3,
        }),
        route: tempDir,
      });
      await setRouteStoneGuardReviewPeerMeter({
        meter: new RouteStoneGuardReviewPeerMeter({
          stone: '1.vision',
          reviewer: { slug: 'primo' },
          rounds: 2,
        }),
        route: tempDir,
      });
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] before reset', () => {
      then('meters have rounds consumed', async () => {
        const meters = await getAllRouteStoneGuardReviewPeerMeters({
          route: tempDir,
          stone: '1.vision',
        });
        expect(meters).toHaveLength(2);
        const bySlug = new Map(meters.map((m) => [m.reviewer.slug, m.rounds]));
        expect(bySlug.get('cheapo')).toEqual(3);
        expect(bySlug.get('primo')).toEqual(2);
      });
    });

    when('[t1] reset is called', () => {
      const result = useThen('reset succeeds', async () => {
        return resetRouteStoneGuardReviewPeerMeters({
          stone: '1.vision',
          route: tempDir,
        });
      });

      then('returns reset: 2', () => {
        expect(result.reset).toEqual(2);
      });

      then('meters are reset to 0 rounds', async () => {
        const meters = await getAllRouteStoneGuardReviewPeerMeters({
          route: tempDir,
          stone: '1.vision',
        });
        expect(meters).toHaveLength(2);
        const bySlug = new Map(meters.map((m) => [m.reviewer.slug, m.rounds]));
        expect(bySlug.get('cheapo')).toEqual(0);
        expect(bySlug.get('primo')).toEqual(0);
      });
    });
  });

  given('[case3] route has meters for multiple stones', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-meter-reset-multi-${Date.now()}`,
    );

    beforeAll(async () => {
      // meters for 1.vision
      await setRouteStoneGuardReviewPeerMeter({
        meter: new RouteStoneGuardReviewPeerMeter({
          stone: '1.vision',
          reviewer: { slug: 'primo' },
          rounds: 3,
        }),
        route: tempDir,
      });
      // meters for 2.criteria
      await setRouteStoneGuardReviewPeerMeter({
        meter: new RouteStoneGuardReviewPeerMeter({
          stone: '2.criteria',
          reviewer: { slug: 'primo' },
          rounds: 2,
        }),
        route: tempDir,
      });
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] reset is called for 1.vision only', () => {
      useThen('reset succeeds', async () => {
        return resetRouteStoneGuardReviewPeerMeters({
          stone: '1.vision',
          route: tempDir,
        });
      });

      then('1.vision meters reset to 0', async () => {
        const meters = await getAllRouteStoneGuardReviewPeerMeters({
          route: tempDir,
          stone: '1.vision',
        });
        expect(meters).toHaveLength(1);
        expect(meters[0]!.rounds).toEqual(0);
      });

      then('2.criteria meters unchanged', async () => {
        const meters = await getAllRouteStoneGuardReviewPeerMeters({
          route: tempDir,
          stone: '2.criteria',
        });
        expect(meters).toHaveLength(1);
        expect(meters[0]!.rounds).toEqual(2);
      });
    });
  });
});
