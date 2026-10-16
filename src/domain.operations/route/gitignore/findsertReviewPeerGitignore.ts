import * as path from 'path';

import { SEGMENTS_OF_PEER_REVIEWS_DIR } from '@src/domain.operations/asPeerReviewOutputName';

import { findsertGitignore } from './findsertGitignore';

/**
 * .what = findserts .gitignore into $route/.reviews/peer/ directory
 * .why = ensures peer-review artifacts are gitignored while gitignore itself is tracked
 */
export const findsertReviewPeerGitignore = async (input: {
  route: string;
}): Promise<{ path: string; action: 'created' | 'rewrote' | 'unchanged' }> =>
  findsertGitignore({
    dir: path.join(input.route, ...SEGMENTS_OF_PEER_REVIEWS_DIR),
    content: `# ignore all peer-review files
*
!.gitignore
`,
  });
