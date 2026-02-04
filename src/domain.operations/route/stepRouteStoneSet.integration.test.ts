import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { stepRouteStoneSet } from './stepRouteStoneSet';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

describe('stepRouteStoneSet.integration', () => {
  given('[case1] set stone as passed with guard execution', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-set-guard-${Date.now()}`);

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - 1.test*.md',
          'reviews:',
          '  - echo "blockers: 0\\nnitpicks: 0"',
          'judges:',
          '  - echo "passed: true\\nreason: clean"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Artifact');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as passed triggers guard', () => {
      then('executes reviews and judges', async () => {
        const result = await stepRouteStoneSet({
          stone: '1.test',
          route: tempDir,
          as: 'passed',
        });
        expect(result.passed).toBe(true);
        expect(result.refs?.reviews.length).toBeGreaterThan(0);
        expect(result.refs?.judges.length).toBeGreaterThan(0);
      });

      then('creates passage marker on success', async () => {
        await stepRouteStoneSet({
          stone: '1.test',
          route: tempDir,
          as: 'passed',
        });
        const passageExists = await fs
          .access(path.join(tempDir, '.route', '1.test.passed'))
          .then(() => true)
          .catch(() => false);
        expect(passageExists).toBe(true);
      });
    });
  });

  given('[case2] set stone as approved then passed', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-approve-pass-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.guarded'), tempDir, {
        recursive: true,
      });
      // create artifact
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] approved then passed workflow', () => {
      then('approve creates marker', async () => {
        const approveResult = await stepRouteStoneSet({
          stone: '1.vision',
          route: tempDir,
          as: 'approved',
        });
        expect(approveResult.approved).toBe(true);
        const approvalExists = await fs
          .access(path.join(tempDir, '.route', '1.vision.approved'))
          .then(() => true)
          .catch(() => false);
        expect(approvalExists).toBe(true);
      });
    });
  });

  given('[case3] route.simple fixture (no guards)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-simple-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as passed with no guard', () => {
      then('auto-passes immediately', async () => {
        const result = await stepRouteStoneSet({
          stone: '1.vision',
          route: tempDir,
          as: 'passed',
        });
        expect(result.passed).toBe(true);
        expect(result.refs?.reviews).toEqual([]);
        expect(result.refs?.judges).toEqual([]);
      });
    });
  });
});
