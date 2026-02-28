import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');
const ASSETS_GUARDED_DIR = path.join(
  __dirname,
  '.test/assets/route-driver-guarded',
);

describe('driver.route.passage-consolidation.acceptance', () => {
  given('[case1] passage state consolidated into passage.jsonl', () => {
    when('[t0] stone passes', () => {
      const res = useThen('invoke set --as passed', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'passage-consolidate-pass',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // create artifact
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision\n\nTest');

        // invoke skill
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        // read passage.jsonl
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8');

        // check for old-style .passed file
        const passedFileExists = await fs
          .access(path.join(tempDir, '.route', '1.vision.passed'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, passageContent, passedFileExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('passage.jsonl contains entry with stone name and status passed', () => {
        expect(res.passageContent).toContain('"stone":"1.vision"');
        expect(res.passageContent).toContain('"status":"passed"');
      });

      then('no separate .passed file is created', () => {
        expect(res.passedFileExists).toBe(false);
      });
    });

    when('[t1] stone is approved', () => {
      const res = useThen('invoke set --as approved', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'passage-consolidate-approve',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // invoke skill (from test env, approval is allowed)
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'approved' },
          cwd: tempDir,
        });

        // read passage.jsonl
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8');

        // check for old-style .approved file
        const approvedFileExists = await fs
          .access(path.join(tempDir, '.route', '1.vision.approved'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, passageContent, approvedFileExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('passage.jsonl contains entry with stone name and status approved', () => {
        expect(res.passageContent).toContain('"stone":"1.vision"');
        expect(res.passageContent).toContain('"status":"approved"');
      });

      then('no separate .approved file is created', () => {
        expect(res.approvedFileExists).toBe(false);
      });
    });

    when('[t2] stone is blocked by judge', () => {
      const res = useThen('invoke set --as passed on blocked stone', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'passage-consolidate-block',
          clone: ASSETS_GUARDED_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // create artifact for blocked stone
        await fs.writeFile(
          path.join(tempDir, '2.blocked.md'),
          '# Blocked artifact\n\ncontent with issues',
        );

        // invoke skill
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.blocked', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        // read passage.jsonl
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8');

        // check for old-style blocker.json file
        const blockerFileExists = await fs
          .access(path.join(tempDir, '.route', '2.blocked.blocker.json'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, passageContent, blockerFileExists };
      });

      then('cli exits with non-zero code (blocked)', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('passage.jsonl contains entry with stone name and status blocked', () => {
        expect(res.passageContent).toContain('"stone":"2.blocked"');
        expect(res.passageContent).toContain('"status":"blocked"');
      });

      then('no separate .blocker.json file is created', () => {
        expect(res.blockerFileExists).toBe(false);
      });
    });
  });

  given('[case2] passage.jsonl is append-only', () => {
    when('[t0] multiple operations on same stone', () => {
      const res = useThen('invoke approve then pass on same stone', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'passage-append-only',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // create artifact
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');

        // first: approve
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'approved' },
          cwd: tempDir,
        });

        // second: pass
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        // read passage.jsonl
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8');
        const lines = passageContent.split('\n').filter(Boolean);

        return { cli, tempDir, passageContent, lines };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('passage.jsonl contains both entries (append-only)', () => {
        expect(res.lines.length).toBeGreaterThanOrEqual(2);
        expect(res.passageContent).toContain('"status":"approved"');
        expect(res.passageContent).toContain('"status":"passed"');
      });

      then('entries are in chronological order (approved before passed)', () => {
        const approvedLine = res.lines.findIndex((l) =>
          l.includes('"status":"approved"'),
        );
        const passedLine = res.lines.findIndex((l) =>
          l.includes('"status":"passed"'),
        );
        expect(approvedLine).toBeLessThan(passedLine);
      });
    });
  });

  given('[case3] passage.jsonl queryable by stone', () => {
    when('[t0] stone with prior passage queried via route.drive', () => {
      const res = useThen('invoke pass then drive', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'passage-query',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // create artifacts for all stones
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
        await fs.writeFile(path.join(tempDir, '2.criteria.md'), '# Criteria');
        await fs.writeFile(path.join(tempDir, '3.plan.md'), '# Plan');

        // pass all stones
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: tempDir,
        });
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.criteria', route: '.', as: 'passed' },
          cwd: tempDir,
        });
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.plan', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        // drive the route (should show complete)
        const cli = await invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.' },
          cwd: tempDir,
        });

        // read passage.jsonl to verify all entries
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8');

        return { cli, tempDir, passageContent };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('route.drive shows complete (all stones passed)', () => {
        expect(res.cli.stdout).toContain('route complete');
      });

      then('passage.jsonl contains entries for all passed stones', () => {
        expect(res.passageContent).toContain('"stone":"1.vision"');
        expect(res.passageContent).toContain('"stone":"2.criteria"');
        expect(res.passageContent).toContain('"stone":"3.plan"');
      });
    });
  });
});
