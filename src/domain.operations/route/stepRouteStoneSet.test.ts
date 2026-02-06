import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { stepRouteStoneSet } from './stepRouteStoneSet';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

const noopContext = { cliEmit: { onGuardProgress: () => {} } };

describe('stepRouteStoneSet', () => {
  given('[case1] set stone as passed', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-passed-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // create artifact for 1.vision
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as passed with artifact present', () => {
      then('dispatches to setStoneAsPassed', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'passed',
          },
          noopContext,
        );
        expect(result.passed).toBe(true);
        expect(result.emit?.stdout).toContain('passage = allowed');
      });

      then('returns refs object', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'passed',
          },
          noopContext,
        );
        expect(result.refs).toBeDefined();
        expect(result.refs?.reviews).toEqual([]);
        expect(result.refs?.judges).toEqual([]);
      });
    });
  });

  given('[case2] set stone as approved', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-approved-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as approved', () => {
      then('dispatches to setStoneAsApproved', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'approved',
          },
          noopContext,
        );
        expect(result.approved).toBe(true);
        expect(result.emit?.stdout).toContain('approval = granted');
      });

      then('does not return refs', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'approved',
          },
          noopContext,
        );
        expect(result.refs).toBeUndefined();
      });
    });
  });

  given('[case3] invalid --as value', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-invalid-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as has unsupported value', () => {
      then('throws unexpected code path error', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: tempDir,
              as: 'invalid' as 'passed' | 'approved',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('unsupported');
      });
    });
  });
});
