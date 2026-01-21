import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import { getError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeEach, useThen, when } from 'test-fns';

import { logOutputHead } from '@src/.test/logOutputHead';

import { stepReview } from './stepReview';

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
const ASSETS_TYPESCRIPT = path.join(
  __dirname,
  '.test/assets/example.repo/typescript-quality',
);
const ASSETS_PROSE = path.join(
  __dirname,
  '.test/assets/example.repo/prose-author',
);

/**
 * .what = copies static assets to a temp directory with git initialized
 * .why = enables tests for git-dependent functionality like diffs
 */
const setupGitRepo = async (): Promise<{ repoDir: string }> => {
  const repoDir = path.join(
    os.tmpdir(),
    `bhrain-review-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  // copy static assets to temp directory
  await fs.cp(ASSETS_TYPESCRIPT, repoDir, { recursive: true });

  // initialize git repo
  execSync('git init', { cwd: repoDir, stdio: 'pipe' });
  execSync('git add .', { cwd: repoDir, stdio: 'pipe' });
  execSync('git commit -m "initial"', {
    cwd: repoDir,
    stdio: 'pipe',
    env: GIT_ENV,
  });
  execSync('git branch -M main', { cwd: repoDir, stdio: 'pipe' });

  return { repoDir };
};

describe('stepReview', () => {
  given('[case1] no inputs specified', () => {
    when('[t0] stepReview is called', () => {
      then('throws BadRequestError about missing inputs', async () => {
        const error = await getError(
          stepReview({
            rules: [],
            paths: [],
            output: '/tmp/review.md',
            mode: 'push',
            cwd: ASSETS_TYPESCRIPT,
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain(
          'must specify at least one of --rules, --diffs, or --paths',
        );
      });
    });
  });

  given('[case2] rules glob matches zero files', () => {
    when('[t0] stepReview is called', () => {
      then('throws BadRequestError about ineffective glob', async () => {
        const error = await getError(
          stepReview({
            rules: 'nonexistent/**/*.md',
            paths: 'src/*.ts',
            output: '/tmp/review.md',
            mode: 'push',
            cwd: ASSETS_TYPESCRIPT,
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain('--rules glob was ineffective');
      });
    });
  });

  given('[case3] combined scope resolves to zero files', () => {
    when('[t0] stepReview is called with empty paths', () => {
      then('throws BadRequestError about empty scope', async () => {
        const error = await getError(
          stepReview({
            rules: '.agent/**/briefs/rules/*.md',
            paths: 'nonexistent/**/*.ts',
            output: '/tmp/review.md',
            mode: 'push',
            cwd: ASSETS_TYPESCRIPT,
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain(
          'combined scope resolves to zero files',
        );
      });
    });
  });

  given('[case4] output parent directory does not exist', () => {
    when('[t0] stepReview is called', () => {
      then('throws BadRequestError about missing parent', async () => {
        const error = await getError(
          stepReview({
            rules: '.agent/**/briefs/rules/*.md',
            paths: 'src/*.ts',
            output: '/nonexistent/parent/review.md',
            mode: 'push',
            cwd: ASSETS_TYPESCRIPT,
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain(
          'output path parent directory does not exist',
        );
      });
    });
  });

  given('[case5] valid inputs with rules and paths - rule enumeration', () => {
    when('[t0] stepReview is called', () => {
      then('enumerates correct rule files', async () => {
        const rulesGlob = '.agent/**/briefs/rules/*.md';
        const { enumFilesFromGlob } = await import(
          '@src/domain.operations/review/enumFilesFromGlob'
        );
        const ruleFiles = await enumFilesFromGlob({
          glob: rulesGlob,
          cwd: ASSETS_TYPESCRIPT,
        });

        expect(ruleFiles).toHaveLength(2);
        expect(ruleFiles).toContain(
          '.agent/repo=.this/role=any/briefs/rules/rule.no-any.md',
        );
        expect(ruleFiles).toContain(
          '.agent/repo=.this/role=any/briefs/rules/rule.no-console.md',
        );
      });
    });
  });

  given(
    '[case5b] valid inputs with rules and paths - target enumeration',
    () => {
      when('[t0] stepReview is called', () => {
        then('enumerates correct target files', async () => {
          const pathsGlob = 'src/*.ts';
          const { enumFilesFromGlob } = await import(
            '@src/domain.operations/review/enumFilesFromGlob'
          );
          const targetFiles = await enumFilesFromGlob({
            glob: pathsGlob,
            cwd: ASSETS_TYPESCRIPT,
          });

          expect(targetFiles).toHaveLength(2);
          expect(targetFiles).toContain('src/invalid.ts');
          expect(targetFiles).toContain('src/valid.ts');
        });
      });
    },
  );

  given('[case6] multiple paths patterns', () => {
    when('[t0] multiple path patterns are provided', () => {
      then('paths are unioned correctly', async () => {
        const { enumFilesFromGlob } = await import(
          '@src/domain.operations/review/enumFilesFromGlob'
        );

        const srcFiles = await enumFilesFromGlob({
          glob: 'src/*.ts',
          cwd: ASSETS_TYPESCRIPT,
        });
        const libFiles = await enumFilesFromGlob({
          glob: 'lib/*.ts',
          cwd: ASSETS_TYPESCRIPT,
        });

        // verify union would work
        const allFiles = [...new Set([...srcFiles, ...libFiles])].sort();
        expect(allFiles).toHaveLength(3);
        expect(allFiles).toContain('src/valid.ts');
        expect(allFiles).toContain('src/invalid.ts');
        expect(allFiles).toContain('lib/utils.ts');
      });
    });
  });

  given('[case7] diffs combined with paths', () => {
    const scene = useBeforeEach(async () => {
      const { repoDir } = await setupGitRepo();

      // make a change for diffs
      await fs.writeFile(
        path.join(repoDir, 'src', 'changed.ts'),
        `export const changed = () => {};\n`,
        'utf-8',
      );
      execSync('git add .', { cwd: repoDir, stdio: 'pipe' });

      return { repoDir };
    });
    afterEach(async () =>
      fs.rm(scene.repoDir, { recursive: true, force: true }),
    );

    when('[t0] diffs and paths are combined', () => {
      then('targets are unioned from both sources', async () => {
        const { enumFilesFromGlob } = await import(
          '@src/domain.operations/review/enumFilesFromGlob'
        );
        const { enumFilesFromDiffs } = await import(
          '@src/domain.operations/review/enumFilesFromDiffs'
        );

        const pathFiles = await enumFilesFromGlob({
          glob: 'src/valid.ts',
          cwd: scene.repoDir,
        });
        const diffFiles = await enumFilesFromDiffs({
          range: 'uptil-staged',
          cwd: scene.repoDir,
        });

        // verify union works
        const allFiles = [...new Set([...pathFiles, ...diffFiles])].sort();
        expect(allFiles).toContain('src/valid.ts');
        expect(allFiles).toContain('src/changed.ts');
      });
    });
  });

  given('[case8] negation patterns in paths', () => {
    const scene = useBeforeEach(async () => {
      const { repoDir } = await setupGitRepo();

      // make changes for diffs
      await fs.writeFile(
        path.join(repoDir, 'src', 'changed.ts'),
        `export const changed = () => {};\n`,
        'utf-8',
      );
      await fs.writeFile(
        path.join(repoDir, 'package-lock.json'),
        `{"lockfileVersion": 1}\n`,
        'utf-8',
      );
      execSync('git add .', { cwd: repoDir, stdio: 'pipe' });

      return { repoDir };
    });
    afterEach(async () =>
      fs.rm(scene.repoDir, { recursive: true, force: true }),
    );

    when('[t0] negation pattern excludes file from diffs', () => {
      then('excluded file is not in target files', async () => {
        const { enumFilesFromDiffs } = await import(
          '@src/domain.operations/review/enumFilesFromDiffs'
        );

        // get all diff files first
        const allDiffFiles = await enumFilesFromDiffs({
          range: 'uptil-staged',
          cwd: scene.repoDir,
        });
        expect(allDiffFiles).toContain('package-lock.json');

        // now test that negation pattern would filter it
        const negativePatterns = ['package-lock.json'];
        const filteredFiles = allDiffFiles.filter((file) => {
          for (const pattern of negativePatterns) {
            if (file === pattern || file.endsWith(`/${pattern}`)) return false;
          }
          return true;
        });

        expect(filteredFiles).not.toContain('package-lock.json');
        expect(filteredFiles).toContain('src/changed.ts');
      });
    });

    when('[t1] glob negation pattern excludes files', () => {
      then('excluded glob pattern filters matching files', async () => {
        const { enumFilesFromDiffs } = await import(
          '@src/domain.operations/review/enumFilesFromDiffs'
        );

        const allDiffFiles = await enumFilesFromDiffs({
          range: 'uptil-staged',
          cwd: scene.repoDir,
        });

        // test glob pattern exclusion
        const negativePatterns = ['*.json'];
        const filteredFiles = allDiffFiles.filter((file) => {
          for (const pattern of negativePatterns) {
            if (pattern.includes('*')) {
              const regex = new RegExp(
                '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
              );
              if (regex.test(file)) return false;
            }
          }
          return true;
        });

        expect(filteredFiles).not.toContain('package-lock.json');
        expect(filteredFiles).toContain('src/changed.ts');
      });
    });
  });

  given('[case9] prose-author example repo', () => {
    when('[t0] before any changes', () => {
      then('rules glob matches 2 prose style rules', async () => {
        const { enumFilesFromGlob } = await import(
          '@src/domain.operations/review/enumFilesFromGlob'
        );
        const ruleFiles = await enumFilesFromGlob({
          glob: '.agent/**/briefs/rules/*.md',
          cwd: ASSETS_PROSE,
        });

        expect(ruleFiles).toHaveLength(2);
        expect(ruleFiles).toContain(
          '.agent/repo=.this/role=any/briefs/rules/rule.no-gerunds.md',
        );
        expect(ruleFiles).toContain(
          '.agent/repo=.this/role=any/briefs/rules/rule.active-voice.md',
        );
      });

      then('chapters glob matches 3 chapters', async () => {
        const { enumFilesFromGlob } = await import(
          '@src/domain.operations/review/enumFilesFromGlob'
        );
        const chapterFiles = await enumFilesFromGlob({
          glob: 'chapters/*.md',
          cwd: ASSETS_PROSE,
        });

        expect(chapterFiles).toHaveLength(3);
        expect(chapterFiles).toContain('chapters/chapter1.md');
        expect(chapterFiles).toContain('chapters/chapter2.md');
        expect(chapterFiles).toContain('chapters/chapter2.fixed.md');
      });
    });

    when('[t1] stepReview on chapter2.fixed.md', () => {
      const outputPath = path.join(os.tmpdir(), 'prose-review-fixed.md');
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/*.md',
          paths: 'chapters/chapter2.fixed.md',
          output: outputPath,
          mode: 'push',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'prose.fixed.review',
          output: res.review.formatted,
        });

        return res;
      });

      then('review contains no blockers', async () => {
        expect(result.review.formatted).toBeDefined();
        expect(result.review.formatted.toLowerCase()).not.toContain('blocker');
      });

      then('metrics.files shows correct counts', async () => {
        expect(result.metrics.files.rulesCount).toBe(2);
        expect(result.metrics.files.targetsCount).toBe(1);
      });

      then('metrics.expected contains token estimates', async () => {
        expect(result.metrics.expected.tokens.estimate).toBeGreaterThan(0);
        expect(
          result.metrics.expected.tokens.contextWindowPercent,
        ).toBeGreaterThan(0);
        expect(result.metrics.expected.cost.estimate).toBeGreaterThan(0);
      });

      then('metrics.realized contains placeholder values', async () => {
        // todo: expose usage via rhachet BrainAtom and BrainRepl on responses
        // for now, metrics.realized contains placeholder values
        expect(result.metrics.realized.tokens.input).toBe(0);
        expect(result.metrics.realized.tokens.output).toBe(0);
        expect(result.metrics.realized.cost.total).toBe(0);
      });
    });

    when('[t2] stepReview on chapter2.md', () => {
      const outputPath = path.join(os.tmpdir(), 'prose-review-unfixed.md');
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/*.md',
          paths: 'chapters/chapter2.md',
          output: outputPath,
          mode: 'push',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'prose.unfixed.review',
          output: res.review.formatted,
        });

        return res;
      });

      then('review is defined and non-empty', async () => {
        expect(result.review.formatted).toBeDefined();
        expect(result.review.formatted.length).toBeGreaterThan(0);
      });

      then('review contains blockers for gerund violations', async () => {
        expect(result.review.formatted.toLowerCase()).toContain('blocker');
      });
    });
  });
});
