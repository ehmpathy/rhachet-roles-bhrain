import { asReviewLogsDir } from '@src/domain.operations/review/asReviewLogsDir';
import { isPathPresent } from '@src/domain.operations/review/isPathPresent';

/**
 * .what = one tree's row: its log root, and whether that root is present
 * .why = the grove walk composes this per tree, so the row's shape has one home
 * .note = the return shape is `ReviewTree`, stated inline so this leaf does not
 *         import from the orchestrator that imports it
 */
export const getOneReviewTree = async (input: {
  name: string;
  dir: string;
}): Promise<{ name: string; dir: string; root: string; present: boolean }> => {
  const root = asReviewLogsDir({ cwd: input.dir });
  const present = await isPathPresent({ at: root });
  return { name: input.name, dir: input.dir, root, present };
};
