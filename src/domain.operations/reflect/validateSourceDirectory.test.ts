import * as path from 'path';
import { getError } from 'test-fns';

import { validateSourceDirectory } from './validateSourceDirectory';

const ASSETS_DIR = path.join(
  __dirname,
  '../../roles/reviewer/skills/reflect/.test/assets/example.repo',
);

describe('validateSourceDirectory', () => {
  describe('valid source', () => {
    it('should return feedback files for typescript-quality', async () => {
      const result = await validateSourceDirectory({
        source: path.join(ASSETS_DIR, 'typescript-quality'),
      });
      expect(result.feedbackFiles.length).toBe(3);
    });

    it('should return feedback files for prose-author', async () => {
      const result = await validateSourceDirectory({
        source: path.join(ASSETS_DIR, 'prose-author'),
      });
      expect(result.feedbackFiles.length).toBe(2);
    });
  });

  describe('invalid source', () => {
    it('should throw when directory does not exist', async () => {
      const error = await getError(
        validateSourceDirectory({
          source: '/nonexistent/directory',
        }),
      );
      expect(error).toBeDefined();
      expect(error.message).toContain('does not exist');
    });

    it('should throw when source is a file not a directory', async () => {
      const error = await getError(
        validateSourceDirectory({
          source: path.join(
            ASSETS_DIR,
            'typescript-quality/.behavior/v2025_01_01.feature/[feedback].v1.[given].by_human.md',
          ),
        }),
      );
      expect(error).toBeDefined();
      expect(error.message).toContain('not a directory');
    });

    it('should throw when no feedback files found', async () => {
      const error = await getError(
        validateSourceDirectory({
          source: path.join(ASSETS_DIR, '../example.target'),
        }),
      );
      expect(error).toBeDefined();
      expect(error.message).toContain('no feedback files');
    });
  });
});
