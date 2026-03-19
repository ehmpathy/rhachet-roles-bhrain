import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { getReflectScope } from './getReflectScope';

describe('getReflectScope', () => {
  given('[case1] current repo (this repo)', () => {
    when('[t0] scope is detected', () => {
      const scope = getReflectScope({ cwd: process.cwd() });

      then('gitRepoRoot should be an absolute path', () => {
        expect(path.isAbsolute(scope.gitRepoRoot)).toBe(true);
      });

      then('gitRepoName should be repo basename', () => {
        expect(scope.gitRepoName).toMatch(/rhachet-roles-bhrain/);
      });

      then('branch should be detected', () => {
        expect(scope.branch).toBeDefined();
        expect(scope.branch.length).toBeGreaterThan(0);
      });

      then('branchSafe should have / replaced with ~', () => {
        if (scope.branch.includes('/')) {
          expect(scope.branchSafe).toContain('~');
          expect(scope.branchSafe).not.toContain('/');
        } else {
          expect(scope.branchSafe).toEqual(scope.branch);
        }
      });

      then('storagePath should include repo/worktree/branch segments', () => {
        expect(scope.storagePath).toContain('gitrepo=');
        expect(scope.storagePath).toContain('worktree=');
        expect(scope.storagePath).toContain('branch=');
      });

      then('storagePath should be under ~/.rhachet/storage', () => {
        const expectedPrefix = path.join(os.homedir(), '.rhachet/storage');
        expect(scope.storagePath.startsWith(expectedPrefix)).toBe(true);
      });
    });
  });

  given('[case2] non-git directory', () => {
    when('[t0] scope detection is attempted', () => {
      then('should throw BadRequestError', async () => {
        const error = await getError(async () =>
          getReflectScope({ cwd: os.tmpdir() }),
        );
        expect(error).toBeDefined();
        expect(error.message).toContain('not a git repository');
      });
    });
  });
});
