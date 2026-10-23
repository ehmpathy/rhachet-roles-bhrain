import { estimateTokenCount } from '@src/domain.operations/review/estimateTokenCount';

/**
 * .what = the estimated tokens of a set of files, summed
 * .why = every partition prompt carries the same head — rules, refs, conversation — so its
 *        weight is counted once and added to each partition's own
 */
export const getOneTokensOfFiles = (input: {
  files: Array<{ path: string; content: string }>;
}): number =>
  input.files.reduce(
    (sum, file) => sum + estimateTokenCount({ content: file.content }),
    0,
  );
