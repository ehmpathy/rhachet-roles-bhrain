import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { createDraftDirectory } from '@src/domain.operations/reflect/createDraftDirectory';
import { enumFeedbackFiles } from '@src/domain.operations/reflect/enumFeedbackFiles';
import { compileCitationsMarkdown } from '@src/domain.operations/reflect/step1/compileCitationsMarkdown';
import { compileReflectStep1Prompt } from '@src/domain.operations/reflect/step1/compileReflectStep1Prompt';
import { compileReflectStep2Prompt } from '@src/domain.operations/reflect/step2/compileReflectStep2Prompt';
import { validateSourceDirectory } from '@src/domain.operations/reflect/validateSourceDirectory';
import { validateTargetDirectory } from '@src/domain.operations/reflect/validateTargetDirectory';

const ASSETS_DIR = path.join(__dirname, '.test/assets/example.repo');
const TARGET_DIR = path.join(__dirname, '.test/assets/example.target');

describe('reflect', () => {
  given('[case1] typescript-quality example repo', () => {
    const sourceDir = path.join(ASSETS_DIR, 'typescript-quality');

    when('[t0] before any changes', () => {
      then('enumFeedbackFiles finds 3 feedback files', async () => {
        const files = await enumFeedbackFiles({ directory: sourceDir });
        expect(files).toHaveLength(3);
      });

      then('validateSourceDirectory returns feedback files', async () => {
        const result = await validateSourceDirectory({ source: sourceDir });
        expect(result.feedbackFiles).toHaveLength(3);
      });

      then(
        'all feedback files match [feedback].*.[given]* pattern',
        async () => {
          const files = await enumFeedbackFiles({ directory: sourceDir });
          for (const file of files) {
            expect(file).toMatch(/\[feedback\]\..*\.\[given\]/i);
          }
        },
      );
    });

    when('[t1] step 1 flow executes', () => {
      const testTargetDir = path.join(
        os.tmpdir(),
        `reflect-integ-ts-${Date.now()}`,
      );

      afterEach(async () => {
        await fs.rm(testTargetDir, { recursive: true, force: true });
      });

      then('draft directory is created', async () => {
        await fs.mkdir(testTargetDir, { recursive: true });
        const result = await createDraftDirectory({ targetDir: testTargetDir });
        expect(result.draftDir).toContain('.draft/v');
        expect(result.pureDir).toContain('/pure');
        expect(result.syncDir).toContain('/sync');
      });

      then('citations markdown includes all feedback files', async () => {
        const { feedbackFiles } = await validateSourceDirectory({
          source: sourceDir,
        });
        const markdown = compileCitationsMarkdown({
          feedbackFiles,
          cwd: sourceDir,
        });
        expect(markdown).toContain('[feedback].v1.[given]');
        expect(markdown).toContain('[feedback].v2.[given]');
        expect(markdown).toContain('[feedback].v3.[given]');
        expect(markdown).toContain('total: 3 files');
      });

      then('step 1 prompt includes objective and citations', async () => {
        await fs.mkdir(testTargetDir, { recursive: true });
        const { draftDir } = await createDraftDirectory({
          targetDir: testTargetDir,
        });
        const { feedbackFiles } = await validateSourceDirectory({
          source: sourceDir,
        });
        const citationsMarkdown = compileCitationsMarkdown({
          feedbackFiles,
          cwd: sourceDir,
        });

        const { prompt, tokenEstimate } = await compileReflectStep1Prompt({
          feedbackFiles,
          citationsMarkdown,
          draftDir,
          cwd: sourceDir,
          mode: 'soft',
        });

        expect(prompt).toContain('# objective');
        expect(prompt).toContain('# citations');
        expect(prompt).toContain('# instructions');
        expect(tokenEstimate).toBeGreaterThan(0);
      });
    });
  });

  given('[case2] prose-author example repo', () => {
    const sourceDir = path.join(ASSETS_DIR, 'prose-author');

    when('[t0] before any changes', () => {
      then('enumFeedbackFiles finds 2 feedback files', async () => {
        const files = await enumFeedbackFiles({ directory: sourceDir });
        expect(files).toHaveLength(2);
      });

      then('validateSourceDirectory returns feedback files', async () => {
        const result = await validateSourceDirectory({ source: sourceDir });
        expect(result.feedbackFiles).toHaveLength(2);
      });
    });

    when('[t1] step 1 flow executes', () => {
      const testTargetDir = path.join(
        os.tmpdir(),
        `reflect-integ-prose-${Date.now()}`,
      );

      afterEach(async () => {
        await fs.rm(testTargetDir, { recursive: true, force: true });
      });

      then('citations markdown includes all feedback files', async () => {
        const { feedbackFiles } = await validateSourceDirectory({
          source: sourceDir,
        });
        const markdown = compileCitationsMarkdown({
          feedbackFiles,
          cwd: sourceDir,
        });
        expect(markdown).toContain('[feedback].v1.[given]');
        expect(markdown).toContain('[feedback].v2.[given]');
        expect(markdown).toContain('total: 2 files');
      });
    });
  });

  given('[case3] error cases', () => {
    when('[t0] source directory does not exist', () => {
      then('validateSourceDirectory throws error', async () => {
        await expect(
          validateSourceDirectory({ source: '/nonexistent/directory' }),
        ).rejects.toThrow('does not exist');
      });
    });

    when('[t1] source directory has no feedback files', () => {
      then('validateSourceDirectory throws error', async () => {
        await expect(
          validateSourceDirectory({ source: TARGET_DIR }),
        ).rejects.toThrow('no feedback files');
      });
    });

    when('[t2] target directory does not exist without force', () => {
      then('validateTargetDirectory throws error', async () => {
        await expect(
          validateTargetDirectory({
            target: `/tmp/nonexistent-${Date.now()}`,
            force: false,
          }),
        ).rejects.toThrow('does not exist');
      });
    });

    when('[t3] target directory does not exist with force', () => {
      const testTargetDir = path.join(
        os.tmpdir(),
        `reflect-integ-force-${Date.now()}`,
      );

      afterEach(async () => {
        await fs.rm(testTargetDir, { recursive: true, force: true });
      });

      then('validateTargetDirectory creates directory', async () => {
        const result = await validateTargetDirectory({
          target: testTargetDir,
          force: true,
        });
        expect(result.created).toBe(true);
      });
    });
  });

  given('[case4] step 2 prompt with existing target rules', () => {
    when('[t0] target has existing rules', () => {
      const testTargetDir = path.join(
        os.tmpdir(),
        `reflect-integ-step2-${Date.now()}`,
      );
      const testDraftDir = path.join(testTargetDir, '.draft', 'v2025-01-01');
      const testPureDir = path.join(testDraftDir, 'pure');

      afterEach(async () => {
        await fs.rm(testTargetDir, { recursive: true, force: true });
      });

      then('step 2 prompt lists existing rules', async () => {
        // setup directories
        await fs.mkdir(path.join(testTargetDir, 'practices'), {
          recursive: true,
        });
        await fs.writeFile(
          path.join(testTargetDir, 'practices/rule.require.tests.md'),
          '# existing rule',
          'utf-8',
        );
        await fs.mkdir(testPureDir, { recursive: true });
        await fs.writeFile(
          path.join(testPureDir, 'rule.forbid.new.md'),
          '# new proposal',
          'utf-8',
        );

        const { prompt, tokenEstimate } = await compileReflectStep2Prompt({
          targetDir: testTargetDir,
          draftDir: testDraftDir,
          pureDir: testPureDir,
          mode: 'soft',
        });

        expect(prompt).toContain('# existing rules');
        expect(prompt).toContain('rule.require.tests.md');
        expect(prompt).toContain('# pure proposals');
        expect(prompt).toContain('rule.forbid.new.md');
        expect(tokenEstimate).toBeGreaterThan(0);
      });
    });
  });
});
