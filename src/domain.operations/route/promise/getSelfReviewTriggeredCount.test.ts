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
      then('returns count 0 and null newest', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        expect(result.count).toEqual(0);
        expect(result.newest).toBeNull();
      });
    });
  });

  given('[case2] one triggered file pair', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-triggered-count-${Date.now()}`,
      );
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create triggered file pair
      const sincePath = path.join(
        routeDir,
        '1.vision.guard.selfreview.all-done.abc123.triggered.since',
      );
      const uptilPath = path.join(
        routeDir,
        '1.vision.guard.selfreview.all-done.abc123.triggered.uptil',
      );
      await fs.writeFile(sincePath, 'triggered');
      await fs.writeFile(uptilPath, 'triggered');

      return { tempDir, routeDir, sincePath, uptilPath };
    });

    when('[t0] count is requested', () => {
      then('returns count 1 with valid newest', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        expect(result.count).toEqual(1);
        expect(result.newest).not.toBeNull();
        expect(result.newest?.hash).toEqual('abc123');
        expect(typeof result.newest?.sinceMtime.getTime()).toEqual('number');
        expect(typeof result.newest?.uptilMtime.getTime()).toEqual('number');
      });
    });
  });

  given('[case3] multiple triggered file pairs with different hashes', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-triggered-count-${Date.now()}`,
      );
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create multiple triggered file pairs with different hashes
      const hashes = ['hash1', 'hash2', 'hash3'];

      for (const hash of hashes) {
        await fs.writeFile(
          path.join(
            routeDir,
            `1.vision.guard.selfreview.all-done.${hash}.triggered.since`,
          ),
          'triggered',
        );
        await fs.writeFile(
          path.join(
            routeDir,
            `1.vision.guard.selfreview.all-done.${hash}.triggered.uptil`,
          ),
          'triggered',
        );
      }

      // set newest .since file to future mtime
      const newestSincePath = path.join(
        routeDir,
        '1.vision.guard.selfreview.all-done.hash3.triggered.since',
      );
      const futureTime = new Date(Date.now() + 1000);
      await fs.utimes(newestSincePath, futureTime, futureTime);

      return { tempDir, routeDir, newestSincePath };
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

      then('newest is the file with newest .since mtime', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        const stat = await fs.stat(scene.newestSincePath);
        expect(result.newest?.hash).toEqual('hash3');
        expect(result.newest?.sinceMtime.getTime()).toEqual(
          stat.mtime.getTime(),
        );
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
      then('returns count 0 and null newest', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        expect(result.count).toEqual(0);
        expect(result.newest).toBeNull();
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
          '1.vision.guard.selfreview.all-done.hash1.triggered.since',
        ),
        'triggered',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.all-done.hash1.triggered.uptil',
        ),
        'triggered',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.all-done.hash2.triggered.since',
        ),
        'triggered',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.all-done.hash2.triggered.uptil',
        ),
        'triggered',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.tests-pass.hash1.triggered.since',
        ),
        'triggered',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.tests-pass.hash1.triggered.uptil',
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

  given('[case6] .uptil absent (graceful fallback)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-triggered-count-${Date.now()}`,
      );
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create only .since file (simulate .uptil deleted)
      const sincePath = path.join(
        routeDir,
        '1.vision.guard.selfreview.all-done.abc123.triggered.since',
      );
      await fs.writeFile(sincePath, 'triggered');

      return { tempDir, sincePath };
    });

    when('[t0] count is requested', () => {
      then('returns newest with uptilMtime equal to sinceMtime', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        expect(result.count).toEqual(1);
        expect(result.newest).not.toBeNull();
        // graceful fallback: uptilMtime equals sinceMtime when .uptil absent
        expect(result.newest?.uptilMtime.getTime()).toEqual(
          result.newest?.sinceMtime.getTime(),
        );
      });
    });
  });

  given('[case7] sinceMtime < uptilMtime (rush detection)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-triggered-count-${Date.now()}`,
      );
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      const sincePath = path.join(
        routeDir,
        '1.vision.guard.selfreview.all-done.abc123.triggered.since',
      );
      const uptilPath = path.join(
        routeDir,
        '1.vision.guard.selfreview.all-done.abc123.triggered.uptil',
      );

      // create .since first
      await fs.writeFile(sincePath, 'triggered');

      // wait then create .uptil (newer mtime)
      await new Promise((done) => setTimeout(done, 50));
      await fs.writeFile(uptilPath, 'triggered');

      return { tempDir, sincePath, uptilPath };
    });

    when('[t0] count is requested', () => {
      then('sinceMtime is less than uptilMtime', async () => {
        const result = await getSelfReviewTriggeredCount({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.tempDir,
        });
        expect(result.newest).not.toBeNull();
        expect(result.newest!.sinceMtime.getTime()).toBeLessThan(
          result.newest!.uptilMtime.getTime(),
        );
      });
    });
  });
});
