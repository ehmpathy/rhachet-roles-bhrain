import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import globby from 'globby';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

/**
 * .what = checks if a path is a directory
 * .why = enables auto-inference of glob patterns from directory paths
 */
const isDirectory = async (input: {
  pattern: string;
  cwd: string;
}): Promise<boolean> => {
  try {
    const fullPath = path.isAbsolute(input.pattern)
      ? input.pattern
      : path.join(input.cwd, input.pattern);
    const stat = await fs.stat(fullPath);
    return stat.isDirectory();
  } catch (error) {
    // only treat ENOENT (file not found) as "not a directory"
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return false;
    // wrap raw OS errors with actionable context
    const code =
      error instanceof Error && 'code' in error ? error.code : 'UNKNOWN';
    const msg = error instanceof Error ? error.message : String(error);
    throw new UnexpectedCodePathError(
      `failed to stat path "${input.pattern}" in "${input.cwd}": ${code} — ${msg}`,
      { pattern: input.pattern, cwd: input.cwd, code, originalMessage: msg },
    );
  }
};

/**
 * .what = the set of files git considers part of the repo (tracked + untracked,
 *         minus gitignored), as cwd-relative paths
 * .why = git is the source of truth for what gitignore excludes; we ask git
 *        rather than reimplement gitignore semantics (nested rules, negation)
 *
 * .note = git prunes ignored dirs before it descends, so a restricted (mode 000)
 *         gitignored dir is never scandir'd — this is what prevents the EACCES
 *         crash, with no per-file error handler needed
 * .note = paths git emits are relative to cwd, which matches globby's output
 */
const getGitFilesNotIgnored = (input: { cwd: string }): Set<string> => {
  try {
    const output = execSync(
      'git ls-files --cached --others --exclude-standard',
      {
        cwd: input.cwd,
        encoding: 'utf-8',
        maxBuffer: 64 * 1024 * 1024,
      },
    );
    return new Set(
      output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new UnexpectedCodePathError(
      `failed to list git files in "${input.cwd}": ${msg}`,
      { cwd: input.cwd, originalMessage: msg },
    );
  }
};

/**
 * .what = splits glob patterns into positive (include) and negative (exclude) sets
 * .why = negative patterns prefixed with ! are used differently by globby
 */
const splitPositiveAndNegativePatterns = (input: {
  patterns: string[];
}): { positive: string[]; negative: string[] } => {
  const positive = input.patterns.filter((p) => !p.startsWith('!'));
  const negative = input.patterns
    .filter((p) => p.startsWith('!'))
    .map((p) => p.slice(1));
  return { positive, negative };
};

/**
 * .what = converts directory paths to recursive glob patterns
 * .why = improves devexp via inferred recursive glob when user passes a directory
 *
 * .example
 *   - "src/rules" (directory) -> appends recursive glob pattern
 *   - "src/rules/file.md" (glob with wildcards) -> unchanged
 */
const inferGlobFromDirectory = async (input: {
  pattern: string;
  cwd: string;
}): Promise<string> => {
  // skip negative patterns
  if (input.pattern.startsWith('!')) return input.pattern;

  // skip patterns that already contain glob chars
  if (/[*?[\]{}]/.test(input.pattern)) return input.pattern;

  // check if pattern is a directory
  const patternIsDirectory = await isDirectory({
    pattern: input.pattern,
    cwd: input.cwd,
  });
  if (!patternIsDirectory) return input.pattern;

  // append recursive glob
  return `${input.pattern.replace(/\/$/, '')}/**/*`;
};

/**
 * .what = enumerates files that match a glob pattern
 * .why = supports --rules and --paths inputs for file discovery
 *
 * .params
 *   - gitignore = when true, exclude files git ignores (via `git ls-files`);
 *     used for subjects (broad globs / diffs) which must skip build junk and
 *     restricted dirs. supplies pass false: rules/refs are explicitly pointed,
 *     so they load whatever the glob matches (incl. gitignored .agent/repo=*)
 */
export const enumFilesFromGlob = async (input: {
  glob: string | string[];
  cwd?: string;
  gitignore?: boolean;
}): Promise<string[]> => {
  const cwd = input.cwd ?? process.cwd();

  // cast to array
  const patterns = Array.isArray(input.glob) ? input.glob : [input.glob];

  // infer globs from directory paths
  const patternsResolved = await Promise.all(
    patterns.map((pattern) => inferGlobFromDirectory({ pattern, cwd })),
  );

  // separate positive and negative patterns
  const { positive: positivePatterns, negative: negativePatterns } =
    splitPositiveAndNegativePatterns({ patterns: patternsResolved });

  // enumerate files from main glob patterns
  // .note = always exclude node_modules and .git to prevent OOM and irrelevant files
  //         see: rule.forbid.unbounded-recursive-globs
  // .note = suppressErrors so restricted dirs (EACCES) skip rather than crash the scan
  //         see: 1.vision.yield.md "permission errors become impossible"
  const filesFromGlob = await globby(positivePatterns, {
    cwd,
    ignore: ['**/node_modules/**', '**/.git/**', ...negativePatterns],
    onlyFiles: true,
    dot: true, // include dotfiles
    followSymbolicLinks: true, // supplies live behind .agent symlinks into node_modules
    suppressErrors: true, // restricted dirs must never crash the scan
  });

  // without a gitignore filter, return the raw glob results
  if (!input.gitignore) return filesFromGlob.slice().sort();

  // keep only files git does not ignore (git is the gitignore source of truth)
  const allowed = getGitFilesNotIgnored({ cwd });
  return filesFromGlob.filter((file) => allowed.has(file)).sort();
};
