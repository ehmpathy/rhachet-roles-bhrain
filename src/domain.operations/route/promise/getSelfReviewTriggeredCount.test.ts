import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getSelfReviewTriggeredCount } from './getSelfReviewTriggeredCount';

describe('getSelfReviewTriggeredCount', () => {
  given('[case1] no triggered files', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-triggered-count-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      return { tempDir };
    });

    when('[t0] count is requested', () => {
      then('returns count 0 and null mtime', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        expect(result.count).toEqual(0);
        expect(result.newestMtime).toBeNull();
      });
    });
  });

  given('[case2] one triggered file', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-triggered-count-${Date.now()}`,
      );
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create one triggered file
      const filePath = path.join(
        routeDir,
        '1.vision.guard.selfreview.all-done.abc123.triggered',
      );
      await fs.writeFile(filePath, 'triggered');

      return { tempDir, routeDir };
    });

    when('[t0] count is requested', () => {
      then('returns count 1 with valid mtime', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        expect(result.count).toEqual(1);
        expect(result.newestMtime).not.toBeNull();
        expect(typeof result.newestMtime?.getTime()).toEqual('number');
      });
    });
  });

  given('[case3] multiple triggered files with different hashes', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-triggered-count-${Date.now()}`,
      );
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create multiple triggered files with different hashes
      const files = [
        '1.vision.guard.selfreview.all-done.hash1.triggered',
        '1.vision.guard.selfreview.all-done.hash2.triggered',
        '1.vision.guard.selfreview.all-done.hash3.triggered',
      ];

      for (const file of files) {
        await fs.writeFile(path.join(routeDir, file), 'triggered');
      }

      // set newest file to future mtime
      const newestPath = path.join(routeDir, files[2]!);
      const futureTime = new Date(Date.now() + 1000);
      await fs.utimes(newestPath, futureTime, futureTime);

      return { tempDir, routeDir, newestPath };
    });

    when('[t0] count is requested', () => {
      then('returns count 3', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        expect(result.count).toEqual(3);
      });

      then('newestMtime is the newest file mtime', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        const stat = await fs.stat(scene.newestPath);
        expect(result.newestMtime?.getTime()).toEqual(stat.mtime.getTime());
      });
    });
  });

  given('[case4] no .route directory', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-triggered-count-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });
      // .route dir deliberately absent
      return { tempDir };
    });

    when('[t0] count is requested', () => {
      then('returns count 0 and null mtime', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        expect(result.count).toEqual(0);
        expect(result.newestMtime).toBeNull();
      });
    });
  });

  given('[case5] different slug has separate count', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-triggered-count-${Date.now()}`,
      );
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create files for different slugs
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.all-done.hash1.triggered',
        ),
        'triggered',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.all-done.hash2.triggered',
        ),
        'triggered',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.tests-pass.hash1.triggered',
        ),
        'triggered',
      );

      return { tempDir };
    });

    when('[t0] count for all-done is requested', () => {
      then('returns count 2', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        expect(result.count).toEqual(2);
      });
    });

    when('[t1] count for tests-pass is requested', () => {
      then('returns count 1', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'tests-pass',
          route: scene.tempDir,
        });
        expect(result.count).toEqual(1);
      });
    });
  });
});
