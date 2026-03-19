import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { setBlockedTriggeredReport } from './setBlockedTriggeredReport';

describe('setBlockedTriggeredReport', () => {
  given('[case1] .route directory does not exist', () => {
    when('[t0] we create triggered report', () => {
      then('it creates the directory and file', async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'blocked-test-'),
        );

        const result = await setBlockedTriggeredReport({
          stone: '3.blueprint',
          route: tempDir,
        });

        // verify file was created
        const fileContent = await fs.readFile(result.path, 'utf-8');
        expect(fileContent).toContain('stone: 3.blueprint');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case2] .route directory already exists', () => {
    when('[t0] we create triggered report', () => {
      then('it creates the file in the extant directory', async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'blocked-test-'),
        );

        // create .route dir ahead of time
        const routeDir = path.join(tempDir, '.route');
        await fs.mkdir(routeDir, { recursive: true });

        const result = await setBlockedTriggeredReport({
          stone: '3.blueprint',
          route: tempDir,
        });

        // verify file was created
        const fileContent = await fs.readFile(result.path, 'utf-8');
        expect(fileContent).toContain('stone: 3.blueprint');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });
});
