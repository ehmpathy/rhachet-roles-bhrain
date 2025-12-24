import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = enumerates feedback files matching [feedback].*.[given]* pattern
 * .why = identifies all feedback to reflect upon in source directory
 */
export const enumFeedbackFiles = async (input: {
  directory: string;
}): Promise<string[]> => {
  const feedbackFiles: string[] = [];

  // recursive walk function
  const walkDirectory = async (dir: string): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // recurse into subdirectories
        await walkDirectory(fullPath);
      } else if (entry.isFile()) {
        // check if file matches feedback pattern
        if (isFeedbackFile(entry.name)) {
          // return relative path from input directory
          feedbackFiles.push(path.relative(input.directory, fullPath));
        }
      }
    }
  };

  await walkDirectory(input.directory);

  // sort for deterministic output
  return feedbackFiles.sort();
};

/**
 * .what = checks if filename matches [feedback].*.[given]* pattern
 * .why = identifies feedback files by naming convention
 */
const isFeedbackFile = (filename: string): boolean => {
  // pattern: [feedback].*.[given]*
  // e.g., [feedback].v1.[given].by_human.md
  // e.g., execution.md.[feedback].v2.[given].by_human.md
  const pattern = /\[feedback\]\..*\.\[given\]/i;
  return pattern.test(filename);
};
