import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

describe('review.join.acceptance', () => {
  given('[case1] intersect mode with both diffs and paths', () => {
    when('[t0] only dirty.ts is changed, paths matches both files', () => {
      const res = useThen('invoke review with intersect', async () => {
        // clone fixture to temp dir with git initialized (all files committed to main)
        const tempDir = genTempDirForRhachet({
          slug: 'review-join-intersect',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-join-intersect.md');

        // link the reviewer role
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // modify dirty.ts to create a diff from main
        const dirtyPath = path.join(tempDir, 'src/dirty.ts');
        const dirtyContent = await fs.readFile(dirtyPath, 'utf-8');
        await fs.writeFile(
          dirtyPath,
          dirtyContent + '\n// modified for test\n',
          'utf-8',
        );

        // invoke skill: paths matches both files, but only dirty.ts is changed
        // intersect should only review dirty.ts
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          diffs: 'since-main',
          paths: 'src/*.ts',
          join: 'intersect',
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: 'xai/grok/code-fast-1',
          cwd: tempDir,
        });

        // read log to check which files were reviewed
        const logDirs = await fs.readdir(path.join(tempDir, '.log/bhrain/review'));
        const latestLog = logDirs.sort().pop()!;
        const scopeJson = await fs.readFile(
          path.join(tempDir, '.log/bhrain/review', latestLog, 'input.scope.json'),
          'utf-8',
        );
        const scope = JSON.parse(scopeJson);

        return { cli, scope };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('only dirty.ts is in target files (intersection)', () => {
        expect(res.scope.targetFiles).toEqual(['src/dirty.ts']);
      });
    });
  });

  given('[case2] intersect mode with empty diffs', () => {
    when('[t0] no files changed, paths matches files', () => {
      const res = useThen('invoke review with intersect on unchanged repo', async () => {
        // clone fixture (all files committed, no changes)
        const tempDir = genTempDirForRhachet({
          slug: 'review-join-empty-diffs',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-join-empty-diffs.md');

        // link the reviewer role
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // no modifications - diffs will be empty
        // intersect of [] and [clean.ts, dirty.ts] should be []
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          diffs: 'since-main',
          paths: 'src/*.ts',
          join: 'intersect',
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: 'xai/grok/code-fast-1',
          cwd: tempDir,
        });

        // check if debug log was created (observability on failure)
        const logDirs = await fs.readdir(path.join(tempDir, '.log/bhrain/review'));
        const latestLog = logDirs.sort().pop();
        const debugLogPath = latestLog
          ? path.join(tempDir, '.log/bhrain/review', latestLog, 'input.scope.debug.json')
          : null;
        const debugLogExists = debugLogPath
          ? await fs.stat(debugLogPath).then(() => true).catch(() => false)
          : false;
        const debugLog = debugLogExists && debugLogPath
          ? JSON.parse(await fs.readFile(debugLogPath, 'utf-8'))
          : null;

        return { cli, tempDir, debugLogExists, debugLog };
      });

      then('cli fails with zero files error', () => {
        expect(res.cli.code).not.toEqual(0);
        expect(res.cli.stderr).toContain('combined scope resolves to zero files');
      });

      then('error message includes hint about log file', () => {
        expect(res.cli.stderr).toContain('input.scope.debug.json');
      });

      then('debug log file was created for observability', () => {
        expect(res.debugLogExists).toBe(true);
      });

      then('debug log shows what was matched', () => {
        expect(res.debugLog).toBeDefined();
        expect(res.debugLog.resolution.targetFilesFromDiffs).toEqual([]);
        expect(res.debugLog.resolution.targetFilesFromPaths).toContain('src/clean.ts');
        expect(res.debugLog.resolution.targetFilesFromPaths).toContain('src/dirty.ts');
        expect(res.debugLog.resolution.targetFiles).toEqual([]);
      });
    });
  });

  given('[case3] union mode with empty diffs', () => {
    when('[t0] no files changed, paths matches files, union mode', () => {
      const res = useThen('invoke review with union on unchanged repo', async () => {
        // clone fixture (all files committed, no changes)
        const tempDir = genTempDirForRhachet({
          slug: 'review-join-union-empty',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-join-union-empty.md');

        // link the reviewer role
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // no modifications - diffs will be empty
        // union of [] and [clean.ts, dirty.ts] should be [clean.ts, dirty.ts]
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          diffs: 'since-main',
          paths: 'src/*.ts',
          join: 'union',
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: 'xai/grok/code-fast-1',
          cwd: tempDir,
        });

        // read log to check which files were reviewed
        const logDirs = await fs.readdir(path.join(tempDir, '.log/bhrain/review'));
        const latestLog = logDirs.sort().pop()!;
        const scopeJson = await fs.readFile(
          path.join(tempDir, '.log/bhrain/review', latestLog, 'input.scope.json'),
          'utf-8',
        );
        const scope = JSON.parse(scopeJson);

        return { cli, scope };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('both files are in target files (union)', () => {
        expect(res.scope.targetFiles).toContain('src/clean.ts');
        expect(res.scope.targetFiles).toContain('src/dirty.ts');
      });
    });
  });

  given('[case4] default mode is intersect', () => {
    when('[t0] no --join specified, only dirty.ts changed', () => {
      const res = useThen('invoke review without --join flag', async () => {
        // clone fixture
        const tempDir = genTempDirForRhachet({
          slug: 'review-join-default',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-join-default.md');

        // link the reviewer role
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // modify dirty.ts to create a diff
        const dirtyPath = path.join(tempDir, 'src/dirty.ts');
        const dirtyContent = await fs.readFile(dirtyPath, 'utf-8');
        await fs.writeFile(
          dirtyPath,
          dirtyContent + '\n// modified for test\n',
          'utf-8',
        );

        // invoke without --join flag (should default to intersect)
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          diffs: 'since-main',
          paths: 'src/*.ts',
          // no join specified - should default to intersect
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: 'xai/grok/code-fast-1',
          cwd: tempDir,
        });

        // read log to check which files were reviewed
        const logDirs = await fs.readdir(path.join(tempDir, '.log/bhrain/review'));
        const latestLog = logDirs.sort().pop()!;
        const scopeJson = await fs.readFile(
          path.join(tempDir, '.log/bhrain/review', latestLog, 'input.scope.json'),
          'utf-8',
        );
        const scope = JSON.parse(scopeJson);

        return { cli, scope };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('only dirty.ts is reviewed (default is intersect)', () => {
        expect(res.scope.targetFiles).toEqual(['src/dirty.ts']);
      });
    });
  });

  given('[case5] only --paths specified (no --diffs)', () => {
    when('[t0] single source, join mode does not apply', () => {
      const res = useThen('invoke review with only paths', async () => {
        // clone fixture
        const tempDir = genTempDirForRhachet({
          slug: 'review-paths-only',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-paths-only.md');

        // link the reviewer role
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // invoke with only --paths (no --diffs)
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          paths: 'src/*.ts',
          // no diffs - single source
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: 'xai/grok/code-fast-1',
          cwd: tempDir,
        });

        // read log to check which files were reviewed
        const logDirs = await fs.readdir(path.join(tempDir, '.log/bhrain/review'));
        const latestLog = logDirs.sort().pop()!;
        const scopeJson = await fs.readFile(
          path.join(tempDir, '.log/bhrain/review', latestLog, 'input.scope.json'),
          'utf-8',
        );
        const scope = JSON.parse(scopeJson);

        return { cli, scope };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('all matched files are reviewed', () => {
        expect(res.scope.targetFiles).toContain('src/clean.ts');
        expect(res.scope.targetFiles).toContain('src/dirty.ts');
      });
    });
  });
});
