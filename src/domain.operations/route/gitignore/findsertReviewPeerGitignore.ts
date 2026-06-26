import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = findserts .gitignore into $route/.reviews/peer/ directory
 * .why = ensures peer-review artifacts are gitignored while gitignore itself is tracked
 */
export const findsertReviewPeerGitignore = async (input: {
  route: string;
}): Promise<{ path: string; action: 'created' | 'unchanged' }> => {
  const reviewPeerDir = path.join(input.route, '.reviews', 'peer');
  const gitignorePath = path.join(reviewPeerDir, '.gitignore');

  const gitignoreContent = `# ignore all peer-review files
*
!.gitignore
`;

  // ensure .reviews/peer dir found or created
  await fs.mkdir(reviewPeerDir, { recursive: true });

  // check if gitignore found with correct content
  // .note = rethrow non-ENOENT so real faults (EISDIR, EACCES) surface loudly
  const contentFound = await fs
    .readFile(gitignorePath, 'utf-8')
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
  if (contentFound === gitignoreContent) {
    return { path: gitignorePath, action: 'unchanged' };
  }

  // write gitignore
  await fs.writeFile(gitignorePath, gitignoreContent);
  return { path: gitignorePath, action: 'created' };
};
