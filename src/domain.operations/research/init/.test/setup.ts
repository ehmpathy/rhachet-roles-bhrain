import { execSync } from 'child_process';
import * as path from 'path';

import { genTempDir } from 'test-fns';

/**
 * .what = create a temp git repo on a feature branch for research tests
 * .why = avoids protected branch errors and provides isolated test env
 */
export const genResearchTestDir = (input: {
  slug: string;
  branch?: string;
}): string => {
  const tempDir = genTempDir({ slug: input.slug, git: true });
  const branch = input.branch ?? 'vlad/test-research';
  execSync(`git checkout -b ${branch}`, { cwd: tempDir });
  return tempDir;
};

/**
 * .what = path to test fixture with pre-bound research
 * .why = enables tests that need a prior research directory
 */
export const ASSETS_RESEARCH_BOUND = path.join(__dirname, 'assets', 'research.bound');

/**
 * .what = path to test fixture with empty research state
 * .why = enables tests that need a clean slate
 */
export const ASSETS_RESEARCH_EMPTY = path.join(__dirname, 'assets', 'research.empty');
