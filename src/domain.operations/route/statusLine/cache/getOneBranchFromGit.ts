import { execSync } from 'child_process';

/**
 * .what = the branch `git rev-parse --abbrev-ref HEAD` names, for a cwd
 * .why = the authority the HEAD file read defers to, on a shape that read does not know
 *
 * .note = the spawn is bounded, so a wedged git (a held index lock, a stalled network fs)
 *         fails in seconds rather than freeze the line; any fault surfaces with a message that
 *         names the command, the cwd, and the fix, and keeps the original as its cause
 * .note = a plain Error, never a helpful-errors class: this module rides the warm repaint,
 *         which must load no package from node_modules (routeStatusLine acceptance [case16]
 *         clamps it). the status line entry's fault row (`asStatusLineFaultRow`) gives the
 *         row its qualified `💥 MalfunctionError:` header at the one render boundary
 */
export const getOneBranchFromGit = (input: { cwd: string }): string => {
  try {
    const stdout = execSync(COMMAND_OF_BRANCH, {
      cwd: input.cwd,
      timeout: TIMEOUT_OF_BRANCH_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return asBranchFromGitStdout({ stdout });
  } catch (error) {
    throw Object.assign(
      new Error(
        `the status line could not read the current branch via \`${COMMAND_OF_BRANCH}\` (bound ${TIMEOUT_OF_BRANCH_MS}ms) in ${input.cwd}; run it from within a git repo, and check that \`${COMMAND_OF_BRANCH}\` answers there (a held index lock or a stalled fs can wedge it)`,
      ),
      { cause: error },
    );
  }
};

/**
 * .what = the branch name a `git rev-parse` stdout holds
 */
const asBranchFromGitStdout = (input: { stdout: Buffer }): string =>
  input.stdout.toString().trim();

const COMMAND_OF_BRANCH = 'git rev-parse --abbrev-ref HEAD';
const TIMEOUT_OF_BRANCH_MS = 2000;
