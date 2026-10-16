import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = writes the review target list — every file this branch adds or changes,
 *         untracked files included — to a file a guard command can read via `$targets`
 * .why = an `rhx review` lane gets its targets computed by the engine
 *        (`--diffs since-main`), but an enroll lane gets only its prompt, so each
 *        prompt author re-derived the list in shell prose. one prompt named
 *        `git diff origin/main --name-only`, which omits untracked files, and missed
 *        most of the feature it was asked to review. this hands every lane the SAME
 *        list `rhx review` computes, so no prompt re-derives it
 *
 * .note = one file per lane (the caller passes a per-lane path), so lanes that pour
 *         concurrently never write one file at once
 *
 * .note = 🔴 the LIST is handed in, never computed here. it costs a git read of the
 *         whole branch, and it is identical for every lane of one pass — so the guard
 *         pass computes it once (`getAllStoneGuardReviewTargetPaths`) and each
 *         lane only writes its own copy
 */
export const setStoneGuardReviewTargets = async (input: {
  path: string;
  repoRoot: string;
  targets: string[];
}): Promise<{ path: string; count: number }> => {
  // write one repo-relative path per line
  await fs.writeFile(
    input.path,
    asTargetListFileContent({ paths: input.targets }),
  );

  // return the list's own path repo-relative, the convention every reviewer runs under
  return {
    path: path.relative(input.repoRoot, input.path),
    count: input.targets.length,
  };
};

/**
 * .what = the list file's content — one path per line, each line newline-terminated
 * .why = a newline after the last path too, so a line reader never drops the final one
 */
const asTargetListFileContent = (input: { paths: string[] }): string =>
  input.paths.map((line) => `${line}\n`).join('');
