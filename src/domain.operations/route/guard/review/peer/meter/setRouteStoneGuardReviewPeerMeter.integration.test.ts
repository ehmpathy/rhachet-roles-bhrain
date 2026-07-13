import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import { getAllRouteStoneGuardReviewPeerMeters } from './getAllRouteStoneGuardReviewPeerMeters';
import { setRouteStoneGuardReviewPeerMeter } from './setRouteStoneGuardReviewPeerMeter';

describe('setRouteStoneGuardReviewPeerMeter', () => {
  given('[case1] no prior reviewPeerMeters.jsonl file', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-meter-set-create-${Date.now()}`,
    );

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] meter is set', () => {
      const result = useThen('set succeeds', async () => {
        const meter = new RouteStoneGuardReviewPeerMeter({
          stone: '1.vision',
          reviewer: { slug: 'cheapo' },
          rounds: 1,
        });
        return setRouteStoneGuardReviewPeerMeter({
          meter,
          route: tempDir,
        });
      });

      then('creates file if absent', async () => {
        const metersPath = result.path;
        const fileFound = await fs
          .access(metersPath)
          .then(() => true)
          .catch(() => false);
        expect(fileFound).toBe(true);
      });

      then('meter is readable via getAll', async () => {
        const meters = await getAllRouteStoneGuardReviewPeerMeters({
          route: tempDir,
          stone: '1.vision',
        });
        expect(meters).toHaveLength(1);
        expect(meters[0]!.reviewer.slug).toEqual('cheapo');
        expect(meters[0]!.rounds).toEqual(1);
      });
    });
  });

  given('[case2] prior reviewPeerMeters.jsonl with same slug', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-meter-set-update-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        JSON.stringify({
          stone: '1.vision',
          reviewer: { slug: 'cheapo' },
          rounds: 3,
        }) + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
        content,
      );
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] meter is set for same slug', () => {
      useThen('set succeeds', async () => {
        const meter = new RouteStoneGuardReviewPeerMeter({
          stone: '1.vision',
          reviewer: { slug: 'cheapo' },
          rounds: 5,
        });
        return setRouteStoneGuardReviewPeerMeter({
          meter,
          route: tempDir,
        });
      });

      then('updates meter by slug (last entry wins)', async () => {
        const meters = await getAllRouteStoneGuardReviewPeerMeters({
          route: tempDir,
          stone: '1.vision',
        });
        expect(meters).toHaveLength(1);
        expect(meters[0]!.reviewer.slug).toEqual('cheapo');
        expect(meters[0]!.rounds).toEqual(5);
      });

      then('appends to file (append-only)', async () => {
        const content = await fs.readFile(
          path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
          'utf-8',
        );
        const lines = content.split('\n').filter(Boolean);
        expect(lines).toHaveLength(2);
      });
    });
  });

  given('[case3] prior reviewPeerMeters.jsonl with different slug', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-meter-set-append-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        JSON.stringify({
          stone: '1.vision',
          reviewer: { slug: 'cheapo' },
          rounds: 3,
        }) + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
        content,
      );
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] meter is set for new slug', () => {
      useThen('set succeeds', async () => {
        const meter = new RouteStoneGuardReviewPeerMeter({
          stone: '1.vision',
          reviewer: { slug: 'primo' },
          rounds: 1,
        });
        return setRouteStoneGuardReviewPeerMeter({
          meter,
          route: tempDir,
        });
      });

      then('appends new meter', async () => {
        const meters = await getAllRouteStoneGuardReviewPeerMeters({
          route: tempDir,
          stone: '1.vision',
        });
        expect(meters).toHaveLength(2);

        const bySlug = new Map<string, number>();
        for (const m of meters) {
          bySlug.set(m.reviewer.slug, m.rounds);
        }

        expect(bySlug.get('cheapo')).toEqual(3);
        expect(bySlug.get('primo')).toEqual(1);
      });
    });
  });
});
