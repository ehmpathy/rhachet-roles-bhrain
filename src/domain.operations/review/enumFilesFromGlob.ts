import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import globby from 'globby';
import { UnexpectedCodePathError } from 'helpful-errors';

import { asErrorMessage } from '@src/domain.operations/review/asErrorMessage';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';
import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

/**
 * .what = checks if a path is a directory
 * .why = enables auto-inference of glob patterns from directory paths
 */
const isDirectory = async (input: {
  pattern: string;
  cwd: string;
}): Promise<boolean> => {
  try {
    const fullPath = asPathAbsoluteFromCwd({
      path: input.pattern,
      cwd: input.cwd,
    });
    const stat = await fs.stat(fullPath);
    return stat.isDirectory();
  } catch (error) {
    // only treat ENOENT (file not found) as "not a directory". the code is read off the
    // error's SHAPE: a native rejection can cross a vm realm where instanceof answers false
    if (getFsErrorCode(error) === 'ENOENT') return false;
    // wrap raw OS errors with actionable context
    const code = getFsErrorCode(error) ?? 'UNKNOWN';
    const msg = asErrorMessage({ error });
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
    const msg = asErrorMessage({ error });
    throw new UnexpectedCodePathError(
      `failed to list git files in "${input.cwd}": ${msg}`,
      { cwd: input.cwd, originalMessage: msg },
    );
  }
};

/**
 * .what = escapes the glob metacharacters of a literal path
 * .why = a git-ignored dir name may hold `(`, `[`, `{`, `!` and the like; unescaped,
 *        its ignore pattern would match some other path, or none, and the walk
 *        would descend the very dir it was meant to prune
 *
 * .note = mirrors fast-glob's posix escapePath, which globby v11 does not re-export
 */
const asGlobPathEscaped = (input: { path: string }): string =>
  input.path.replace(/(\\?)([()*?[\]{|}]|^!|[!+@](?=\())/g, '\\$2');

/**
 * .what = the git-ignored DIRECTORIES under cwd, as walk-prune ignore patterns
 * .why = a broad subject glob (e.g. `**\/*.json`) would otherwise descend every
 *        gitignored tree — session transcripts, logs, caches, build output, and
 *        the genTempDir symlink farm — only to drop each file after the walk.
 *        measured 2026-10-07 in this repo: a root walk read 1,039,236 files in
 *        94.9s, of which 972,847 sat under `.temp/genTempDir.symlink`; git named
 *        the 45 ignored dirs in 72ms
 *
 * .note = `--directory` collapses a dir to one `dir/` entry only when the WHOLE dir
 *         is ignored and untracked, so a dir that holds a tracked file is never
 *         pruned; git cannot re-include a file under an ignored dir, so a pruned
 *         dir can hold no file the post-walk filter would keep
 * .note = paths git emits are relative to cwd, which matches globby's ignore base
 */
const getGitDirsIgnoredAsPrunePatterns = (input: { cwd: string }): string[] => {
  try {
    const output = execSync(
      'git ls-files -z --others --ignored --exclude-standard --directory',
      {
        cwd: input.cwd,
        encoding: 'utf-8',
        maxBuffer: 256 * 1024 * 1024,
      },
    );
    // .note = -z emits raw NUL-separated paths, so git never quotes a special name
    return output
      .split('\0')
      .filter((line) => line.endsWith('/'))
      .map((dir) => `${asGlobPathEscaped({ path: dir })}**`);
  } catch (error) {
    const msg = asErrorMessage({ error });
    throw new UnexpectedCodePathError(
      `failed to list git-ignored dirs in "${input.cwd}": ${msg}`,
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
  const { positive: positivePatterns, negative: negativePatternsRaw } =
    splitPositiveAndNegativePatterns({ patterns: patternsResolved });

  // infer globs from directory paths on the exclude side too, since globby's own
  // directory expansion is off below (see expandDirectories)
  const negativePatterns = await Promise.all(
    negativePatternsRaw.map((pattern) =>
      inferGlobFromDirectory({ pattern, cwd }),
    ),
  );

  // with a gitignore filter, prune git-ignored dirs so the walk never descends them
  // .note = supplies (gitignore false) are never pruned: they are explicitly pointed,
  //         often into gitignored .agent/repo=* dirs, and must find what they name
  const patternsPruned = input.gitignore
    ? getGitDirsIgnoredAsPrunePatterns({ cwd })
    : [];

  // enumerate files from main glob patterns
  // .note = always exclude node_modules and .git to prevent OOM and irrelevant files
  //         see: rule.forbid.unbounded-recursive-globs
  // .note = suppressErrors so restricted dirs (EACCES) skip rather than crash the scan
  //         see: 1.vision.yield.md "permission errors become impossible"
  const filesFromGlob = await globby(positivePatterns, {
    cwd,
    ignore: [
      '**/node_modules/**',
      '**/.git/**',
      ...patternsPruned,
      ...negativePatterns,
    ],
    onlyFiles: true,
    dot: true, // include dotfiles
    followSymbolicLinks: true, // supplies live behind .agent symlinks into node_modules
    suppressErrors: true, // restricted dirs must never crash the scan
    // 🔴 off: this file expands directories itself (inferGlobFromDirectory). globby's own
    //    expansion runs dir-glob over every IGNORE entry, which stats the literal pattern
    //    text against PROCESS cwd — and a prune pattern under a mode-000 git-ignored dir
    //    (`junk/**`) cannot be stat'd, so the walk crashed with EACCES on the very dir it
    //    was told to skip
    expandDirectories: false,
  });

  // without a gitignore filter, return the raw glob results
  if (!input.gitignore) return filesFromGlob.slice().sort();

  // keep only files git does not ignore (git is the gitignore source of truth)
  const allowed = getGitFilesNotIgnored({ cwd });
  return [...filesFromGlob.filter((file) => allowed.has(file))].sort();
};
