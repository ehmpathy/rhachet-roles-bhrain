import { existsSync, lstatSync } from 'fs';
import * as path from 'path';

/**
 * .what = the path of the claude settings file this repo commits its hooks into
 * .why = under rhachet's split layout (1.49+), `.claude/settings.json` is an arrow to the
 *        host's own `~/.claude/settings.json`, and the roles' hooks live in the one real
 *        file, `.claude/settings.of.repo.json`. a suite that reads `settings.json` there
 *        reads the host's file, which holds none of this repo's hooks. an old layout has
 *        no repo layer, so it falls back to the real `settings.json`
 *
 * .note = the layout test is the one the inits use: an arrow at `settings.json`, or a repo
 *         layer on disk, means the split layout, even before the repo layer exists
 */
export const getRepoClaudeSettingsPath = (input: { repoRoot: string }): string => {
  // prefer the repo layer, the file rhachet keeps
  const repoLayer = path.join(input.repoRoot, '.claude', 'settings.of.repo.json');
  if (existsSync(repoLayer)) return repoLayer;

  // an arrow at settings.json also marks the split layout, so the repo layer is the target
  const settingsPath = path.join(input.repoRoot, '.claude', 'settings.json');
  const stat = lstatSync(settingsPath, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink()) return repoLayer;

  // else the old layout's real file
  return path.join(input.repoRoot, '.claude', 'settings.json');
};
