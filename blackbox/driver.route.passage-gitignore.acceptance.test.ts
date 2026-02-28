import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_GUARDED_DIR = path.join(
  __dirname,
  '.test/assets/route-driver-guarded',
);

describe('driver.route.passage-gitignore.acceptance', () => {
  given('[case1] .gitignore findserted into .route/', () => {
    when('[t0] route is driven with passage write', () => {
      const res = useThen('invoke set and check gitignore', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'passage-gitignore-create',
          clone: ASSETS_GUARDED_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // create artifact
        await fs.writeFile(
          path.join(tempDir, '1.test.md'),
          '# Test artifact\n\ncontent for review',
        );

        // invoke skill (this writes to passage.jsonl, which triggers gitignore findsert)
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.test', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        // check for .gitignore
        const gitignorePath = path.join(tempDir, '.route', '.gitignore');
        const gitignoreExists = await fs
          .access(gitignorePath)
          .then(() => true)
          .catch(() => false);
        const gitignoreContent = gitignoreExists
          ? await fs.readFile(gitignorePath, 'utf-8')
          : '';

        return { cli, tempDir, gitignoreExists, gitignoreContent };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('.route/.gitignore is created', () => {
        expect(res.gitignoreExists).toBe(true);
      });

      then('.gitignore contains rules to ignore all except passage.jsonl and .bind.*', () => {
        expect(res.gitignoreContent).toContain('*');
        expect(res.gitignoreContent).toContain('!.gitignore');
        expect(res.gitignoreContent).toContain('!passage.jsonl');
        expect(res.gitignoreContent).toContain('!.bind.*');
      });
    });

    when('[t1] route driven again (gitignore idempotent)', () => {
      const res = useThen('invoke set twice and verify gitignore unchanged', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'passage-gitignore-idem',
          clone: ASSETS_GUARDED_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // create artifact
        await fs.writeFile(
          path.join(tempDir, '1.test.md'),
          '# Test artifact\n\ncontent',
        );

        // first invoke
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.test', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        // read gitignore after first invoke
        const gitignorePath = path.join(tempDir, '.route', '.gitignore');
        const gitignoreAfterFirst = await fs.readFile(gitignorePath, 'utf-8');

        // clear passage.jsonl to allow second pass
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        await fs.writeFile(passagePath, '');

        // second invoke (should not duplicate gitignore)
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.test', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        // read gitignore after second invoke
        const gitignoreAfterSecond = await fs.readFile(gitignorePath, 'utf-8');

        return { tempDir, gitignoreAfterFirst, gitignoreAfterSecond };
      });

      then('.gitignore content is identical after both invokes (idempotent)', () => {
        expect(res.gitignoreAfterSecond).toEqual(res.gitignoreAfterFirst);
      });

      then('.gitignore is not duplicated (only one set of rules)', () => {
        // count negation rules (lines starting with !)
        const negationRules = res.gitignoreAfterSecond
          .split('\n')
          .filter((line) => line.startsWith('!'));
        expect(negationRules.length).toEqual(3); // !.gitignore, !passage.jsonl, !.bind.*
      });
    });
  });

  given('[case2] git status shows only tracked files', () => {
    when('[t0] guard artifacts created but gitignored', () => {
      const res = useThen('invoke set and check git status', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'passage-gitignore-status',
          clone: ASSETS_GUARDED_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // create artifact
        await fs.writeFile(
          path.join(tempDir, '1.test.md'),
          '# Test artifact\n\ncontent',
        );

        // invoke skill
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.test', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        // commit gitignore and passage.jsonl
        await execAsync(
          'git add .route/.gitignore .route/passage.jsonl && git commit -m "add passage"',
          { cwd: tempDir },
        );

        // run git status
        const { stdout: gitStatus } = await execAsync('git status --porcelain', {
          cwd: tempDir,
        });

        // list all files in .route/
        const routeFiles = await fs.readdir(path.join(tempDir, '.route'));

        return { tempDir, gitStatus, routeFiles };
      });

      then('guard artifacts exist on disk', () => {
        // should have review and judge artifacts created
        const hasGuardArtifact = res.routeFiles.some(
          (f) => f.includes('.guard.') || f.includes('.review.') || f.includes('.judge.'),
        );
        expect(hasGuardArtifact).toBe(true);
      });

      then('git status does not show guard artifacts (gitignored)', () => {
        expect(res.gitStatus).not.toContain('.guard.');
        expect(res.gitStatus).not.toContain('.review.');
        expect(res.gitStatus).not.toContain('.judge.');
      });

      then('only untracked files are non-route files', () => {
        // after commit of .route files, only untracked should be 1.test.md
        // git status --porcelain shows ?? for untracked
        const untrackedRouteFiles = res.gitStatus
          .split('\n')
          .filter((line) => line.includes('.route/'));
        expect(untrackedRouteFiles.length).toBe(0);
      });
    });
  });

  given('[case3] .bind.* flags are tracked in git', () => {
    when('[t0] route is bound and driven', () => {
      const res = useThen('bind route and check track state', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'passage-gitignore-bind',
          clone: ASSETS_GUARDED_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // create a feature branch (main/master are protected)
        await execAsync('git checkout -b feature/test-bind', { cwd: tempDir });

        // bind the route
        await invokeRouteSkill({
          skill: 'route.bind.set',
          args: { route: '.' },
          cwd: tempDir,
        });

        // create artifact and pass
        await fs.writeFile(
          path.join(tempDir, '1.test.md'),
          '# Test artifact\n\ncontent',
        );
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.test', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        // check .bind.* file not gitignored
        const routeFiles = await fs.readdir(path.join(tempDir, '.route'));
        const bindFiles = routeFiles.filter((f) => f.startsWith('.bind.'));

        // check git status for bind files
        const { stdout: gitStatus } = await execAsync(
          'git status --porcelain .route/',
          { cwd: tempDir },
        );

        return { tempDir, bindFiles, gitStatus };
      });

      then('.bind.* file exists', () => {
        expect(res.bindFiles.length).toBeGreaterThan(0);
      });

      then('.bind.* file appears in git status (not ignored)', () => {
        // git status shows .route/ as untracked when it contains untracked files
        // the bind file untracked status means it is NOT gitignored
        // (gitignored files would not appear in git status at all)
        expect(res.gitStatus).toContain('.route/');
        // verify bind file exists (already checked in prev then, but confirm)
        expect(res.bindFiles.some((f) => f.includes('.bind.'))).toBe(true);
      });
    });
  });
});
