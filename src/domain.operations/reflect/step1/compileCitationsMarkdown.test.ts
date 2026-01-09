import * as path from 'path';

import { compileCitationsMarkdown } from './compileCitationsMarkdown';

const ASSETS_DIR = path.join(__dirname, '../.test/assets/example.repo');

describe('compileCitationsMarkdown', () => {
  describe('output format', () => {
    it('should include header and feedback files', () => {
      const result = compileCitationsMarkdown({
        feedbackFiles: [
          '.behavior/v2025_01_01.feature/[feedback].v1.[given].by_human.md',
        ],
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
      });

      expect(result).toContain('# citations');
      expect(result).toContain('feedback files extracted');
      expect(result).toContain('[feedback].v1.[given].by_human.md');
    });

    it('should generate github urls for files', () => {
      const result = compileCitationsMarkdown({
        feedbackFiles: [
          '.behavior/v2025_01_01.feature/[feedback].v1.[given].by_human.md',
        ],
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
      });

      expect(result).toContain('https://github.com');
      expect(result).toContain('%5Bfeedback%5D'); // encoded brackets
    });

    it('should include total count', () => {
      const result = compileCitationsMarkdown({
        feedbackFiles: ['file1.md', 'file2.md', 'file3.md'],
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
      });

      expect(result).toContain('total: 3 files');
    });

    it('should include generated timestamp', () => {
      const result = compileCitationsMarkdown({
        feedbackFiles: ['file.md'],
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
      });

      expect(result).toContain('generated:');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('multiple files', () => {
    it('should list all feedback files', () => {
      const result = compileCitationsMarkdown({
        feedbackFiles: [
          '.behavior/v2025_01_01.feature/[feedback].v1.[given].by_human.md',
          '.behavior/v2025_01_01.feature/[feedback].v2.[given].by_human.md',
          '.behavior/v2025_01_01.feature/[feedback].v3.[given].by_human.md',
        ],
        cwd: path.join(ASSETS_DIR, 'typescript-quality'),
      });

      expect(result).toContain('[feedback].v1.[given]');
      expect(result).toContain('[feedback].v2.[given]');
      expect(result).toContain('[feedback].v3.[given]');
    });
  });
});
