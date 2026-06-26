import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { findsertReviewPeerGitignore } from './findsertReviewPeerGitignore';

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
 * | negative: ENOTDIR reviews | error-enotdir-reviews | case7 |
 * | negative: ENOTDIR peer | error-enotdir-peer | case8 |
 */
describe('findsertReviewPeerGitignore', () => {
  given('[case1] no .reviews/peer directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('creates .reviews/peer directory', async () => {
        await findsertReviewPeerGitignore({ route: tempDir });
        const stat = await fs.stat(path.join(tempDir, '.reviews', 'peer'));
        expect(stat.isDirectory()).toBe(true);
      });

      then('creates .gitignore with correct content', async () => {
        const result = await findsertReviewPeerGitignore({ route: tempDir });
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
      `test-reviewpeer-gitignore-correct-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.reviews', 'peer'), {
        recursive: true,
      });
      const content = `# ignore all peer-review files
*
!.gitignore
`;
      await fs.writeFile(
        path.join(tempDir, '.reviews', 'peer', '.gitignore'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('returns unchanged', async () => {
        const result = await findsertReviewPeerGitignore({ route: tempDir });
        expect(normalizeResult(result, tempDir)).toMatchSnapshot(
          'result-unchanged',
        );
      });
    });
  });

  given('[case3] .gitignore present with incorrect content', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-wrong-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.reviews', 'peer'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(tempDir, '.reviews', 'peer', '.gitignore'),
        '# old content\n*.log\n',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('overwrites with correct content', async () => {
        const result = await findsertReviewPeerGitignore({ route: tempDir });
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
      `test-reviewpeer-gitignore-read-error-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.reviews', 'peer'), {
        recursive: true,
      });
      // create .gitignore as a directory to cause EISDIR on read
      await fs.mkdir(path.join(tempDir, '.reviews', 'peer', '.gitignore'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('throws the error', async () => {
        await expect(
          findsertReviewPeerGitignore({ route: tempDir }),
        ).rejects.toMatchSnapshot('error-eisdir');
      });
    });
  });

  given('[case5] invalid route path', () => {
    when('[t0] findsert is called with non-writable path', () => {
      then('throws mkdir error', async () => {
        await expect(
          findsertReviewPeerGitignore({
            route: '/nonexistent/path/that/cannot/be/created',
          }),
        ).rejects.toMatchSnapshot('error-eacces');
      });
    });
  });

  given('[case6] route is a file instead of directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-route-file-${Date.now()}`,
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
          findsertReviewPeerGitignore({ route: routeFile }),
        ).rejects.toMatchSnapshot('error-enotdir-route');
      });
    });
  });

  given('[case7] .reviews path is a file instead of directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-reviews-file-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '.reviews'), 'not a directory');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('throws ENOTDIR error', async () => {
        await expect(
          findsertReviewPeerGitignore({ route: tempDir }),
        ).rejects.toMatchSnapshot('error-enotdir-reviews');
      });
    });
  });

  given('[case8] peer path is a file instead of directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-peer-file-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.reviews'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.reviews', 'peer'),
        'not a directory',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('throws ENOTDIR error', async () => {
        await expect(
          findsertReviewPeerGitignore({ route: tempDir }),
        ).rejects.toMatchSnapshot('error-enotdir-peer');
      });
    });
  });
});
