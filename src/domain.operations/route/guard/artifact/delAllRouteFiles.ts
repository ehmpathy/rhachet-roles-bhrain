import * as fs from 'fs/promises';

/**
 * .what = deletes each named route file; a file already absent is a no-op
 * .why = the delete is the raw i/o boundary of a rewind. one named communicator lets the
 *        orchestrator that enumerates the files read as a chain of named acts, and its
 *        `force` makes a second rewind (or a file removed by a peer) converge rather than throw
 */
export const delAllRouteFiles = async (input: {
  paths: string[];
}): Promise<void> => {
  for (const filePath of input.paths) await fs.rm(filePath, { force: true });
};
