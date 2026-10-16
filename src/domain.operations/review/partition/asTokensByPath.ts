import { estimateTokenCount } from '@src/domain.operations/review/estimateTokenCount';

/**
 * .what = the estimated tokens of each file, by its path
 * .why = a split is priced per partition, and a partition is a set of paths, so the price
 *        of each path is looked up rather than recounted per partition
 */
export const asTokensByPath = (input: {
  files: Array<{ path: string; content: string }>;
}): Map<string, number> =>
  new Map(
    input.files.map((file) => [
      file.path,
      estimateTokenCount({ content: file.content }),
    ]),
  );
