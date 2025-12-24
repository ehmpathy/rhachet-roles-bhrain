import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';

/**
 * .what = validates target directory exists or creates with --force
 * .why = fail fast on invalid target before expensive operations
 */
export const validateTargetDirectory = async (input: {
  target: string;
  force?: boolean;
}): Promise<{
  created: boolean;
}> => {
  // check if directory exists
  try {
    const stat = await fs.stat(input.target);
    if (!stat.isDirectory())
      throw new BadRequestError('target path exists but is not a directory', {
        target: input.target,
      });
    return { created: false };
  } catch (error) {
    // if not a BadRequestError, directory doesn't exist
    if (error instanceof BadRequestError) throw error;

    // directory doesn't exist - check if we should create it
    if (!input.force)
      throw new BadRequestError(
        'target directory does not exist. use --force to create it.',
        {
          target: input.target,
          hint: 'add --force flag to create the target directory',
        },
      );

    // create directory with --force
    await fs.mkdir(input.target, { recursive: true });
    return { created: true };
  }
};
