import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { delStoneGuardArtifacts } from './delStoneGuardArtifacts';

describe('delStoneGuardArtifacts', () => {
  given('[case1] a stone with no guard artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-empty-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('returns zero counts', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result).toEqual({
          reviews: 0,
          judges: 0,
          promises: 0,
          triggers: 0,
        });
      });
    });
  });

  given('[case2] a stone with review artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-reviews-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.review.i1.abc123.r1.md'),
        'review 1',
      );
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.review.i1.abc123.r2.md'),
        'review 2',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('deletes review files', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(routeDir);
        expect(files.filter((f) => f.includes('.review.'))).toHaveLength(0);
      });

      then('returns correct review count', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.reviews).toBe(2);
      });
    });
  });

  given('[case3] a stone with judge artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-judges-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.judge.i1.abc123.j1.md'),
        'judge 1',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('deletes judge files', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(routeDir);
        expect(files.filter((f) => f.includes('.judge.'))).toHaveLength(0);
      });

      then('returns correct judge count', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.judges).toBe(1);
      });
    });
  });

  given('[case4] a stone with promise artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-promises-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.promise.i1.p1.md'),
        'promise 1',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('deletes promise files', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(routeDir);
        expect(files.filter((f) => f.includes('.promise.'))).toHaveLength(0);
      });

      then('returns correct promise count', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.promises).toBe(1);
      });
    });
  });

  given('[case5] a stone with triggered artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-triggers-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.i1.triggered.2024-01-01T12-00-00.md',
        ),
        'trigger 1',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('deletes triggered files', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(routeDir);
        expect(files.filter((f) => f.includes('.triggered.'))).toHaveLength(0);
      });

      then('returns correct trigger count', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.triggers).toBe(1);
      });
    });
  });

  given('[case6] a stone with mixed artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-mixed-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.review.i1.abc123.r1.md'),
        'review',
      );
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.judge.i1.abc123.j1.md'),
        'judge',
      );
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.promise.i1.p1.md'),
        'promise',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.i1.triggered.2024-01-01T12-00-00.md',
        ),
        'trigger',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('deletes all guard artifact types', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(routeDir);
        expect(files).toHaveLength(0);
      });

      then('returns correct counts for all types', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result).toEqual({
          reviews: 1,
          judges: 1,
          promises: 1,
          triggers: 1,
        });
      });
    });
  });

  given('[case7] no .route directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-noroute-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('returns zero counts gracefully', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result).toEqual({
          reviews: 0,
          judges: 0,
          promises: 0,
          triggers: 0,
        });
      });
    });
  });

  given('[case8] artifacts for other stones are preserved', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-preserve-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.review.i1.abc123.r1.md'),
        'review for 1.vision',
      );
      await fs.writeFile(
        path.join(routeDir, '2.criteria.guard.review.i1.def456.r1.md'),
        'review for 2.criteria',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called for 1.vision', () => {
      then('only deletes 1.vision artifacts', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(routeDir);
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('2.criteria');
      });
    });
  });

  given('[case9] artifacts in directory with gitignore (regression)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-gitignore-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      // create .gitignore that ignores all files
      await fs.writeFile(path.join(routeDir, '.gitignore'), '*\n');
      // create guard artifacts (would be gitignored in production)
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.review.i1.abc123.r1.md'),
        'review',
      );
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.judge.i1.abc123.j1.md'),
        'judge',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('finds and deletes gitignored artifacts', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        // the fix ensures these are found even with .gitignore present
        expect(result.reviews).toBe(1);
        expect(result.judges).toBe(1);
      });

      then('files are actually deleted', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(routeDir);
        const guardFiles = files.filter((f) => f.includes('.guard.'));
        expect(guardFiles).toHaveLength(0);
      });
    });
  });
});
