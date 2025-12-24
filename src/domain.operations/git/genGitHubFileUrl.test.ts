import { genGitHubFileUrl } from './genGitHubFileUrl';

describe('genGitHubFileUrl', () => {
  describe('url construction', () => {
    it('should construct github blob url with ref', () => {
      const result = genGitHubFileUrl({
        filePath: 'src/index.ts',
        cwd: process.cwd(),
        ref: 'main',
      });
      expect(result).toContain('https://github.com');
      expect(result).toContain('/blob/main/src/index.ts');
    });

    it('should use HEAD when ref not specified', () => {
      const result = genGitHubFileUrl({
        filePath: 'src/index.ts',
        cwd: process.cwd(),
      });
      expect(result).toContain('https://github.com');
      expect(result).toContain('/blob/');
      expect(result).toContain('/src/index.ts');
      // should have a commit sha instead of branch name
      expect(result).toMatch(/\/blob\/[a-f0-9]{40}\//);
    });
  });

  describe('special character encoding', () => {
    it('should encode brackets in file path', () => {
      const result = genGitHubFileUrl({
        filePath: '.behavior/v2025_01_01/[feedback].v1.[given].by_human.md',
        cwd: process.cwd(),
        ref: 'main',
      });
      expect(result).toContain('%5Bfeedback%5D');
      expect(result).toContain('%5Bgiven%5D');
    });

    it('should encode spaces in file path', () => {
      const result = genGitHubFileUrl({
        filePath: 'docs/my file.md',
        cwd: process.cwd(),
        ref: 'main',
      });
      expect(result).toContain('my%20file.md');
    });

    it('should preserve forward slashes as path separators', () => {
      const result = genGitHubFileUrl({
        filePath: 'src/domain/operations/test.ts',
        cwd: process.cwd(),
        ref: 'main',
      });
      expect(result).toContain('src/domain/operations/test.ts');
    });
  });

  describe('remote url formats', () => {
    it('should work with this repo remote', () => {
      const result = genGitHubFileUrl({
        filePath: 'package.json',
        cwd: process.cwd(),
        ref: 'main',
      });
      expect(result).toBe(
        'https://github.com/ehmpathy/rhachet-roles-bhrain/blob/main/package.json',
      );
    });
  });
});
