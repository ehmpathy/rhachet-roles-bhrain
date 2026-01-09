import * as path from 'path';

import { enumFeedbackFiles } from './enumFeedbackFiles';

const ASSETS_DIR = path.join(__dirname, '.test/assets/example.repo');

describe('enumFeedbackFiles', () => {
  describe('typescript-quality repo', () => {
    const directory = path.join(ASSETS_DIR, 'typescript-quality');

    it('should find all feedback files matching pattern', async () => {
      const files = await enumFeedbackFiles({ directory });
      expect(files.length).toBe(3);
    });

    it('should return sorted relative paths', async () => {
      const files = await enumFeedbackFiles({ directory });
      expect(files).toEqual(files.slice().sort());
    });

    it('should match [feedback].*.[given]* pattern', async () => {
      const files = await enumFeedbackFiles({ directory });
      for (const file of files) {
        expect(file).toMatch(/\[feedback\]\..*\.\[given\]/i);
      }
    });
  });

  describe('prose-author repo', () => {
    const directory = path.join(ASSETS_DIR, 'prose-author');

    it('should find feedback files in nested directories', async () => {
      const files = await enumFeedbackFiles({ directory });
      expect(files.length).toBe(2);
    });
  });

  describe('empty directory', () => {
    it('should return empty array when no feedback files exist', async () => {
      const files = await enumFeedbackFiles({
        directory: path.join(ASSETS_DIR, '../example.target'),
      });
      expect(files).toEqual([]);
    });
  });
});
