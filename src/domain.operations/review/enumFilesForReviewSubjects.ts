import { enumFilesFromGlob } from '@src/domain.operations/review/enumFilesFromGlob';

/**
 * .what = enumerates files for review subjects (target files)
 * .why = subjects are never in gitignored dirs; honor gitignore to keep build
 *        artifacts and restricted dirs out of review (and out of crash range)
 *
 * .see = define.review-ubiqlang.supplies-vs-subjects
 */
export const enumFilesForReviewSubjects = async (input: {
  glob: string | string[];
  cwd?: string;
}): Promise<string[]> => {
  return enumFilesFromGlob({
    glob: input.glob,
    cwd: input.cwd,
    gitignore: true,
  });
};
