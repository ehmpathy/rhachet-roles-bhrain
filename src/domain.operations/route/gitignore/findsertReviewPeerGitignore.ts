import * as path from 'path';

import { findsertGitignore } from './findsertGitignore';

/**
 * .what = findserts .gitignore into $route/.reviews/peer/ directory
 * .why = ensures peer-review artifacts are gitignored while gitignore itself is tracked
 */
export const findsertReviewPeerGitignore = async (input: {
  route: string;
}): Promise<{ path: string; action: 'created' | 'unchanged' }> =>
  findsertGitignore({
    dir: path.join(input.route, '.reviews', 'peer'),
    content: `# ignore all peer-review files
*
!.gitignore
`,
  });
