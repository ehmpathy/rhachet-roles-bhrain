import * as path from 'path';

import { findsertGitignore } from './findsertGitignore';

/**
 * .what = findserts .gitignore into .route/ directory
 * .why = ensures guard artifacts are gitignored while passage is tracked
 *
 * .note = the body is `findsertGitignore`, never a copy of it. this operation
 *         alone once swallowed EVERY read error via `.catch(() => null)` while
 *         its two peers rethrew a non-ENOENT — a failhide that only a reader
 *         who opened all three at once could see. raised i011/r010 + r011
 */
export const findsertRouteGitignore = async (input: {
  route: string;
}): Promise<{ path: string; action: 'created' | 'unchanged' }> =>
  findsertGitignore({
    dir: path.join(input.route, '.route'),
    content: `# ignore all except passage.jsonl and .bind flags
*
!.gitignore
!passage.jsonl
!.bind.*
`,
  });
