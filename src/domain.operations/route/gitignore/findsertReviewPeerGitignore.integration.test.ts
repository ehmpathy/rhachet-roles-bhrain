import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

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
 * | idempotent: first call | result-first-call | case1 |
 * | idempotent: second call | result-second-call | case1 |
 * | idempotent: third call | result-third-call | case1 |
 * | coexistence: with files | result-with-files-present | case2 |
 * | negative: ENOTDIR route | error-enotdir-route | case3 |
 * | negative: EACCES | error-eacces | case4 |
 * | overwrite: incorrect content | result-overwrite | case5 |
 * | negative: EISDIR | error-eisdir | case6 |
 * | negative: ENOTDIR reviews | error-enotdir-reviews | case7 |
 * | negative: ENOTDIR peer | error-enotdir-peer | case8 |
 */
describe('findsertReviewPeerGitignore.integration', () => {
  given('[case1] called multiple times', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-idem-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called multiple times', () => {
      then('only creates once, subsequent calls return unchanged', async () => {
        const result1 = await findsertReviewPeerGitignore({ route: tempDir });
        expect(normalizeResult(result1, tempDir)).toMatchSnapshot(
          'result-first-call',
        );

        const result2 = await findsertReviewPeerGitignore({ route: tempDir });
        expect(normalizeResult(result2, tempDir)).toMatchSnapshot(
          'result-second-call',
        );

        const result3 = await findsertReviewPeerGitignore({ route: tempDir });
        expect(normalizeResult(result3, tempDir)).toMatchSnapshot(
          'result-third-call',
        );
      });
    });
  });

  given('[case2] peer-review files in directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-files-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called with peer-review files present', () => {
      then('gitignore created alongside peer-review files', async () => {
        // create directory and a peer-review file first
        await fs.mkdir(path.join(tempDir, '.reviews', 'peer'), {
          recursive: true,
        });
        await fs.writeFile(
          path.join(
            tempDir,
            '.reviews',
            'peer',
            '1.vision._.review.i001.abcd.r001._.given.by_peer.architect.md',
          ),
          '# peer-review content\n',
        );

        // findsert gitignore
        const result = await findsertReviewPeerGitignore({ route: tempDir });
        expect(normalizeResult(result, tempDir)).toMatchSnapshot(
          'result-with-files-present',
        );

        // verify both files coexist
        const files = await fs.readdir(path.join(tempDir, '.reviews', 'peer'));
        expect(files).toContain('.gitignore');
        expect(files).toContain(
          '1.vision._.review.i001.abcd.r001._.given.by_peer.architect.md',
        );
      });
    });
  });

  given('[case3] route is a file instead of directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-route-file-int-${Date.now()}`,
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
        const error = await getError(
          findsertReviewPeerGitignore({ route: routeFile }),
        );
        expect(error.message.replace(tempDir, '<route>')).toMatchSnapshot(
          'error-enotdir-route',
        );
      });
    });
  });

  given('[case4] invalid route path', () => {
    when('[t0] findsert is called with non-writable path', () => {
      then('throws permission error', async () => {
        await expect(
          findsertReviewPeerGitignore({
            route: '/nonexistent/path/that/cannot/be/created',
          }),
        ).rejects.toMatchSnapshot('error-eacces');
      });
    });
  });

  given('[case5] .gitignore present with incorrect content', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-wrong-int-${Date.now()}`,
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
      });
    });
  });

  given('[case6] .gitignore is a directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-eisdir-int-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.reviews', 'peer'), {
        recursive: true,
      });
      await fs.mkdir(path.join(tempDir, '.reviews', 'peer', '.gitignore'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('throws EISDIR error', async () => {
        await expect(
          findsertReviewPeerGitignore({ route: tempDir }),
        ).rejects.toMatchSnapshot('error-eisdir');
      });
    });
  });

  given('[case7] .reviews path is a file instead of directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-reviews-file-int-${Date.now()}`,
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
        const error = await getError(
          findsertReviewPeerGitignore({ route: tempDir }),
        );
        expect(error.message.replace(tempDir, '<route>')).toMatchSnapshot(
          'error-enotdir-reviews',
        );
      });
    });
  });

  given('[case8] peer path is a file instead of directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviewpeer-gitignore-peer-file-int-${Date.now()}`,
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
        const error = await getError(
          findsertReviewPeerGitignore({ route: tempDir }),
        );
        expect(error.message.replace(tempDir, '<route>')).toMatchSnapshot(
          'error-enotdir-peer',
        );
      });
    });
  });
});
