import { execSync } from 'child_process';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = the change kind of a file within a diff range
 * .why = lets reviewers know whether a file is new, edited, or deleted
 */
export type FileChangeKind = 'new' | 'edited' | 'deleted';

/**
 * .what = a single file's change within a diff range
 * .why = pairs each changed path with its kind and patch text for review
 */
export interface FileDiff {
  path: string;
  changeKind: FileChangeKind;
  diff: string | null;
}

/**
 * .what = detects whether a git ref exists
 * .why = enables fallback from origin/main to main for since-main range
 */
const refExists = (input: { ref: string; cwd: string }): boolean => {
  try {
    execSync(`git rev-parse --verify ${input.ref}`, {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * .what = derives the main branch ref (origin/main, origin/master, main, or master)
 * .why = prefer origin/ refs to compare against remote state, not local divergence
 */
const deriveMainBranch = (input: { cwd: string }): string => {
  // prefer origin refs (remote branches) to avoid local divergence
  if (refExists({ ref: 'origin/main', cwd: input.cwd })) return 'origin/main';
  if (refExists({ ref: 'origin/master', cwd: input.cwd }))
    return 'origin/master';

  // fall back to local branches (for repos without remotes, e.g., test fixtures)
  if (refExists({ ref: 'main', cwd: input.cwd })) return 'main';
  if (refExists({ ref: 'master', cwd: input.cwd })) return 'master';

  // neither exists - user needs to create a main branch
  throw new BadRequestError(
    'since-main requires a main or master branch to exist. create an initial commit on main first.',
    { cwd: input.cwd },
  );
};

/**
 * .what = derives the diff base args for a given range
 * .why = the render base must equal the selection base so a file is never
 *        shown a diff computed against a different reference than selected it
 */
const deriveBaseArgs = (input: {
  range: 'since-main' | 'since-commit' | 'since-staged';
  cwd: string;
}): string => {
  if (input.range === 'since-main') {
    const mainBranch = deriveMainBranch({ cwd: input.cwd });
    // use merge-base to only show changes since branch point, not changes on main
    const mergeBase = execSync(`git merge-base ${mainBranch} HEAD`, {
      cwd: input.cwd,
      encoding: 'utf-8',
    }).trim();
    return mergeBase;
  }
  if (input.range === 'since-commit') return 'HEAD';
  if (input.range === 'since-staged') return '--staged';
  throw new UnexpectedCodePathError('invalid range', { range: input.range });
};

/**
 * .what = enumerates untracked files in a git repo
 * .why = git diff doesn't show untracked files, but reviews need them
 */
const enumUntrackedFiles = (input: { cwd: string }): string[] => {
  const output = execSync('git ls-files --others --exclude-standard', {
    cwd: input.cwd,
    encoding: 'utf-8',
  });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

/**
 * .what = maps a git name-status letter to a file change kind
 * .why = translates git's status codes into the reviewer vocab
 */
const mapStatusToChangeKind = (input: { status: string }): FileChangeKind => {
  const letter = input.status[0];
  if (letter === 'A') return 'new';
  if (letter === 'D') return 'deleted';
  // M (modified), R (rename), C (copy), and any other tracked change → edited
  return 'edited';
};

/**
 * .what = derives the patch text for a single tracked file within a range
 * .why = supplies the diff hunks the reviewer focuses on
 */
const deriveTrackedFileDiff = (input: {
  baseArgs: string;
  path: string;
  cwd: string;
}): string => {
  return execSync(`git diff ${input.baseArgs} -- "${input.path}"`, {
    cwd: input.cwd,
    encoding: 'utf-8',
  });
};

/**
 * .what = derives the patch text for a single untracked new file
 * .why = untracked files never appear in git diff <base>, so we diff against
 *        /dev/null to render a new-file patch (all lines added)
 * .note = git diff --no-index exits non-zero (code 1) when files differ, yet
 *         still prints a valid patch — we capture stdout and do not throw on it
 */
const deriveUntrackedFileDiff = (input: {
  path: string;
  cwd: string;
}): string => {
  try {
    return execSync(`git diff --no-index -- /dev/null "${input.path}"`, {
      cwd: input.cwd,
      encoding: 'utf-8',
    });
  } catch (error) {
    // allowlist ONLY git diff --no-index's exit code 1 (the "files differ"
    // signal), which prints a valid patch on stdout. any other status (real
    // failure: bad usage, permission denied, gone path) is rethrown untouched.
    const status = (error as { status?: number }).status;
    const stdout = (error as { stdout?: string | Buffer }).stdout;
    if (status === 1 && stdout !== undefined) return stdout.toString();
    throw error;
  }
};

/**
 * .what = captures each changed file's kind and diff patch within a range
 * .why = reviewers need the exact delta of this pr alongside full content, so
 *        they focus on what changed and do not churn untouched code
 *
 * .note = for since-main and since-commit, untracked files are included
 *         because they represent new work that should be reviewed
 */
export const getAllFileDiffsFromRange = async (
  input: {
    range: 'since-main' | 'since-commit' | 'since-staged';
    cwd?: string;
  },
  context?: never,
): Promise<FileDiff[]> => {
  const cwd = input.cwd ?? process.cwd();

  // derive the diff base once so selection and render bases stay identical
  const baseArgs = deriveBaseArgs({ range: input.range, cwd });

  // capture change kinds + paths via name-status (rename detection on)
  const nameStatusOutput = execSync(`git diff ${baseArgs} --name-status -M`, {
    cwd,
    encoding: 'utf-8',
  });

  // accumulate file diffs keyed by path (dedupe across sources)
  const byPath = new Map<string, FileDiff>();

  // parse name-status lines: "<status>\t<path>" or "<Rxxx>\t<old>\t<new>"
  for (const line of nameStatusOutput.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const parts = trimmed.split('\t');
    const status = parts[0]!;
    // for renames/copies (R/C), the new path is the last column
    const filePath = parts[parts.length - 1]!;
    const changeKind = mapStatusToChangeKind({ status });

    // deleted files carry a marker only — no diff, no content (per vision)
    if (changeKind === 'deleted') {
      byPath.set(filePath, { path: filePath, changeKind, diff: null });
      continue;
    }

    // edited/new tracked files carry their patch
    byPath.set(filePath, {
      path: filePath,
      changeKind,
      diff: deriveTrackedFileDiff({ baseArgs, path: filePath, cwd }),
    });
  }

  // for since-main and since-commit, also union untracked new files
  // (these represent new work that should be reviewed)
  if (input.range === 'since-main' || input.range === 'since-commit') {
    for (const untrackedPath of enumUntrackedFiles({ cwd })) {
      // skip if already captured via name-status (e.g. staged) to avoid churn
      if (byPath.has(untrackedPath)) continue;
      byPath.set(untrackedPath, {
        path: untrackedPath,
        changeKind: 'new',
        diff: deriveUntrackedFileDiff({ path: untrackedPath, cwd }),
      });
    }
  }

  // return sorted by path for stable output
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
};
