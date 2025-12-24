import * as os from 'os';
import * as path from 'path';

import { getGitRemoteUrl } from './getGitRemoteUrl';

describe('getGitRemoteUrl', () => {
  describe('valid git repository', () => {
    it('should return remote url for this repo', () => {
      const result = getGitRemoteUrl({ cwd: process.cwd() });
      expect(result).toContain('github.com');
      expect(result).toContain('rhachet-roles-bhrain');
    });
  });

  describe('non-git directory', () => {
    it('should throw when directory is not a git repository', () => {
      let error: Error | undefined;
      try {
        getGitRemoteUrl({ cwd: os.tmpdir() });
      } catch (e) {
        error = e as Error;
      }
      expect(error).toBeDefined();
      expect(error?.message).toContain('not a git repository');
    });
  });

  describe('subdirectory of git repo', () => {
    it('should return remote url from subdirectory', () => {
      const result = getGitRemoteUrl({
        cwd: path.join(process.cwd(), 'src'),
      });
      expect(result).toContain('github.com');
      expect(result).toContain('rhachet-roles-bhrain');
    });
  });
});
