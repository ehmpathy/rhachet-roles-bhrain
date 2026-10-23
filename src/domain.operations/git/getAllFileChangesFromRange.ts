import { execSync } from 'child_process';
import * as fs from 'fs';
import { ConstraintError, UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import { compareStrings } from '@src/utils/compareStrings';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

import { MAX_BYTES_OF_ONE_GIT_READ } from './MAX_BYTES_OF_ONE_GIT_READ';

/**
 * .what = the change kind of a file within a diff range
 * .why = lets reviewers know whether a file is new, edited, or deleted
 */
export type FileChangeKind = 'new' | 'edited' | 'deleted';

/**
 * .what = the stdout of one git read, or an UnexpectedCodePathError that names it
 * .why = the guard catches exactly two classes from this leaf — a `ConstraintError`
 *        (no main branch; a `BadRequestError` subclass, so a catch on either holds)
 *        and an `UnexpectedCodePathError` (a git call that failed for any other
 *        reason) — and turns each into a lane malfunction. a raw
 *        `execSync` throws a plain `Error`, which slips past that catch and ends the
 *        whole guard pass on a stack trace. so every git read here that answers with
 *        output goes through this wrapper, and the leaf throws only the two classes it
 *        declares
 *
 * .note = the one read that bypasses it is `getOneRefExtantVerdict`: it must read git's
 *         stderr to part "no such revision" (an answer, `false`) from every other fault,
 *         so it owns its own catch — and that catch rethrows only an
 *         `UnexpectedCodePathError`, so the two-class contract above still holds
 *
 * .note = stdio is piped, so git's own stderr rides inside the error rather than
 *         leak onto the terminal beside the verdict
 *
 * .note = the byte bound is `MAX_BYTES_OF_ONE_GIT_READ`, shared with the patch reads
 */
const getOneGitOutput = (input: { cmd: string; cwd: string }): string => {
  try {
    return execSync(input.cmd, {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: MAX_BYTES_OF_ONE_GIT_READ,
    });
  } catch (error) {
    throw new UnexpectedCodePathError('a git read failed', {
      cmd: input.cmd,
      cwd: input.cwd,
      stderr: String((error as { stderr?: unknown }).stderr ?? ''),
      message: String((error as { message?: unknown }).message ?? error),
    });
  }
};

/**
 * .what = detects whether a git ref exists
 * .why = enables fallback from origin/main to main for since-main range
 *
 * .note = 🔴 only git's own "no such revision" answer reads as absent. every other
 *         failure — no git on PATH, a cwd that is not a repo, a corrupt `.git` — is
 *         rethrown. an absence verdict there would send `getOneMainBranch` to refuse
 *         with "create an initial commit on main", which is false for all of them.
 *
 *         ⚠️ the exit status alone cannot part them: git exits 128 both for an
 *         absent ref and for a cwd outside any repo. the stderr line is the signal.
 */
const getOneRefExtantVerdict = (input: {
  ref: string;
  cwd: string;
}): boolean => {
  try {
    execSync(`git rev-parse --verify ${input.ref}`, {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return true;
  } catch (error) {
    // allowlist the one expected answer: git could not find this revision
    const stderr = String((error as { stderr?: unknown }).stderr ?? '');
    if (/Needed a single revision|unknown revision/.test(stderr)) return false;

    // every other failure is not an answer about the ref — surface it with its context
    throw new UnexpectedCodePathError(
      'could not check whether a git ref exists',
      {
        ref: input.ref,
        cwd: input.cwd,
        stderr,
        message: String((error as { message?: unknown }).message ?? error),
      },
    );
  }
};

/**
 * .what = derives the main branch ref (origin/main, origin/master, main, or master)
 * .why = prefer origin/ refs to compare against remote state, not local divergence
 */
const getOneMainBranch = (input: { cwd: string }): string => {
  // prefer origin refs (remote branches) to avoid local divergence
  if (getOneRefExtantVerdict({ ref: 'origin/main', cwd: input.cwd }))
    return 'origin/main';
  if (getOneRefExtantVerdict({ ref: 'origin/master', cwd: input.cwd }))
    return 'origin/master';

  // fall back to local branches (for repos without remotes, e.g., test fixtures)
  if (getOneRefExtantVerdict({ ref: 'main', cwd: input.cwd })) return 'main';
  if (getOneRefExtantVerdict({ ref: 'master', cwd: input.cwd }))
    return 'master';

  // neither exists - human needs to create a main branch
  throw new ConstraintError(
    'since-main requires a main or master branch to exist. create an initial commit on main first.',
    { cwd: input.cwd },
  );
};

/**
 * .what = derives the diff base args for a given range
 * .why = the render base must equal the selection base so a file is never
 *        shown a diff computed against a different reference than selected it
 */
const getOneBaseArgs = (input: {
  range: 'since-main' | 'since-commit' | 'since-staged';
  cwd: string;
}): string => {
  if (input.range === 'since-main') {
    const mainBranch = getOneMainBranch({ cwd: input.cwd });
    // use merge-base to only show changes since branch point, not changes on main
    return getOneGitOutput({
      cmd: `git merge-base ${mainBranch} HEAD`,
      cwd: input.cwd,
    }).trim();
  }
  if (input.range === 'since-commit') return 'HEAD';
  if (input.range === 'since-staged') return '--staged';
  throw new UnexpectedCodePathError('invalid range', { range: input.range });
};

/**
 * .what = enumerates untracked files in a git repo
 * .why = git diff doesn't show untracked files, but reviews need them
 *
 * .note = 🔴 only entries that resolve to a regular file are kept. git lists an
 *         untracked symlink as one entry whatever it points at, so a `.claude` that
 *         links to a directory arrives here as a "file" — and the target reader,
 *         which refuses to swallow a read failure, then halts the whole review on
 *         EISDIR. a link to a directory has no body to review; it is dropped here,
 *         at the one place that knows it is an enumeration and not a read
 */
const getAllUntrackedFiles = (input: { cwd: string }): string[] => {
  const output = getOneGitOutput({
    cmd: 'git ls-files --others --exclude-standard',
    cwd: input.cwd,
  });
  return getAllRegularFilePaths({
    cwd: input.cwd,
    paths: asLinesNonEmpty({ output }),
  });
};

/**
 * .what = the paths that lead, through any symlink, to a regular file
 * .why = git lists a symlink to a directory as one entry; it has no body to review,
 *        so the enumeration keeps only the entries a reader can read as text
 */
const getAllRegularFilePaths = (input: {
  cwd: string;
  paths: string[];
}): string[] =>
  input.paths.filter((entry) =>
    getOneRegularFileVerdict({ cwd: input.cwd, path: entry }),
  );

/**
 * .what = true when a path resolves, through any symlink, to a regular file
 * .why = the review reads each untracked entry as text, so a directory or a broken
 *        link is no target at all
 *
 * .note = only ABSENCE reads false — a broken link, or an entry deleted since git
 *         listed it. every other stat failure (EACCES, EIO) rethrows, so a real fault
 *         is never filtered away as though the entry were simply not a file
 *         (rule.forbid.failhide)
 */
const getOneRegularFileVerdict = (input: {
  cwd: string;
  path: string;
}): boolean => {
  try {
    return fs.statSync(path.join(input.cwd, input.path)).isFile();
  } catch (error) {
    if (!isErrorOfAbsence({ error })) throw error;
    return false;
  }
};

/**
 * .what = the non-blank lines of a command's output, each trimmed
 * .why = git prints one entry per line and a final newline; named so a caller reads
 *        "the lines" rather than simulate a split, a trim, and a blank filter
 */
const asLinesNonEmpty = (input: { output: string }): string[] =>
  input.output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

/**
 * .what = the status and the current path of one `git diff --name-status` line
 * .why = a line is `<status>\t<path>` or, for a rename or copy, `<Rxxx>\t<old>\t<new>`;
 *        the status is the first column and the path that exists now is the LAST, so
 *        the positions are named here once rather than recalled at each read
 */
const asNameStatusEntry = (input: {
  line: string;
}): { status: string; path: string } => {
  const columns = input.line.split('\t');
  return { status: columns[0]!, path: columns[columns.length - 1]! };
};

/**
 * .what = reads the status and current path of each file changed within a base
 * .why = the one raw `git diff --name-status` read, named as a communicator so the
 *        orchestrator composes it rather than fuse a child process into its body
 */
const getAllNameStatusEntries = (input: {
  baseArgs: string;
  cwd: string;
}): { status: string; path: string }[] => {
  const output = getOneGitOutput({
    cmd: `git diff ${input.baseArgs} --name-status -M`,
    cwd: input.cwd,
  });
  return asLinesNonEmpty({ output }).map((line) => asNameStatusEntry({ line }));
};

/**
 * .what = maps a git name-status letter to a file change kind
 * .why = translates git's status codes into the reviewer vocab
 */
const asChangeKindFromStatus = (input: { status: string }): FileChangeKind => {
  const letter = input.status[0];
  if (letter === 'A') return 'new';
  if (letter === 'D') return 'deleted';
  // M (modified), R (rename), C (copy), and any other tracked change → edited
  return 'edited';
};

/**
 * .what = one file a range changed — its path, its kind, and which list named it
 * .why = the diff reader and the paths reader both derive from this one selection, so
 *        the two can never disagree on which files a range holds
 */
export interface FileChange {
  path: string;
  changeKind: FileChangeKind;
  tracked: boolean;
}

/**
 * .what = the files a range changed, and the base it was read against
 * .why = the ONE selection behind both `getAllFileDiffsFromRange` and
 *        `getAllFilePathsFromRange`: one base, one name-status read, one regular-file
 *        filter, one untracked union, one dedup. a second copy of any of these drifts —
 *        a path tracked as deleted and also listed as untracked (`git rm --cached`) once
 *        read as deleted to one reader and as present to the other
 *
 * .note = the base is returned beside the list, since the diff reader must render each
 *         patch against the base that selected it
 *
 * .note = a tracked entry wins over its untracked twin, deleted ones included: the
 *         index is what the next commit writes, so a path removed from it is deleted
 *         whatever still sits on disk
 *
 * 🟡 .note = a quiescence assumption, stated: the set is read by several separate git
 *            calls (merge-base, name-status, ls-files), so it is one tree state only
 *            while no commit, checkout, or index write lands between them
 */
export const getAllFileChangesFromRange = (input: {
  range: 'since-main' | 'since-commit' | 'since-staged';
  cwd: string;
}): { baseArgs: string; changes: FileChange[] } => {
  // derive the base once, so selection and render share it
  const baseArgs = getOneBaseArgs({ range: input.range, cwd: input.cwd });

  // the tracked entries, each a regular file or a deletion
  const changesTracked = getAllTrackedChanges({ baseArgs, cwd: input.cwd });

  // for since-main and since-commit, the untracked new files join the set
  const changesUntracked = isRangeOfUntrackedFiles({ range: input.range })
    ? getAllUntrackedChanges({ cwd: input.cwd, changesTracked })
    : [];

  // ordered by path, so two reads of one range render and hash identically
  const changes = asChangesSortedByPath({
    changes: [...changesTracked, ...changesUntracked],
  });
  return { baseArgs, changes };
};

/**
 * .what = the tracked changes within a base: a deleted one keeps its marker, a present
 *         one must lead to a regular file
 * .why = a tracked symlink to a directory has no body to review, and a deletion has no
 *        file left to stat; named so the selection reads as one act
 */
const getAllTrackedChanges = (input: {
  baseArgs: string;
  cwd: string;
}): FileChange[] =>
  getAllNameStatusEntries({ baseArgs: input.baseArgs, cwd: input.cwd })
    .map(({ status, path: filePath }) => ({
      path: filePath,
      changeKind: asChangeKindFromStatus({ status }),
      tracked: true,
    }))
    .filter(
      (change) =>
        change.changeKind === 'deleted' ||
        getOneRegularFileVerdict({ cwd: input.cwd, path: change.path }),
    );

/**
 * .what = the untracked new files, less any path a tracked change already names
 * .why = a tracked entry wins over its untracked twin (the index is what the next
 *        commit writes), so the union never lists one path twice
 */
const getAllUntrackedChanges = (input: {
  cwd: string;
  changesTracked: FileChange[];
}): FileChange[] => {
  const pathsTracked = new Set(
    input.changesTracked.map((change) => change.path),
  );
  return getAllUntrackedFiles({ cwd: input.cwd })
    .filter((untrackedPath) => !pathsTracked.has(untrackedPath))
    .map((untrackedPath) => ({
      path: untrackedPath,
      changeKind: 'new' as const,
      tracked: false,
    }));
};

/**
 * .what = the changes, ordered by path
 * .why = two reads of one range must render and hash identically, whatever order git
 *        listed them in, and on whichever host reads it
 *
 * .note = code-unit order via compareStrings, never localeCompare: a locale's collation is
 *         host state, so it could order one range two ways on two machines
 */
const asChangesSortedByPath = (input: {
  changes: FileChange[];
}): FileChange[] =>
  [...input.changes].sort((a, b) => compareStrings(a.path, b.path));

/**
 * .what = true where a range reaches past the index to the work not yet added
 * .why = since-main and since-commit review new work that git has never seen;
 *        since-staged reviews only what the index holds
 */
const isRangeOfUntrackedFiles = (input: {
  range: 'since-main' | 'since-commit' | 'since-staged';
}): boolean => input.range === 'since-main' || input.range === 'since-commit';
