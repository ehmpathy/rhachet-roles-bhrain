import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = findserts .gitignore into .route/ directory
 * .why = ensures guard artifacts are gitignored while passage is tracked
 */
export const findsertRouteGitignore = async (input: {
  route: string;
}): Promise<{ path: string; action: 'created' | 'unchanged' }> => {
  const routeDir = path.join(input.route, '.route');
  const gitignorePath = path.join(routeDir, '.gitignore');

  const gitignoreContent = `# ignore all except passage.jsonl and .bind flags
*
!.gitignore
!passage.jsonl
!.bind.*
`;

  // ensure .route dir found or created
  await fs.mkdir(routeDir, { recursive: true });

  // check if gitignore found with correct content
  const contentFound = await fs
    .readFile(gitignorePath, 'utf-8')
    .catch(() => null);
  if (contentFound === gitignoreContent) {
    return { path: gitignorePath, action: 'unchanged' };
  }

  // write gitignore
  await fs.writeFile(gitignorePath, gitignoreContent);
  return { path: gitignorePath, action: 'created' };
};
