import { execSync } from 'child_process';
import * as path from 'path';

/**
 * .what = get git blob hashes for files without reading file contents
 * .why = git already computed content hashes; reuse them to avoid OOM on 700+ files
 *
 * for committed files: git ls-tree gives us the blob hash
 * for modified/untracked: git hash-object computes the hash without us loading content
 */
export const getGitBlobHashes = (input: {
  files: string[];
  cwd: string;
}): Record<string, string> => {
  if (input.files.length === 0) return {};

  const cwd = path.resolve(input.cwd);
  const result: Record<string, string> = {};

  // get hashes for committed files via ls-tree (batch query)
  const committedHashes = getCommittedBlobHashes({ files: input.files, cwd });

  // get list of modified files (staged or unstaged changes)
  const modifiedFiles = getModifiedFiles({ cwd });
  const modifiedSet = new Set(modifiedFiles);

  // get list of untracked files
  const untrackedFiles = getUntrackedFiles({ cwd });
  const untrackedSet = new Set(untrackedFiles);

  // for each file, determine the correct hash
  for (const file of input.files) {
    const relFile = path.relative(cwd, path.resolve(cwd, file));

    if (modifiedSet.has(relFile) || untrackedSet.has(relFile)) {
      // modified or untracked: compute hash from worktree content
      const hash = computeWorktreeHash({ file: relFile, cwd });
      if (hash) result[file] = hash;
      // if hash is null, file was deleted — omit from result
    } else if (committedHashes[relFile]) {
      // committed and unchanged: use ls-tree hash
      const hash = committedHashes[relFile];
      if (hash) result[file] = hash;
    } else {
      // not in git at all — compute hash if file exists
      const hash = computeWorktreeHash({ file: relFile, cwd });
      if (hash) result[file] = hash;
    }
  }

  return result;
};

/**
 * .what = parse git ls-tree output into a hash map
 * .why = extracts blob hashes from ls-tree format "100644 blob <hash>\t<path>"
 */
const asHashMapFromLsTreeOutput = (input: {
  output: string;
}): Record<string, string> => {
  const result: Record<string, string> = {};
  const lsTreeLinePattern = /^\d+ blob ([a-f0-9]+)\t(.+)$/;

  for (const line of input.output.trim().split('\n')) {
    if (!line) continue;
    const match = line.match(lsTreeLinePattern);
    if (match && match[1] && match[2]) {
      const hash = match[1];
      const filePath = match[2];
      result[filePath] = hash;
    }
  }

  return result;
};

/**
 * .what = get blob hashes for committed files via git ls-tree
 * .why = single git command returns all committed file hashes
 */
const getCommittedBlobHashes = (input: {
  files: string[];
  cwd: string;
}): Record<string, string> => {
  try {
    // ls-tree -r HEAD gives us all committed files with their hashes
    const output = execSync('git ls-tree -r HEAD', {
      cwd: input.cwd,
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large repos
    });

    return asHashMapFromLsTreeOutput({ output });
  } catch (error) {
    // graceful fallback for expected conditions: not a git repo or no commits yet
    if (
      error instanceof Error &&
      (error.message.includes('not a git repository') ||
        error.message.includes("bad revision 'HEAD'"))
    ) {
      return {};
    }
    throw error;
  }
};

/**
 * .what = get list of modified files (staged or unstaged)
 * .why = modified files need worktree hash, not HEAD hash
 */
const getModifiedFiles = (input: { cwd: string }): string[] => {
  try {
    const output = execSync('git diff --name-only HEAD', {
      cwd: input.cwd,
      encoding: 'utf-8',
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    // graceful fallback for expected conditions: not a git repo or no commits yet
    if (
      error instanceof Error &&
      (error.message.includes('not a git repository') ||
        error.message.includes("bad revision 'HEAD'"))
    ) {
      return [];
    }
    throw error;
  }
};

/**
 * .what = get list of untracked files
 * .why = untracked files have no HEAD hash, need worktree hash
 */
const getUntrackedFiles = (input: { cwd: string }): string[] => {
  try {
    const output = execSync('git ls-files --others --exclude-standard', {
      cwd: input.cwd,
      encoding: 'utf-8',
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    // graceful fallback for expected condition: not a git repo
    if (
      error instanceof Error &&
      error.message.includes('not a git repository')
    ) {
      return [];
    }
    throw error;
  }
};

/**
 * .what = compute blob hash for a file in worktree
 * .why = git hash-object computes hash without us loading the file content
 */
const computeWorktreeHash = (input: {
  file: string;
  cwd: string;
}): string | null => {
  try {
    const output = execSync(`git hash-object "${input.file}"`, {
      cwd: input.cwd,
      encoding: 'utf-8',
    });
    return output.trim();
  } catch (error) {
    // graceful fallback for expected condition: file was deleted or does not exist
    if (
      error instanceof Error &&
      (error.message.includes('No such file or directory') ||
        error.message.includes('could not open'))
    ) {
      return null;
    }
    throw error;
  }
};
