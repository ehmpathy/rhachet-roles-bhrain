import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { archiveStoneYield } from './archiveStoneYield';

describe('archiveStoneYield.integration', () => {
  given('[case1] single .yield.md file', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-archive-yield-md-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.yield.md'), '# Test yield');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] archive is called', () => {
      const result = useThen('operation succeeds', async () =>
        archiveStoneYield({ stone: '1.test', route: tempDir }),
      );

      then('returns archived outcome', () => {
        expect(result.outcome).toBe('archived');
        expect(result.count).toBe(1);
      });

      then('file is moved to archive', async () => {
        const archivePath = path.join(
          tempDir,
          '.route',
          '.archive',
          '1.test.yield.md',
        );
        const exists = await fs
          .access(archivePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('original file is removed', async () => {
        const originalPath = path.join(tempDir, '1.test.yield.md');
        const exists = await fs
          .access(originalPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });
    });
  });

  given('[case2] single .yield file (no extension)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-archive-yield-noext-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.yield'), 'plain yield');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] archive is called', () => {
      const result = useThen('operation succeeds', async () =>
        archiveStoneYield({ stone: '1.test', route: tempDir }),
      );

      then('returns archived outcome', () => {
        expect(result.outcome).toBe('archived');
        expect(result.count).toBe(1);
      });

      then('file is moved to archive', async () => {
        const archivePath = path.join(
          tempDir,
          '.route',
          '.archive',
          '1.test.yield',
        );
        const exists = await fs
          .access(archivePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });
    });
  });

  given('[case3] multiple yield files', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-archive-yield-multi-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.yield'), 'plain yield');
      await fs.writeFile(
        path.join(tempDir, '1.test.yield.md'),
        '# Markdown yield',
      );
      await fs.writeFile(
        path.join(tempDir, '1.test.yield.json'),
        '{"type": "json"}',
      );
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] archive is called', () => {
      const result = useThen('operation succeeds', async () =>
        archiveStoneYield({ stone: '1.test', route: tempDir }),
      );

      then('returns count of all files', () => {
        expect(result.outcome).toBe('archived');
        expect(result.count).toBe(3);
      });

      then('all files are moved to archive', async () => {
        const archiveDir = path.join(tempDir, '.route', '.archive');
        const files = await fs.readdir(archiveDir);
        expect(files).toContain('1.test.yield');
        expect(files).toContain('1.test.yield.md');
        expect(files).toContain('1.test.yield.json');
      });
    });
  });

  given('[case4] no yield files', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-archive-yield-none-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      // no yield files created
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] archive is called', () => {
      const result = useThen('operation succeeds', async () =>
        archiveStoneYield({ stone: '1.test', route: tempDir }),
      );

      then('returns absent outcome', () => {
        expect(result.outcome).toBe('absent');
        expect(result.count).toBe(0);
      });

      then('no archive dir created', async () => {
        const archiveDir = path.join(tempDir, '.route', '.archive');
        const exists = await fs
          .access(archiveDir)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });
    });
  });

  given('[case5] archive dir absent before call', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-archive-yield-nodir-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.yield.md'), '# Test yield');
      // no .route/.archive dir created
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] archive is called', () => {
      const result = useThen('operation succeeds', async () =>
        archiveStoneYield({ stone: '1.test', route: tempDir }),
      );

      then('creates archive dir', async () => {
        const archiveDir = path.join(tempDir, '.route', '.archive');
        const exists = await fs
          .access(archiveDir)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('file is archived', () => {
        expect(result.outcome).toBe('archived');
        expect(result.count).toBe(1);
      });
    });
  });

  given('[case6] collision with prior archive', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-archive-yield-collision-${Date.now()}`,
    );

    beforeAll(async () => {
      // create archive dir with prior archive
      const archiveDir = path.join(tempDir, '.route', '.archive');
      await fs.mkdir(archiveDir, { recursive: true });
      await fs.writeFile(
        path.join(archiveDir, '1.test.yield.md'),
        '# Prior archive',
      );

      // create new yield file
      await fs.writeFile(path.join(tempDir, '1.test.yield.md'), '# New yield');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] archive is called', () => {
      const result = useThen('operation succeeds', async () =>
        archiveStoneYield({ stone: '1.test', route: tempDir }),
      );

      then('returns archived outcome', () => {
        expect(result.outcome).toBe('archived');
        expect(result.count).toBe(1);
      });

      then('prior archive is preserved', async () => {
        const archiveDir = path.join(tempDir, '.route', '.archive');
        const priorContent = await fs.readFile(
          path.join(archiveDir, '1.test.yield.md'),
          'utf-8',
        );
        expect(priorContent).toContain('Prior archive');
      });

      then('new archive has timestamp suffix', async () => {
        const archiveDir = path.join(tempDir, '.route', '.archive');
        const files = await fs.readdir(archiveDir);
        const timestampFile = files.find(
          (f) =>
            f.startsWith('1.test.yield.md.') &&
            f.length > '1.test.yield.md'.length,
        );
        expect(timestampFile).toBeDefined();

        const newContent = await fs.readFile(
          path.join(archiveDir, timestampFile!),
          'utf-8',
        );
        expect(newContent).toContain('New yield');
      });
    });
  });
});
