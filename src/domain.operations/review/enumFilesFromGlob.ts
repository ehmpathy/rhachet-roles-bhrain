import fg from 'fast-glob';
import * as fs from 'fs/promises';
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
  } catch {
    return false;
  }
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
 */
export const enumFilesFromGlob = async (input: {
  glob: string | string[];
  cwd?: string;
}): Promise<string[]> => {
  const cwd = input.cwd ?? process.cwd();

  // normalize to array
  const patterns = Array.isArray(input.glob) ? input.glob : [input.glob];

  // infer globs from directory paths
  const patternsResolved = await Promise.all(
    patterns.map((pattern) => inferGlobFromDirectory({ pattern, cwd })),
  );

  // separate positive and negative patterns
  const positivePatterns = patternsResolved.filter((p) => !p.startsWith('!'));
  const negativePatterns = patternsResolved
    .filter((p) => p.startsWith('!'))
    .map((p) => p.slice(1)); // remove ! prefix for ignore

  // enumerate files
  const files = await fg(positivePatterns, {
    cwd,
    ignore: negativePatterns,
    onlyFiles: true,
    dot: true, // include dotfiles
  });

  // return sorted, deduplicated paths
  return [...new Set(files)].sort();
};
