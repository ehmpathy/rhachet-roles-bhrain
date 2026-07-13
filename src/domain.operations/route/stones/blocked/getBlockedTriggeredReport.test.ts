import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getBlockedTriggeredReport } from './getBlockedTriggeredReport';

describe('getBlockedTriggeredReport', () => {
  given('[case1] no triggered file exists', () => {
    when('[t0] we check for triggered report', () => {
      then('it returns triggered: false', async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'blocked-test-'),
        );

        const result = await getBlockedTriggeredReport({
          stone: '3.blueprint',
          route: tempDir,
        });

        expect(result.triggered).toBe(false);
        expect(result.path).toContain('3.blueprint.blocked.triggered');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case2] triggered file exists', () => {
    when('[t0] we check for triggered report', () => {
      then('it returns triggered: true', async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'blocked-test-'),
        );

        // create .route dir and triggered file
        const routeDir = path.join(tempDir, '.route');
        await fs.mkdir(routeDir, { recursive: true });
        await fs.writeFile(
          path.join(routeDir, '3.blueprint.blocked.triggered'),
          'stone: 3.blueprint\n',
        );

        const result = await getBlockedTriggeredReport({
          stone: '3.blueprint',
          route: tempDir,
        });

        expect(result.triggered).toBe(true);
        expect(result.path).toContain('3.blueprint.blocked.triggered');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });
});
