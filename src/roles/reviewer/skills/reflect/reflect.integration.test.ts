import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import { getError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { stepReflect } from './reflect';

/**
 * .what = git identity env for commits
 * .why = avoids requiring global git config on cicd machines
 */
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test User',
  GIT_AUTHOR_EMAIL: 'test@test.com',
  GIT_COMMITTER_NAME: 'Test User',
  GIT_COMMITTER_EMAIL: 'test@test.com',
};

/**
 * .what = paths to the static test assets
 * .why = enables reuse of test fixtures across test cases
 */
const ASSETS_REPO = path.join(__dirname, '.test/assets/example.repo');
const ASSETS_TARGET = path.join(__dirname, '.test/assets/example.target');

/**
 * .what = copies repo assets to a temp directory with git initialized
 * .why = stepReflect requires source to be a git repo with remote origin
 */
const setupSourceRepo = async (
  repoType: 'typescript-quality' | 'prose-author',
): Promise<{ repoDir: string }> => {
  const repoDir = path.join(
    os.tmpdir(),
    `bhrain-reflect-source-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  // copy repo assets to temp directory
  await fs.cp(path.join(ASSETS_REPO, repoType), repoDir, {
    recursive: true,
  });

  // initialize git repo with remote origin
  execSync('git init', { cwd: repoDir, stdio: 'pipe' });
  execSync('git remote add origin https://github.com/test/repo.git', {
    cwd: repoDir,
    stdio: 'pipe',
  });
  execSync('git add .', { cwd: repoDir, stdio: 'pipe' });
  execSync('git commit -m "initial"', {
    cwd: repoDir,
    stdio: 'pipe',
    env: GIT_ENV,
  });
  execSync('git branch -M main', { cwd: repoDir, stdio: 'pipe' });

  return { repoDir };
};

/**
 * .what = creates a temp target directory
 * .why = enables isolated testing of target directory operations
 */
const setupTargetDir = async (): Promise<{ targetDir: string }> => {
  const targetDir = path.join(
    os.tmpdir(),
    `bhrain-reflect-target-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await fs.mkdir(targetDir, { recursive: true });
  return { targetDir };
};

describe('stepReflect', () => {
  given('[case1] source directory does not exist', () => {
    when('[t0] stepReflect is called', () => {
      then('throws BadRequestError about missing source', async () => {
        const error = await getError(
          stepReflect({
            source: '/nonexistent/source/directory',
            target: '/tmp/target',
            mode: 'soft',
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain('does not exist');
      });
    });
  });

  given('[case2] source has no feedback files', () => {
    when('[t0] stepReflect is called', () => {
      then('throws BadRequestError about no feedback files', async () => {
        const error = await getError(
          stepReflect({
            source: ASSETS_TARGET, // this dir has no feedback files
            target: '/tmp/target',
            mode: 'soft',
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain('no feedback files');
      });
    });
  });

  given('[case3] source is not a git repo', () => {
    const scene = useBeforeAll(async () => {
      // create temp dir with feedback file but no git
      const sourceDir = path.join(
        os.tmpdir(),
        `bhrain-reflect-nogit-${Date.now()}`,
      );
      await fs.mkdir(path.join(sourceDir, '.behavior/v2025_01_01.feature'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(
          sourceDir,
          '.behavior/v2025_01_01.feature/[feedback].v1.[given].by_human.md',
        ),
        '# test feedback',
        'utf-8',
      );

      const targetDir = path.join(
        os.tmpdir(),
        `bhrain-reflect-target-${Date.now()}`,
      );
      await fs.mkdir(targetDir, { recursive: true });

      return { sourceDir, targetDir };
    });
    afterAll(async () => {
      await fs.rm(scene.sourceDir, { recursive: true, force: true });
      await fs.rm(scene.targetDir, { recursive: true, force: true });
    });

    when('[t0] stepReflect is called', () => {
      then('throws BadRequestError about missing git remote', async () => {
        const error = await getError(
          stepReflect({
            source: scene.sourceDir,
            target: scene.targetDir,
            mode: 'soft',
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain('not a git repository');
      });
    });
  });

  given('[case4] target does not exist without force', () => {
    const scene = useBeforeAll(async () => {
      const { repoDir } = await setupSourceRepo('typescript-quality');
      return { sourceDir: repoDir };
    });
    afterAll(async () => {
      await fs.rm(scene.sourceDir, { recursive: true, force: true });
    });

    when('[t0] stepReflect is called', () => {
      then('throws BadRequestError about missing target', async () => {
        const error = await getError(
          stepReflect({
            source: scene.sourceDir,
            target: `/tmp/nonexistent-target-${Date.now()}`,
            mode: 'soft',
            force: false,
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain('does not exist');
      });
    });
  });

  given('[case5] typescript-quality feedback with valid target', () => {
    const scene = useBeforeAll(async () => {
      const { repoDir: sourceDir } =
        await setupSourceRepo('typescript-quality');
      const { targetDir } = await setupTargetDir();

      // run stepReflect once, share result across all then blocks
      const result = await stepReflect({
        source: sourceDir,
        target: targetDir,
        mode: 'soft',
      });

      return { sourceDir, targetDir, result };
    });
    afterAll(async () => {
      await fs.rm(scene.sourceDir, { recursive: true, force: true });
      await fs.rm(scene.targetDir, { recursive: true, force: true });
    });

    when('[t0] stepReflect completes', () => {
      then('creates draft directory structure', async () => {
        expect(scene.result.draft.dir).toContain('.draft/v');
        expect(scene.result.draft.pureDir).toContain('/pure');
        expect(scene.result.draft.syncDir).toContain('/sync');
      });

      then('proposes rules from feedback', async () => {
        const pureFiles = await fs.readdir(scene.result.draft.pureDir);
        expect(pureFiles.length).toBeGreaterThan(0);
        expect(pureFiles.some((f) => f.startsWith('rule.'))).toBe(true);
      });

      then('creates manifest.json in draft directory', async () => {
        const manifestPath = path.join(scene.result.draft.dir, 'manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);

        expect(manifest.timestamp).toBeDefined();
        expect(manifest.pureRules).toBeDefined();
        expect(Array.isArray(manifest.pureRules)).toBe(true);
      });

      then('returns metrics with expected and realized values', async () => {
        expect(scene.result.metrics.expected.tokens).toBeGreaterThan(0);
        expect(scene.result.metrics.expected.cost).toBeGreaterThan(0);
        expect(
          scene.result.metrics.realized.total.tokens.input,
        ).toBeGreaterThan(0);
        expect(
          scene.result.metrics.realized.total.tokens.output,
        ).toBeGreaterThan(0);
        expect(scene.result.metrics.realized.total.cost.total).toBeGreaterThan(
          0,
        );
      });

      then('returns results with operation counts', async () => {
        const totalOps =
          scene.result.results.created +
          scene.result.results.updated +
          scene.result.results.appended +
          scene.result.results.omitted;
        expect(totalOps).toBeGreaterThan(0);
      });

      then('files count matches feedback files', async () => {
        expect(scene.result.metrics.files.feedbackCount).toBe(3);
      });
    });
  });

  given('[case6] prose-author feedback with valid target', () => {
    const scene = useBeforeAll(async () => {
      const { repoDir: sourceDir } = await setupSourceRepo('prose-author');
      const { targetDir } = await setupTargetDir();

      const result = await stepReflect({
        source: sourceDir,
        target: targetDir,
        mode: 'soft',
      });

      return { sourceDir, targetDir, result };
    });
    afterAll(async () => {
      await fs.rm(scene.sourceDir, { recursive: true, force: true });
      await fs.rm(scene.targetDir, { recursive: true, force: true });
    });

    when('[t0] stepReflect completes', () => {
      then('proposes rules from prose feedback', async () => {
        const pureFiles = await fs.readdir(scene.result.draft.pureDir);
        expect(pureFiles.length).toBeGreaterThan(0);
      });

      then('files count matches feedback files', async () => {
        expect(scene.result.metrics.files.feedbackCount).toBe(2);
      });
    });
  });

  given('[case7] target with existing rules', () => {
    const scene = useBeforeAll(async () => {
      const { repoDir: sourceDir } =
        await setupSourceRepo('typescript-quality');
      const { targetDir } = await setupTargetDir();

      // add existing rule to target
      await fs.mkdir(path.join(targetDir, 'practices'), { recursive: true });
      await fs.writeFile(
        path.join(targetDir, 'practices/rule.require.tests.md'),
        '# existing rule\n\nall code must have tests',
        'utf-8',
      );

      const result = await stepReflect({
        source: sourceDir,
        target: targetDir,
        mode: 'soft',
      });

      return { sourceDir, targetDir, result };
    });
    afterAll(async () => {
      await fs.rm(scene.sourceDir, { recursive: true, force: true });
      await fs.rm(scene.targetDir, { recursive: true, force: true });
    });

    when('[t0] stepReflect completes', () => {
      then('considers existing rules in blend step', async () => {
        const manifestPath = path.join(scene.result.draft.dir, 'manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);

        expect(manifest.pureRules.length).toBeGreaterThan(0);
      });

      then('has at least one operation', async () => {
        const totalOps =
          scene.result.results.created +
          scene.result.results.updated +
          scene.result.results.appended +
          scene.result.results.omitted;
        expect(totalOps).toBeGreaterThan(0);
      });
    });
  });
});
