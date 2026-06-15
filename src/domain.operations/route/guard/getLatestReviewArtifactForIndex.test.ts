import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getLatestReviewArtifactForIndex } from './getLatestReviewArtifactForIndex';

describe('getLatestReviewArtifactForIndex', () => {
  given('[case1] route with review files for different iterations', () => {
    const scene = useBeforeAll(async () => {
      // create temp route dir
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-route-'));
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create review files for different iterations
      const reviewContentI1 = `├─ stdout
│  ├─
│  │
│  │  🦉 needs your talons
│  │     └─ summary
│  │        ├─ 2 blockers 🔴
│  │        └─ 1 nitpick 🟠
│  │
│  └─
├─ stderr
│  ├─
│  │
│  └─`;

      const reviewContentI2 = `├─ stdout
│  ├─
│  │
│  │  🦉 needs your talons
│  │     └─ summary
│  │        ├─ 5 blockers 🔴
│  │        └─ 3 nitpicks 🟠
│  │
│  └─
├─ stderr
│  ├─
│  │
│  └─`;

      const reviewContentI3 = `├─ stdout
│  ├─
│  │
│  │  🦉 needs your talons
│  │     └─ summary
│  │        ├─ 8 blockers 🔴
│  │        └─ 1 nitpick 🟠
│  │
│  └─
├─ stderr
│  ├─
│  │
│  └─`;

      // write files with different iterations and hashes
      await fs.writeFile(
        path.join(routeDir, 'test.stone.guard.review.i1.hash1.r1.md'),
        reviewContentI1,
      );
      await fs.writeFile(
        path.join(routeDir, 'test.stone.guard.review.i2.hash2.r1.md'),
        reviewContentI2,
      );
      await fs.writeFile(
        path.join(routeDir, 'test.stone.guard.review.i3.hash3.r1.md'),
        reviewContentI3,
      );

      // also create file for r2
      await fs.writeFile(
        path.join(routeDir, 'test.stone.guard.review.i3.hash3.r2.md'),
        `├─ stdout
│  ├─
│  │
│  │  └─ summary
│  │        ├─ 4 blockers 🔴
│  │        └─ 2 nitpicks 🟠
│  │
│  └─`,
      );

      const stone = {
        name: 'test.stone',
        path: path.join(tempDir, 'test.stone.stone'),
      } as RouteStone;

      return { tempDir, stone };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] find latest review for r1', () => {
      then('returns i3 (highest iteration)', async () => {
        const result = await getLatestReviewArtifactForIndex({
          stone: scene.stone,
          index: 1,
          route: scene.tempDir,
        });
        expect(result).not.toBeNull();
        expect(result?.iteration).toBe(3);
        expect(result?.index).toBe(1);
        expect(result?.blockers).toBe(8);
        expect(result?.nitpicks).toBe(1);
      });
    });

    when('[t1] find latest review for r2', () => {
      then('returns correct counts', async () => {
        const result = await getLatestReviewArtifactForIndex({
          stone: scene.stone,
          index: 2,
          route: scene.tempDir,
        });
        expect(result).not.toBeNull();
        expect(result?.index).toBe(2);
        expect(result?.blockers).toBe(4);
        expect(result?.nitpicks).toBe(2);
      });
    });

    when('[t2] find review for non-extant index', () => {
      then('returns null', async () => {
        const result = await getLatestReviewArtifactForIndex({
          stone: scene.stone,
          index: 99,
          route: scene.tempDir,
        });
        expect(result).toBeNull();
      });
    });
  });

  given('[case2] no .route directory', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-route-'));
      // no .route dir
      const stone = {
        name: 'test.stone',
        path: path.join(tempDir, 'test.stone.stone'),
      } as RouteStone;
      return { tempDir, stone };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] find review', () => {
      then('returns null', async () => {
        const result = await getLatestReviewArtifactForIndex({
          stone: scene.stone,
          index: 1,
          route: scene.tempDir,
        });
        expect(result).toBeNull();
      });
    });
  });
});
