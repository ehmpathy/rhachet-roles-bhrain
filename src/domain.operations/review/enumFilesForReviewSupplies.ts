import { enumFilesFromGlob } from '@src/domain.operations/review/enumFilesFromGlob';

/**
 * .what = enumerates files for review supplies (rules, refs)
 * .why = supplies are explicitly pointed at via --rules / --refs, so they load
 *        whatever the glob matches — the gitignored .agent/repo=* dirs and
 *        symlinked rule dirs alike. gitignore is NOT applied (that is a subjects
 *        concern); the glob walk uses suppressErrors so a restricted dir cannot
 *        crash the scan.
 *
 * .see = define.review-ubiqlang.supplies-vs-subjects
 */
export const enumFilesForReviewSupplies = async (input: {
  glob: string | string[];
  cwd?: string;
}): Promise<string[]> => {
  return enumFilesFromGlob({
    glob: input.glob,
    cwd: input.cwd,
    gitignore: false, // supplies are explicitly pointed; load all glob matches
  });
};
