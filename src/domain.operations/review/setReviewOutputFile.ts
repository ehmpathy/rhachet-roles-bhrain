import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = writes the final review to the path the caller asked for, header first
 * .why = every other artifact of a run is written through a named set* communicator;
 *        the review itself was the one raw writeFile left in stepReview
 *        (rule.prefer.decomposable-architecture)
 *
 * .note = upsert by nature: a second run over the same output path overwrites it,
 *         which is the contract — the file holds the LATEST review of that path
 */
export const setReviewOutputFile = async (input: {
  path: string;
  header: string;
  body: string;
}): Promise<{ path: string }> => {
  // the parent may not exist yet: a split lane whose every partition refused wrote no file there
  await fs.mkdir(path.dirname(input.path), { recursive: true });
  await fs.writeFile(input.path, input.header + input.body, 'utf-8');
  return { path: input.path };
};
