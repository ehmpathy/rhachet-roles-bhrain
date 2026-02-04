import { given, then, when } from 'test-fns';

import { sanitizeBranchName } from './sanitizeBranchName';

describe('sanitizeBranchName', () => {
  given('[case1] a simple branch name', () => {
    when('[t0] branch is "main"', () => {
      then('returns "main" unchanged', () => {
        const result = sanitizeBranchName({ branch: 'main' });
        expect(result).toEqual('main');
      });
    });

    when('[t1] branch is "develop"', () => {
      then('returns "develop" unchanged', () => {
        const result = sanitizeBranchName({ branch: 'develop' });
        expect(result).toEqual('develop');
      });
    });
  });

  given('[case2] a branch with slashes', () => {
    when('[t0] branch is "feat/my-feature"', () => {
      then('returns "feat.my-feature"', () => {
        const result = sanitizeBranchName({ branch: 'feat/my-feature' });
        expect(result).toEqual('feat.my-feature');
      });
    });

    when('[t1] branch is "user/john/task-123"', () => {
      then('returns "user.john.task-123"', () => {
        const result = sanitizeBranchName({ branch: 'user/john/task-123' });
        expect(result).toEqual('user.john.task-123');
      });
    });
  });

  given('[case3] a branch with special characters', () => {
    when('[t0] branch contains @ symbol', () => {
      then('replaces @ with dash', () => {
        const result = sanitizeBranchName({ branch: 'feat/my@feature' });
        expect(result).toEqual('feat.my-feature');
      });
    });

    when('[t1] branch contains # symbol', () => {
      then('replaces # with dash', () => {
        const result = sanitizeBranchName({ branch: 'fix/issue#123' });
        expect(result).toEqual('fix.issue-123');
      });
    });

    when('[t2] branch contains multiple special chars', () => {
      then('replaces all and collapses consecutive', () => {
        const result = sanitizeBranchName({ branch: 'feat/my@feature#1' });
        expect(result).toEqual('feat.my-feature-1');
      });
    });
  });

  given('[case4] edge cases', () => {
    when('[t0] branch starts with slash', () => {
      then('trims the dot', () => {
        const result = sanitizeBranchName({ branch: '/feature' });
        expect(result).toEqual('feature');
      });
    });

    when('[t1] branch ends with slash', () => {
      then('trims the dot', () => {
        const result = sanitizeBranchName({ branch: 'feature/' });
        expect(result).toEqual('feature');
      });
    });

    when('[t2] branch is "HEAD" (detached)', () => {
      then('returns "HEAD" unchanged', () => {
        const result = sanitizeBranchName({ branch: 'HEAD' });
        expect(result).toEqual('HEAD');
      });
    });
  });
});
