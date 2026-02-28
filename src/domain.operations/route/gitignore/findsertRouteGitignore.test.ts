import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { findsertRouteGitignore } from './findsertRouteGitignore';

describe('findsertRouteGitignore', () => {
  given('[case1] no .route directory', () => {
    const tempDir = path.join(os.tmpdir(), `test-gitignore-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('creates .route directory', async () => {
        await findsertRouteGitignore({ route: tempDir });
        const stat = await fs.stat(path.join(tempDir, '.route'));
        expect(stat.isDirectory()).toBe(true);
      });

      then('creates .gitignore with correct content', async () => {
        const result = await findsertRouteGitignore({ route: tempDir });
        expect(result.action).toEqual('created');
        const content = await fs.readFile(result.path, 'utf-8');
        expect(content).toContain('*');
        expect(content).toContain('!.gitignore');
        expect(content).toContain('!passage.jsonl');
        expect(content).toContain('!.bind.*');
      });
    });
  });

  given('[case2] .gitignore already present with correct content', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-gitignore-correct-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content = `# ignore all except passage.jsonl and .bind flags
*
!.gitignore
!passage.jsonl
!.bind.*
`;
      await fs.writeFile(path.join(tempDir, '.route', '.gitignore'), content);
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('returns unchanged', async () => {
        const result = await findsertRouteGitignore({ route: tempDir });
        expect(result.action).toEqual('unchanged');
      });
    });
  });

  given('[case3] .gitignore present with incorrect content', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-gitignore-wrong-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', '.gitignore'),
        '# old content\n*.log\n',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] findsert is called', () => {
      then('overwrites with correct content', async () => {
        const result = await findsertRouteGitignore({ route: tempDir });
        expect(result.action).toEqual('created');
        const content = await fs.readFile(result.path, 'utf-8');
        expect(content).toContain('!passage.jsonl');
      });
    });
  });
});
