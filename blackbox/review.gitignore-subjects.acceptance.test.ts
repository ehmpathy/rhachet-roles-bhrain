import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

/**
 * .what = acceptance coverage for the gitignore crash vector via the real skill
 * .why = the original defect was an EACCES crash when review enumerated a
 *        gitignored directory with restricted (mode 000) permissions; this
 *        proves the shipped review.sh excludes it and does not crash
 *
 * .see = .behavior/v2026_06_23.fix-reviewer-scans/1.vision.yield.md
 */
describe('review.gitignore-subjects.acceptance', () => {
  // capture the temp dir so afterAll can restore perms for clean auto-prune
  let restrictedDir: string | null = null;

  afterAll(async () => {
    // restore permissions so genTempDir auto-prune can later recurse
    if (restrictedDir)
      await fs.chmod(restrictedDir, 0o755).catch(() => undefined);
  });

  given('[case1] a gitignored restricted directory inside the scan scope', () => {
    when('[t0] review scans src/**/* with a mode-000 gitignored subdir', () => {
      const res = useThen(
        'invoke review over a scope that contains the restricted dir',
        async () => {
          // clone fixture into a real git repo with node_modules symlinks
          const tempDir = genTempDirForRhachet({
            slug: 'review-gitignore-restricted',
            clone: ASSETS_DIR,
          });

          // link the reviewer role (creates the gitignored .agent/repo=* supplies)
          await execAsync('npx rhachet roles link --role reviewer', {
            cwd: tempDir,
          });

          // gitignore a junk dir that lives inside the subject scope
          await fs.writeFile(path.join(tempDir, '.gitignore'), 'junk/\n');

          // a restricted (mode 000) gitignored dir = the exact crash vector
          const junkDir = path.join(tempDir, 'src', 'junk');
          await fs.mkdir(junkDir, { recursive: true });
          await fs.writeFile(
            path.join(junkDir, 'secret.ts'),
            'export const secret = 1;\n',
            'utf-8',
          );

          // a readable, non-ignored subject for the brain to actually review
          await fs.writeFile(
            path.join(tempDir, 'src', 'newchange.ts'),
            'export const x = function () { return 1; }; // arrow-only violation\n',
            'utf-8',
          );
          execSync('git add src/newchange.ts', { cwd: tempDir, stdio: 'pipe' });

          // drop all permissions on the junk dir to reproduce EACCES on scandir
          restrictedDir = junkDir;
          await fs.chmod(junkDir, 0o000);

          // invoke the real skill over a scope that WOULD traverse the junk dir
          const cli = await invokeReviewSkill({
            rules: 'rules/rule.require.arrow-only.md',
            paths: 'src/**/*.ts',
            focus: 'push',
            goal: 'representative',
            brain: 'fireworks/deepseek/v4-flash',
            cwd: tempDir,
          });

          // log cli output for debug
          console.log('\n--- cli.stdout ---');
          console.log(cli.stdout);
          console.log('\n--- cli.stderr ---');
          console.log(cli.stderr);
          console.log('--- end cli ---\n');

          // read the resolved scope the skill wrote (deterministic source of truth)
          // .note = stdout prints "scope: <logDir>/input.scope.json"
          const scopeMatch = cli.stdout.match(/scope:\s*(\S+input\.scope\.json)/);
          const scopeRelative = scopeMatch?.[1] ?? null;
          const targetFiles = await (async () => {
            if (!scopeRelative) return null;
            const raw = await fs
              .readFile(path.join(tempDir, scopeRelative), 'utf-8')
              .catch(() => null);
            if (!raw) return null;
            return JSON.parse(raw).targetFiles as string[];
          })();

          return { cli, targetFiles };
        },
      );

      then('the review does not crash with a permission error', async () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output).not.toContain('EACCES');
        expect(output).not.toContain('permission denied');
        expect(output).not.toContain('scandir');
      });

      then('the review completes successfully', async () => {
        expect(res.cli.code).toBe(0);
      });

      then('the resolved scope excludes the gitignored junk dir', async () => {
        expect(res.targetFiles).not.toBeNull();
        expect(res.targetFiles!.some((f) => f.includes('junk'))).toBe(false);
        expect(res.targetFiles!.some((f) => f.includes('secret.ts'))).toBe(
          false,
        );
      });

      then('the resolved scope includes the readable subject', async () => {
        expect(res.targetFiles!).toContain('src/newchange.ts');
      });
    });
  });
});
