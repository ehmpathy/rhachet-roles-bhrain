import * as path from 'path';

import { findsertGitignore } from './findsertGitignore';

/**
 * .what = findserts .gitignore into $route/review/self/ directory
 * .why = ensures self-review artifacts are gitignored while gitignore itself is tracked
 */
export const findsertReviewSelfGitignore = async (input: {
  route: string;
}): Promise<{ path: string; action: 'created' | 'unchanged' }> =>
  findsertGitignore({
    dir: path.join(input.route, 'review', 'self'),
    content: `# ignore all self-review files
*
!.gitignore
`,
  });
