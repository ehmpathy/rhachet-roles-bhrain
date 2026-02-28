import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { findsertRouteGitignore } from './findsertRouteGitignore';

describe('findsertRouteGitignore.integration', () => {
  given('[case1] idempotent findsert', () => {
    const tempDir = path.join(os.tmpdir(), `test-gitignore-idem-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] called multiple times', () => {
      then('first call creates, subsequent calls unchanged', async () => {
        // first call
        const result1 = await findsertRouteGitignore({ route: tempDir });
        expect(result1.action).toEqual('created');

        // second call
        const result2 = await findsertRouteGitignore({ route: tempDir });
        expect(result2.action).toEqual('unchanged');

        // third call
        const result3 = await findsertRouteGitignore({ route: tempDir });
        expect(result3.action).toEqual('unchanged');
      });
    });
  });

  given('[case2] file persistence', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-gitignore-persist-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] gitignore is created', () => {
      then('file persists on disk', async () => {
        const result = await findsertRouteGitignore({ route: tempDir });

        // verify file exists
        const stat = await fs.stat(result.path);
        expect(stat.isFile()).toBe(true);

        // verify content
        const content = await fs.readFile(result.path, 'utf-8');
        expect(content).toContain('!passage.jsonl');
        expect(content).toContain('!.bind.*');
      });
    });
  });
});
