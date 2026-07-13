import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import { getOneRouteStoneGuardReviewPeerMeter } from './getOneRouteStoneGuardReviewPeerMeter';

describe('getOneRouteStoneGuardReviewPeerMeter', () => {
  given('[case1] no reviewPeerMeters.jsonl file', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-meter-one-empty-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] file is absent', () => {
      then('returns null', async () => {
        const meter = await getOneRouteStoneGuardReviewPeerMeter({
          slug: 'cheapo',
          stone: '1.vision',
          route: tempDir,
        });
        expect(meter).toBeNull();
      });
    });
  });

  given(
    '[case2] reviewPeerMeters.jsonl with multiple entries for same slug',
    () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-meter-one-multi-${Date.now()}`,
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
              rounds: 5,
            }),
            JSON.stringify({
              stone: '1.vision',
              reviewer: { slug: 'primo' },
              rounds: 2,
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

      when('[t0] queried for slug with multiple entries', () => {
        then('returns latest entry for slug', async () => {
          const meter = await getOneRouteStoneGuardReviewPeerMeter({
            slug: 'cheapo',
            stone: '1.vision',
            route: tempDir,
          });
          expect(meter).toBeInstanceOf(RouteStoneGuardReviewPeerMeter);
          expect(meter?.reviewer.slug).toEqual('cheapo');
          expect(meter?.rounds).toEqual(5);
        });
      });

      when('[t1] queried for slug that does not match any', () => {
        then('returns null', async () => {
          const meter = await getOneRouteStoneGuardReviewPeerMeter({
            slug: 'nonexistent',
            stone: '1.vision',
            route: tempDir,
          });
          expect(meter).toBeNull();
        });
      });

      when('[t2] queried for slug that has only one entry', () => {
        then('returns that entry', async () => {
          const meter = await getOneRouteStoneGuardReviewPeerMeter({
            slug: 'primo',
            stone: '1.vision',
            route: tempDir,
          });
          expect(meter).toBeInstanceOf(RouteStoneGuardReviewPeerMeter);
          expect(meter?.reviewer.slug).toEqual('primo');
          expect(meter?.rounds).toEqual(2);
        });
      });
    },
  );
});
