import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';

import { enumFeedbackFiles } from '@src/domain.operations/reflect/enumFeedbackFiles';

/**
 * .what = validates source directory exists and contains feedback files
 * .why = fail fast on invalid source before expensive operations
 */
export const validateSourceDirectory = async (input: {
  source: string;
}): Promise<{
  feedbackFiles: string[];
}> => {
  // validate directory exists
  try {
    const stat = await fs.stat(input.source);
    if (!stat.isDirectory())
      throw new BadRequestError('source path is not a directory', {
        source: input.source,
      });
  } catch (error) {
    if (error instanceof BadRequestError) throw error;
    throw new BadRequestError('source directory does not exist', {
      source: input.source,
    });
  }

  // enumerate feedback files
  const feedbackFiles = await enumFeedbackFiles({
    directory: input.source,
  });

  // validate at least one feedback file found
  if (feedbackFiles.length === 0)
    throw new BadRequestError(
      'source directory contains no feedback files matching [feedback].*.[given]* pattern',
      {
        source: input.source,
        hint: 'feedback files must match pattern: [feedback].*.[given]*.md',
      },
    );

  return { feedbackFiles };
};
