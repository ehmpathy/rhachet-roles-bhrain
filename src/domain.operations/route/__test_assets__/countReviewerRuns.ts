import * as fs from 'fs';
import * as path from 'path';

/**
 * .what = counts how many rounds the peer reviewer subprocess actually SPAWNED
 * .why = the entrance gate's whole claim is that it halts BEFORE a round runs, and
 *        stdout alone cannot part a halt-BEFORE from a halt-AFTER — both render a
 *        halt tree. the tally can: a reviewer that never ran appended no token
 *
 * .how = the `run:` command in each test guard ends with `printf x >> "$route/runs.txt"`,
 *        so the file is one char per round and its length IS the count
 *
 * .note = 🔴 ONLY an absent file reads as zero. a blanket catch would report an EACCES
 *         or a truncated read as "no round was spawned" — a false green on the very
 *         clamp this helper exists to prove (rule.forbid.failhide)
 *
 * .note = sync by design. two suites had drifted a sync and an async copy of this, and
 *         the EACCES-vs-ENOENT distinction above had to be restated in both. no async
 *         caller awaits any state this read depends on, so one sync form serves all three
 *         (rule.require.single-source-of-truth-for-render; r1 nitpick.5, i006/i007/i010/i011)
 */
export const countReviewerRuns = (input: { route: string }): number => {
  const tally = path.join(input.route, 'runs.txt');
  if (!fs.existsSync(tally)) return 0;
  return fs.readFileSync(tally, 'utf-8').trim().length;
};
