import { execSync } from 'child_process';
import { UnexpectedCodePathError } from 'helpful-errors';

import { asShellSingleQuoted } from '@src/utils/asShellSingleQuoted';

import type { FileChange } from './getAllFileChangesFromRange';
import type { FileDiff } from './getAllFileDiffsFromRange';
import { MAX_BYTES_OF_ONE_GIT_READ } from './MAX_BYTES_OF_ONE_GIT_READ';

/**
 * .what = the UnexpectedCodePathError a failed patch read throws, with its command and context
 * .why = the guard catches exactly the classes `getOneGitOutput` declares, and turns each into
 *        a lane malfunction. a raw `execSync` error is a plain `Error`, which slips past that
 *        catch and ends the whole guard pass on a stack trace — so the patch reads throw the
 *        same class, with the same fields, as the selection's reads
 */
const asGitPatchReadError = (input: {
  cmd: string;
  cwd: string;
  error: unknown;
}): Error =>
  new UnexpectedCodePathError('a git patch read failed', {
    cmd: input.cmd,
    cwd: input.cwd,
    stderr: String((input.error as { stderr?: unknown }).stderr ?? ''),
    message: String(
      (input.error as { message?: unknown }).message ?? input.error,
    ),
  });

/**
 * .what = each change, with its patch read against the base that selected it
 * .why = named so the orchestrator reads as one act rather than a simulated map
 *
 * .note = its own file (rule.require.single-responsibility), so a caller that selects
 *         first and reads patches only for the changes it keeps (`getAllFileDiffsOfTargets`)
 *         pays one `git diff` per KEPT change, never one per change the range holds
 *
 * .note = `FileDiff` stays beside `getAllFileDiffsFromRange`, where its readers import it;
 *         the import here is type-only, so it adds no runtime edge
 */
export const getAllFileDiffsOfChanges = (input: {
  changes: FileChange[];
  baseArgs: string;
  cwd: string;
}): FileDiff[] =>
  input.changes.map((change) => ({
    path: change.path,
    changeKind: change.changeKind,
    diff: getOneFileDiffOfChange({
      change,
      baseArgs: input.baseArgs,
      cwd: input.cwd,
    }),
  }));

/**
 * .what = the patch for one change, against the base that selected it
 * .why = a deleted file carries a marker only — no diff, no content (per vision) — and
 *        an untracked file has no base to diff against, so it diffs against /dev/null
 */
const getOneFileDiffOfChange = (input: {
  change: FileChange;
  baseArgs: string;
  cwd: string;
}): string | null => {
  if (input.change.changeKind === 'deleted') return null;
  if (!input.change.tracked)
    return getOneUntrackedFileDiff({ path: input.change.path, cwd: input.cwd });
  return getOneTrackedFileDiff({
    baseArgs: input.baseArgs,
    path: input.change.path,
    cwd: input.cwd,
  });
};

/**
 * .what = derives the patch text for a single tracked file within a range
 * .why = supplies the diff hunks the reviewer focuses on
 * .note = the path is git's own enumeration — external state — so it is single-quoted for
 *         the shell. a double-quoted path lets `$`, a backtick, or `"` rewrite the command,
 *         and the read would return a patch for a different path, silently
 * .note = a failed read throws only `UnexpectedCodePathError` (`asGitPatchReadError`), the
 *         class the guard catches, per `getOneGitOutput`; stdio is piped so git's stderr
 *         rides inside the error
 */
const getOneTrackedFileDiff = (input: {
  baseArgs: string;
  path: string;
  cwd: string;
}): string => {
  const pathQuoted = asShellSingleQuoted({ value: input.path });
  const cmd = `git diff ${input.baseArgs} -- ${pathQuoted}`;
  try {
    return execSync(cmd, {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: MAX_BYTES_OF_ONE_GIT_READ,
    });
  } catch (error) {
    throw asGitPatchReadError({ cmd, cwd: input.cwd, error });
  }
};

/**
 * .what = derives the patch text for a single untracked new file
 * .why = untracked files never appear in git diff <base>, so we diff against
 *        /dev/null to render a new-file patch (all lines added)
 * .note = git diff --no-index exits non-zero (code 1) when files differ, yet
 *         still prints a valid patch — we capture stdout and do not throw on it
 * .note = every other failure throws only `UnexpectedCodePathError`, as the tracked read does
 */
const getOneUntrackedFileDiff = (input: {
  path: string;
  cwd: string;
}): string => {
  // the path is single-quoted for the shell, for the same reason as the tracked read
  const pathQuoted = asShellSingleQuoted({ value: input.path });
  const cmd = `git diff --no-index -- /dev/null ${pathQuoted}`;
  try {
    return execSync(cmd, {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: MAX_BYTES_OF_ONE_GIT_READ,
    });
  } catch (error) {
    // allowlist only git diff --no-index's exit code 1 (the "files differ"
    // signal), which prints a valid patch on stdout. any other status (real
    // failure: bad usage, permission denied, gone path) is wrapped with context.
    const status = (error as { status?: number }).status;
    const stdout = (error as { stdout?: string | Buffer }).stdout;
    if (status === 1 && stdout !== undefined) return stdout.toString();
    throw asGitPatchReadError({ cmd, cwd: input.cwd, error });
  }
};
