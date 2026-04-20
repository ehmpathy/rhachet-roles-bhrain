import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { findsertSelfReviewGitignore } from './findsertSelfReviewGitignore';

const normalizeResult = (
  result: { action: string; path: string },
  route: string,
) => ({
  action: result.action,
  pathRelative: result.path.replace(route, '$ROUTE'),
});

/**
 * ## snapshots
 *
 * | variant | snapshot | path |
 * |---------|----------|------|
 * | idempotent: first call | result-first-call | case1 |
 * | idempotent: second call | result-second-call | case1 |
 * | idempotent: third call | result-third-call | case1 |
 * | coexistence: with files | result-with-files-present | case2 |
 * | negative: ENOTDIR route | error-enotdir-route | case3 |
 * | negative: EACCES | error-eacces | case4 |
 * | overwrite: incorrect content | result-overwrite | case5 |
 * | negative: EISDIR | error-eisdir | case6 |
 * | negative: ENOTDIR review | error-enotdir-review | case7 |
 * | negative: ENOTDIR self | error-enotdir-self | case8 |
 */
describe('findsertSelfReviewGitignore.integration', () => {
  given('[case1] called multiple times', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-idem-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called multiple times', () => {
      then('only creates once, subsequent calls return unchanged', async () => {
        const result1 = await findsertSelfReviewGitignore({ route: tempDir });
        expect(normalizeResult(result1, tempDir)).toMatchSnapshot('result-first-call');

        const result2 = await findsertSelfReviewGitignore({ route: tempDir });
        expect(normalizeResult(result2, tempDir)).toMatchSnapshot('result-second-call');

        const result3 = await findsertSelfReviewGitignore({ route: tempDir });
        expect(normalizeResult(result3, tempDir)).toMatchSnapshot('result-third-call');
      });
    });
  });

  given('[case2] self-review files in directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-files-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called with self-review files present', () => {
      then('gitignore created alongside self-review files', async () => {
        // create directory and a self-review file first
        await fs.mkdir(path.join(tempDir, 'review', 'self'), {
          recursive: true,
        });
        await fs.writeFile(
          path.join(
            tempDir,
            'review',
            'self',
            'for.1.vision._.r1.has-questioned-assumptions.md',
          ),
          '# self-review content\n',
        );

        // findsert gitignore
        const result = await findsertSelfReviewGitignore({ route: tempDir });
        expect(normalizeResult(result, tempDir)).toMatchSnapshot('result-with-files-present');

        // verify both files coexist
        const files = await fs.readdir(path.join(tempDir, 'review', 'self'));
        expect(files).toContain('.gitignore');
        expect(files).toContain(
          'for.1.vision._.r1.has-questioned-assumptions.md',
        );
      });
    });
  });

  given('[case3] route is a file instead of directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-route-file-int-${Date.now()}`,
    );
    const routeFile = path.join(tempDir, 'route-as-file');

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(routeFile, 'not a directory');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('throws ENOTDIR error', async () => {
        await expect(
          findsertSelfReviewGitignore({ route: routeFile }),
        ).rejects.toMatchSnapshot('error-enotdir-route');
      });
    });
  });

  given('[case4] invalid route path', () => {
    when('[t0] findsert is called with non-writable path', () => {
      then('throws permission error', async () => {
        await expect(
          findsertSelfReviewGitignore({
            route: '/nonexistent/path/that/cannot/be/created',
          }),
        ).rejects.toMatchSnapshot('error-eacces');
      });
    });
  });

  given('[case5] .gitignore present with incorrect content', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-wrong-int-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, 'review', 'self'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'review', 'self', '.gitignore'),
        '# old content\n*.log\n',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('overwrites with correct content', async () => {
        const result = await findsertSelfReviewGitignore({ route: tempDir });
        expect(normalizeResult(result, tempDir)).toMatchSnapshot('result-overwrite');
      });
    });
  });

  given('[case6] .gitignore is a directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-eisdir-int-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, 'review', 'self'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'review', 'self', '.gitignore'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('throws EISDIR error', async () => {
        await expect(
          findsertSelfReviewGitignore({ route: tempDir }),
        ).rejects.toMatchSnapshot('error-eisdir');
      });
    });
  });

  given('[case7] review path is a file instead of directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-review-file-int-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, 'review'), 'not a directory');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('throws ENOTDIR error', async () => {
        await expect(
          findsertSelfReviewGitignore({ route: tempDir }),
        ).rejects.toMatchSnapshot('error-enotdir-review');
      });
    });
  });

  given('[case8] self path is a file instead of directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-self-file-int-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, 'review'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'review', 'self'), 'not a directory');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('throws ENOTDIR error', async () => {
        await expect(
          findsertSelfReviewGitignore({ route: tempDir }),
        ).rejects.toMatchSnapshot('error-enotdir-self');
      });
    });
  });
});
