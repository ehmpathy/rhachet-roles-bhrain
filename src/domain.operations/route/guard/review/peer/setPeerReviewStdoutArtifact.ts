import * as fs from 'fs/promises';

/**
 * .what = upserts one lane's stdout artifact — the `.given.by_peer.<slug>.md` file
 * .why = the guard's record of what a reviewer said. one authored write that replaces
 *        the file wholesale, so a rerun of the same lane cannot stack footers
 *
 * .note = the dir is findserted by `genPeerReviewsDir` before any lane runs
 */
export const setPeerReviewStdoutArtifact = async (input: {
  path: string;
  content: string;
}): Promise<{ path: string }> => {
  await fs.writeFile(input.path, input.content);
  return { path: input.path };
};
