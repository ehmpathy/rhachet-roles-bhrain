import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import { getAllRouteStoneGuardReviewPeerMeters } from './getAllRouteStoneGuardReviewPeerMeters';

describe('getAllRouteStoneGuardReviewPeerMeters', () => {
  given('[case1] no reviewPeerMeters.jsonl file', () => {
    const tempDir = path.join(os.tmpdir(), `test-meters-empty-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] file is absent', () => {
      then('returns empty array', async () => {
        const meters = await getAllRouteStoneGuardReviewPeerMeters({
          route: tempDir,
          stone: '1.vision',
        });
        expect(meters).toEqual([]);
      });
    });
  });

  given('[case2] empty reviewPeerMeters.jsonl file', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-meters-emptyfile-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
        '',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] file is empty', () => {
      then('returns empty array', async () => {
        const meters = await getAllRouteStoneGuardReviewPeerMeters({
          route: tempDir,
          stone: '1.vision',
        });
        expect(meters).toEqual([]);
      });
    });
  });

  given(
    '[case3] reviewPeerMeters.jsonl with multiple entries for same slug',
    () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-meters-lastwin-${Date.now()}`,
      );

      beforeEach(async () => {
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        const content =
          [
            JSON.stringify({
              stone: '1.vision',
              reviewer: { slug: 'cheapo' },
              rounds: 1,
            }),
            JSON.stringify({
              stone: '1.vision',
              reviewer: { slug: 'cheapo' },
              rounds: 2,
            }),
            JSON.stringify({
              stone: '1.vision',
              reviewer: { slug: 'cheapo' },
              rounds: 3,
            }),
          ].join('\n') + '\n';
        await fs.writeFile(
          path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
          content,
        );
      });

      afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      when('[t0] same slug has multiple entries', () => {
        then('returns only the latest entry', async () => {
          const meters = await getAllRouteStoneGuardReviewPeerMeters({
            route: tempDir,
            stone: '1.vision',
          });
          expect(meters).toHaveLength(1);
          expect(meters[0]).toBeInstanceOf(RouteStoneGuardReviewPeerMeter);
          expect(meters[0]!.reviewer.slug).toEqual('cheapo');
          expect(meters[0]!.rounds).toEqual(3);
        });
      });
    },
  );

  given('[case4] reviewPeerMeters.jsonl with multiple slugs', () => {
    const tempDir = path.join(os.tmpdir(), `test-meters-multi-${Date.now()}`);

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({
            stone: '1.vision',
            reviewer: { slug: 'cheapo' },
            rounds: 2,
          }),
          JSON.stringify({
            stone: '1.vision',
            reviewer: { slug: 'primo' },
            rounds: 1,
          }),
          JSON.stringify({
            stone: '1.vision',
            reviewer: { slug: 'cheapo' },
            rounds: 5,
          }),
          JSON.stringify({
            stone: '1.vision',
            reviewer: { slug: 'midtier' },
            rounds: 3,
          }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] multiple slugs each with own history', () => {
      then('returns correct current state per slug', async () => {
        const meters = await getAllRouteStoneGuardReviewPeerMeters({
          route: tempDir,
          stone: '1.vision',
        });

        expect(meters).toHaveLength(3);

        const bySlug = new Map<string, number>();
        for (const m of meters) {
          bySlug.set(m.reviewer.slug, m.rounds);
        }

        expect(bySlug.get('cheapo')).toEqual(5);
        expect(bySlug.get('primo')).toEqual(1);
        expect(bySlug.get('midtier')).toEqual(3);
      });
    });
  });

  given(
    '[case5] reviewPeerMeters.jsonl with same slug across different stones',
    () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-meters-perstone-${Date.now()}`,
      );

      beforeEach(async () => {
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        const content =
          [
            // primo on stone 1.vision consumed 3 rounds
            JSON.stringify({
              stone: '1.vision',
              reviewer: { slug: 'primo' },
              rounds: 1,
            }),
            JSON.stringify({
              stone: '1.vision',
              reviewer: { slug: 'primo' },
              rounds: 2,
            }),
            JSON.stringify({
              stone: '1.vision',
              reviewer: { slug: 'primo' },
              rounds: 3,
            }),
            // primo on stone 2.criteria has fresh budget (only 1 round)
            JSON.stringify({
              stone: '2.criteria',
              reviewer: { slug: 'primo' },
              rounds: 1,
            }),
          ].join('\n') + '\n';
        await fs.writeFile(
          path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
          content,
        );
      });

      afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      when('[t0] same reviewer on different stones', () => {
        then('budget is tracked per stone', async () => {
          // query for 1.vision
          const metersStone1 = await getAllRouteStoneGuardReviewPeerMeters({
            route: tempDir,
            stone: '1.vision',
          });
          expect(metersStone1).toHaveLength(1);
          expect(metersStone1[0]!.reviewer.slug).toEqual('primo');
          expect(metersStone1[0]!.rounds).toEqual(3);

          // query for 2.criteria — separate budget
          const metersStone2 = await getAllRouteStoneGuardReviewPeerMeters({
            route: tempDir,
            stone: '2.criteria',
          });
          expect(metersStone2).toHaveLength(1);
          expect(metersStone2[0]!.reviewer.slug).toEqual('primo');
          expect(metersStone2[0]!.rounds).toEqual(1);
        });
      });

      when('[t1] query for stone with no meters', () => {
        then('returns empty array', async () => {
          const metersStone3 = await getAllRouteStoneGuardReviewPeerMeters({
            route: tempDir,
            stone: '3.blueprint',
          });
          expect(metersStone3).toEqual([]);
        });
      });
    },
  );
});
