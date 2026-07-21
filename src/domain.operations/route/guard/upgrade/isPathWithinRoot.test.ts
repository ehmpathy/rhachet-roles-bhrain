import * as path from 'path';
import { given, then, when } from 'test-fns';

import { isPathWithinRoot } from './isPathWithinRoot';

const REPO_ROOT = '/home/user/repo';

describe('isPathWithinRoot', () => {
  given('[case1] a path inside the repo root', () => {
    when('[t0] checked', () => {
      then('returns true', () => {
        expect(
          isPathWithinRoot({
            pathResolved: path.join(REPO_ROOT, 'templates', '5.1.guard'),
            repoRoot: REPO_ROOT,
          }),
        ).toBe(true);
      });
    });
  });

  given('[case2] a traversal path that escapes the repo root', () => {
    when('[t0] checked', () => {
      then('returns false', () => {
        expect(
          isPathWithinRoot({
            pathResolved: '/home/user/etc/passwd',
            repoRoot: REPO_ROOT,
          }),
        ).toBe(false);
      });
    });
  });

  given('[case3] an absolute path on an entirely different root', () => {
    when('[t0] checked', () => {
      then('returns false', () => {
        expect(
          isPathWithinRoot({
            pathResolved: '/etc/passwd',
            repoRoot: REPO_ROOT,
          }),
        ).toBe(false);
      });
    });
  });

  given('[case4] a deeply nested path inside the repo root', () => {
    when('[t0] checked', () => {
      then('returns true', () => {
        expect(
          isPathWithinRoot({
            pathResolved: path.join(
              REPO_ROOT,
              'node_modules',
              'pkg',
              'dist',
              'x.guard',
            ),
            repoRoot: REPO_ROOT,
          }),
        ).toBe(true);
      });
    });
  });
});
