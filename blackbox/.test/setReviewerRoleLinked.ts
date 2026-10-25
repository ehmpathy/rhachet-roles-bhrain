import { execSync } from 'child_process';

import { execAsync } from './invokeReviewSkill';

/**
 * .what = links the reviewer role into a temp repo, then commits what the link wrote
 * .why = `roles link` writes a set of files that varies by host — a host inside a grove gains
 *        `settings.of.grove.json`, the actor files track the rhachet version, and the root
 *        `.gitignore` negation lands in some runs and not others — so a scope read off
 *        `--diffs since-main` or `since-staged` counted the host, not the test (one invocation
 *        gave 8 targets on one attempt and 7 on the next). with the link committed into the
 *        base, a diff holds only the edits the test itself makes
 */
export const setReviewerRoleLinked = async (input: { cwd: string }): Promise<void> => {
  // link the reviewer role
  await execAsync('npx rhachet roles link --role reviewer', { cwd: input.cwd });

  // commit the link output into the base, so no diff range ever sees it
  execSync('git add -A', { cwd: input.cwd, stdio: 'pipe' });
  execSync(
    'git -c user.name=test -c user.email=test@example.com commit --allow-empty --no-verify -m "link reviewer role"',
    { cwd: input.cwd, stdio: 'pipe' },
  );
};
