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
 * | positive: create | result-created | case1 |
 * | positive: content | gitignore-content | case1 |
 * | positive: unchanged | result-unchanged | case2 |
 * | positive: overwrite | result-overwrite | case3 |
 * | positive: overwrite content | gitignore-content-overwrite | case3 |
 * | negative: EISDIR | error-eisdir | case4 |
 * | negative: EACCES | error-eacces | case5 |
 * | negative: ENOTDIR route | error-enotdir-route | case6 |
 * | negative: ENOTDIR review | error-enotdir-review | case7 |
 * | negative: ENOTDIR self | error-enotdir-self | case8 |
 */
describe('findsertSelfReviewGitignore', () => {
  given('[case1] no review/self directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('creates review/self directory', async () => {
        await findsertSelfReviewGitignore({ route: tempDir });
        const stat = await fs.stat(path.join(tempDir, 'review', 'self'));
        expect(stat.isDirectory()).toBe(true);
      });

      then('creates .gitignore with correct content', async () => {
        const result = await findsertSelfReviewGitignore({ route: tempDir });
        expect(normalizeResult(result, tempDir)).toMatchSnapshot(
          'result-created',
        );
        const content = await fs.readFile(result.path, 'utf-8');
        expect(content).toMatchSnapshot('gitignore-content');
      });
    });
  });

  given('[case2] .gitignore already present with correct content', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-correct-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, 'review', 'self'), { recursive: true });
      const content = `# ignore all self-review files
*
!.gitignore
`;
      await fs.writeFile(
        path.join(tempDir, 'review', 'self', '.gitignore'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('returns unchanged', async () => {
        const result = await findsertSelfReviewGitignore({ route: tempDir });
        expect(normalizeResult(result, tempDir)).toMatchSnapshot(
          'result-unchanged',
        );
      });
    });
  });

  given('[case3] .gitignore present with incorrect content', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-wrong-${Date.now()}`,
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
        expect(normalizeResult(result, tempDir)).toMatchSnapshot(
          'result-overwrite',
        );
        const content = await fs.readFile(result.path, 'utf-8');
        expect(content).toMatchSnapshot('gitignore-content-overwrite');
      });
    });
  });

  given('[case4] read error other than ENOENT', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-read-error-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, 'review', 'self'), { recursive: true });
      // create .gitignore as a directory to cause EISDIR on read
      await fs.mkdir(path.join(tempDir, 'review', 'self', '.gitignore'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('throws the error', async () => {
        await expect(
          findsertSelfReviewGitignore({ route: tempDir }),
        ).rejects.toMatchSnapshot('error-eisdir');
      });
    });
  });

  given('[case5] invalid route path', () => {
    when('[t0] findsert is called with non-writable path', () => {
      then('throws mkdir error', async () => {
        await expect(
          findsertSelfReviewGitignore({
            route: '/nonexistent/path/that/cannot/be/created',
          }),
        ).rejects.toMatchSnapshot('error-eacces');
      });
    });
  });

  given('[case6] route is a file instead of directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-route-file-${Date.now()}`,
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

  given('[case7] review path is a file instead of directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-selfreview-gitignore-review-file-${Date.now()}`,
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
      `test-selfreview-gitignore-self-file-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, 'review'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'review', 'self'),
        'not a directory',
      );
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
