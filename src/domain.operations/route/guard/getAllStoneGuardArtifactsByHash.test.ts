import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getAllStoneGuardArtifactsByHash } from './getAllStoneGuardArtifactsByHash';

describe('getAllStoneGuardArtifactsByHash', () => {
  given('[case1] route with no .route directory', () => {
    const routePath = path.join(os.tmpdir(), `test-no-route-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(routePath, '1.vision.stone'),
      guard: null,
    });

    when('[t0] artifacts are fetched', () => {
      then('returns empty arrays', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: 'abc123',
          route: routePath,
        });
        expect(result.reviews).toHaveLength(0);
        expect(result.judges).toHaveLength(0);
      });
    });
  });

  given('[case2] route with prior review and judge files', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-guard-artifacts-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');
    const testHash = 'abc123def456';
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(tempDir, '1.vision.stone'),
      guard: null,
    });

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });

      // create review file
      await fs.writeFile(
        path.join(routeDir, `1.vision.guard.review.i1.${testHash}.r1.md`),
        '---\nblockers: 2\nnitpicks: 3\n---\nreview content',
      );

      // create judge file
      await fs.writeFile(
        path.join(routeDir, `1.vision.guard.judge.i1.${testHash}.j1.md`),
        '---\npassed: false\nreason: blockers found\n---\njudge content',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] artifacts are fetched for the hash', () => {
      then('returns review artifacts', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: testHash,
          route: tempDir,
        });
        expect(result.reviews).toHaveLength(1);
        expect(result.reviews[0]?.blockers).toEqual(2);
        expect(result.reviews[0]?.nitpicks).toEqual(3);
      });

      then('returns judge artifacts', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: testHash,
          route: tempDir,
        });
        expect(result.judges).toHaveLength(1);
        expect(result.judges[0]?.passed).toEqual(false);
        expect(result.judges[0]?.reason).toEqual('blockers found');
      });
    });

    when('[t1] artifacts are fetched for a different hash', () => {
      then('returns empty arrays', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: 'different-hash',
          route: tempDir,
        });
        expect(result.reviews).toHaveLength(0);
        expect(result.judges).toHaveLength(0);
      });
    });
  });
});
