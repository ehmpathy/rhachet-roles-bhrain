import * as path from 'path';

import { compileReflectStep1Prompt } from './compileReflectStep1Prompt';

const ASSETS_DIR = path.join(
  __dirname,
  '../../../roles/reviewer/skills/reflect/.test/assets/example.repo',
);

describe('compileReflectStep1Prompt', () => {
  describe('soft mode', () => {
    it('should include objective section', async () => {
      const result = await compileReflectStep1Prompt({
        feedbackFiles: ['file.md'],
        citationsMarkdown: '# citations\n- file.md',
        draftDir: '/tmp/draft',
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
        mode: 'soft',
      });

      expect(result.prompt).toContain('# objective');
      expect(result.prompt).toContain('propose rules from feedback');
    });

    it('should include citations section', async () => {
      const citationsMarkdown = '# citations\n- [file.md](https://github.com)';
      const result = await compileReflectStep1Prompt({
        feedbackFiles: ['file.md'],
        citationsMarkdown,
        draftDir: '/tmp/draft',
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
        mode: 'soft',
      });

      expect(result.prompt).toContain(citationsMarkdown);
    });

    it('should NOT include feedback content in soft mode', async () => {
      const result = await compileReflectStep1Prompt({
        feedbackFiles: [
          '.behavior/v2025_01_01.feature/[feedback].v1.[given].by_human.md',
        ],
        citationsMarkdown: '# citations',
        draftDir: '/tmp/draft',
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
        mode: 'soft',
      });

      expect(result.prompt).not.toContain('# feedback content');
      expect(result.prompt).not.toContain('arrow functions');
    });

    it('should include instructions with JSON output format', async () => {
      const result = await compileReflectStep1Prompt({
        feedbackFiles: ['file.md'],
        citationsMarkdown: '# citations',
        draftDir: '/tmp/my-draft',
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
        mode: 'soft',
      });

      expect(result.prompt).toContain('# instructions');
      expect(result.prompt).toContain('# output');
      expect(result.prompt).toContain('"rules"');
      expect(result.prompt).toContain('"name"');
    });
  });

  describe('hard mode', () => {
    it('should include feedback content in hard mode', async () => {
      const result = await compileReflectStep1Prompt({
        feedbackFiles: [
          '.behavior/v2025_01_01.feature/[feedback].v1.[given].by_human.md',
        ],
        citationsMarkdown: '# citations',
        draftDir: '/tmp/draft',
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
        mode: 'hard',
      });

      expect(result.prompt).toContain('# feedback content');
      expect(result.prompt).toContain('arrow functions');
    });
  });

  describe('token estimation', () => {
    it('should estimate tokens based on prompt length', async () => {
      const result = await compileReflectStep1Prompt({
        feedbackFiles: ['file.md'],
        citationsMarkdown: '# citations',
        draftDir: '/tmp/draft',
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
        mode: 'soft',
      });

      expect(result.tokenEstimate).toBeGreaterThan(0);
      // rough estimate: ~4 chars per token
      expect(result.tokenEstimate).toBeLessThan(result.prompt.length);
    });
  });

  describe('snapshot', () => {
    it('should match snapshot for soft mode prompt', async () => {
      const result = await compileReflectStep1Prompt({
        feedbackFiles: [
          '.behavior/v2025_01_01.feature/[feedback].v1.[given].by_human.md',
        ],
        citationsMarkdown:
          '# citations\n- [feedback](https://github.com/example)',
        draftDir: '/tmp/draft',
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
        mode: 'soft',
      });

      expect(result.prompt).toMatchSnapshot();
    });

    it('should match snapshot for hard mode prompt', async () => {
      const result = await compileReflectStep1Prompt({
        feedbackFiles: [
          '.behavior/v2025_01_01.feature/[feedback].v1.[given].by_human.md',
        ],
        citationsMarkdown:
          '# citations\n- [feedback](https://github.com/example)',
        draftDir: '/tmp/draft',
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
        mode: 'hard',
      });

      expect(result.prompt).toMatchSnapshot();
    });
  });
});
