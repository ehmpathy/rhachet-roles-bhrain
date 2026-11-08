import { existsSync, lstatSync, realpathSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';

/**
 * .what = the settings file the toggle writes, how to name it, and the layout it sits in
 * .why = the layout decides which sessions read the file: on the split layout only an enrolled
 *        session passes it as `--settings`, while a plain claude session reads the old
 *        layout's file as its project layer
 */
export type TermsHookTarget = {
  path: string;
  pathShown: string;
  pathTracked: string;
  layout: 'split' | 'old';
};

/**
 * .what = the claude settings file the term hook toggle reads and writes
 * .why = the same pick `init.claude.status-line.sh` makes (fulcrum F2): on the split layout
 *        (`.claude/settings.json` is a link, or the repo layer exists) the one real file is
 *        `.claude/settings.of.repo.json`, which every peer actor derives from; the old layout
 *        writes the real `.claude/settings.json`
 *
 * .note = a communicator: it reads the fs (lstat, exists, realpath) to learn the layout
 * .note = `pathTracked` is the path git tracks. on the split layout `.claude` is a link into
 *         the repo actor's brain dir, and `git add` refuses a path beyond a link, so a human
 *         who is told to commit the file must be told this path
 * .note = a `.claude` link that resolves outside the repo is refused: the toggle would write a
 *         file the repo does not hold, then tell the human to commit a `..` path
 */
export const getOneTermsHookTarget = (input: {
  repoRoot: string;
}): TermsHookTarget => {
  // pick the file by layout
  const claudeDir = path.join(input.repoRoot, '.claude');
  const settingsJson = path.join(claudeDir, 'settings.json');
  const settingsOfRepo = path.join(claudeDir, 'settings.of.repo.json');
  const isSplit =
    lstatSync(settingsJson, { throwIfNoEntry: false })?.isSymbolicLink() ===
      true || existsSync(settingsOfRepo);
  const target = isSplit ? settingsOfRepo : settingsJson;

  // the path git tracks: the dir resolved through every link, relative to the real repo root
  const repoReal = realpathSync(input.repoRoot);
  const dirReal = existsSync(claudeDir)
    ? realpathSync(claudeDir)
    : path.join(repoReal, '.claude');
  const pathTracked = path.relative(
    repoReal,
    path.join(dirReal, path.basename(target)),
  );

  // refuse a target the repo does not hold
  if (pathTracked.startsWith('..') || path.isAbsolute(pathTracked))
    throw new ConstraintError(
      'the settings target resolves outside the repo, so learn.terms.hook will not read or write it',
      {
        settings: path.relative(input.repoRoot, target),
        hint: 'point .claude at a dir inside the repo, then rerun the command',
      },
    );

  return {
    path: target,
    pathShown: path.relative(input.repoRoot, target),
    pathTracked,
    layout: isSplit ? 'split' : 'old',
  };
};
