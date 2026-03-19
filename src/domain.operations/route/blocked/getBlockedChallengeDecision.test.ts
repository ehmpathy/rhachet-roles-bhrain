import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getBlockedChallengeDecision } from './getBlockedChallengeDecision';

describe('getBlockedChallengeDecision', () => {
  given('[case1] no triggered file exists', () => {
    when('[t0] we check challenge decision', () => {
      then('it returns challenge:first', async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'blocked-test-'),
        );

        const result = await getBlockedChallengeDecision({
          stone: '3.blueprint',
          route: tempDir,
        });

        expect(result.decision).toBe('challenge:first');
        expect(result.articulationPath).toContain(
          '.route/blocker/3.blueprint.md',
        );

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case2] triggered file exists but no articulation', () => {
    when('[t0] we check challenge decision', () => {
      then('it returns challenge:absent', async () => {
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

        const result = await getBlockedChallengeDecision({
          stone: '3.blueprint',
          route: tempDir,
        });

        expect(result.decision).toBe('challenge:absent');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case3] triggered file and articulation both exist', () => {
    when('[t0] we check challenge decision', () => {
      then('it returns allowed', async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'blocked-test-'),
        );

        // create .route dir with triggered file
        const routeDir = path.join(tempDir, '.route');
        await fs.mkdir(routeDir, { recursive: true });
        await fs.writeFile(
          path.join(routeDir, '3.blueprint.blocked.triggered'),
          'stone: 3.blueprint\n',
        );

        // create blocker dir with articulation file
        const blockerDir = path.join(routeDir, 'blocker');
        await fs.mkdir(blockerDir, { recursive: true });
        await fs.writeFile(
          path.join(blockerDir, '3.blueprint.md'),
          '# blocker: 3.blueprint\n\n## what blocks me\ntest blocker\n',
        );

        const result = await getBlockedChallengeDecision({
          stone: '3.blueprint',
          route: tempDir,
        });

        expect(result.decision).toBe('allowed');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });
});
