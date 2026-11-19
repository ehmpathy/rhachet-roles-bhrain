import * as path from 'path';

import { getAllBashWordsLead } from './getAllBashWordsLead';

/**
 * .what = the shell's cwd after one simple command runs, as far as text can tell
 * .why = `cd ~/.claude/projects/p; cd memory; tee a.md` writes into memory through a
 *        cwd two commands moved; the guard folds the cwd through each move
 *
 * returns:
 * - the cwd unchanged, for a command that moves no cwd
 * - the target, for a `cd` or `pushd` to an absolute or home path
 * - the target joined onto a known cwd, for a relative one
 * - null (unknown), for `popd`, `cd -`, a bare `cd`, a `$var` target, or a
 *   relative target with no cwd known
 * - option words (`cd -P D`, `cd -- D`) are skipped to reach the target
 */
export const asBashCwdAfterSegment = (input: {
  segment: string;
  cwd: string | null;
}): string | null => {
  const [verb, ...args] = getAllBashWordsLead({ segment: input.segment });
  if (!['cd', 'pushd', 'popd'].includes(verb ?? '')) return input.cwd;
  if (verb === 'popd') return null;

  // option words (`-P`, `-L`, `--`) are not the target; `cd -` is a move back
  const target = args.find((word) => word === '-' || !word.startsWith('-'));
  if (!target || target === '-') return null;

  // a quote the word does not close (`"/a/my dir"`, split at the space) or an
  // expansion leaves the target unknown from text alone
  const quoteOpen = /^["']/.test(target) && !/^(["']).*\1[)}]*$/.test(target);
  const bare = target.replace(/["')}]/g, '');
  if (quoteOpen || /[$`]/.test(bare)) return null;

  // an absolute or home target replaces the cwd; a relative one joins it
  if (/^[/~]/.test(bare)) return bare;
  return input.cwd ? path.join(input.cwd, bare) : null;
};
