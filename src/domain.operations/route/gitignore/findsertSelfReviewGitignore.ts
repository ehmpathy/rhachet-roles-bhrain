import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = findserts .gitignore into $route/review/self/ directory
 * .why = ensures self-review artifacts are gitignored while gitignore itself is tracked
 */
export const findsertSelfReviewGitignore = async (input: {
  route: string;
}): Promise<{ path: string; action: 'created' | 'unchanged' }> => {
  const selfReviewDir = path.join(input.route, 'review', 'self');
  const gitignorePath = path.join(selfReviewDir, '.gitignore');

  const gitignoreContent = `# ignore all self-review files
*
!.gitignore
`;

  // ensure review/self dir found or created
  await fs.mkdir(selfReviewDir, { recursive: true });

  // check if gitignore found with correct content
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
