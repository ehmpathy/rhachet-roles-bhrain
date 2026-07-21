/**
 * .what = builds the 🌙 skipped report string (header + body) for an --optional skip
 * .why = pure content-build for a supply-empty skip, so the orchestrator can write it to the
 *        --output file and echo it to stdout without inline string-assembly. kept pure (no
 *        i/o) so the transformer stays testable and the i/o lives in the orchestrator, peer
 *        to the normal path's inline write (rule.prefer.decomposable-architecture).
 * .note = the `0 blockers` / `0 nitpicks` lines are real counts the guard's deterministic
 *         regex reads (0/0 → approved), never a faked abstain (rule.forbid.failhide).
 * .note = no `logs:` line — a skip writes no log artifacts, so a log-dir pointer would send a
 *         reader to an empty directory (rule.forbid.surprises).
 */
export const getReviewSkipReport = (input: {
  supply: 'rules';
  globs: string[];
  reviewDisplayPath: string;
}): string => {
  const skipHeader = [
    `🌙 skipped — no ${input.supply} found (--optional ${input.supply})`,
    `   ├─ review: ${input.reviewDisplayPath}`,
    `   └─ summary`,
    `      ├─ 0 blockers`,
    `      └─ 0 nitpicks`,
    '',
    '---',
    '',
  ].join('\n');
  const skipBody = `_no ${input.supply} matched the --optional ${input.supply} glob (${input.globs.join(', ')}); review skipped._\n`;
  return skipHeader + skipBody;
};
