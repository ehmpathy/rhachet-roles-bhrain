/**
 * .what = the rhx dispatch banner the harness stamps near the top of any `rhx <skill>` run stdout
 * .why = named once so the strip pattern and its reason cannot drift; the harness stamps
 *        `🪨 run solid skill repo=<repo>/role=<role>/skill=<skill>` then a blank line before a
 *        skill's own output begins. the captured subprocess stdout may OPEN with blank line(s) (and,
 *        off a tty, could carry ansi color bytes) ahead of the banner, so the lead tolerates any run
 *        of whitespace + ansi escapes before the `🪨` — an anchor on `🪨` alone would miss a banner
 *        that a newline pushed off column zero.
 */
const RHX_DISPATCH_BANNER_LEAD =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
  /^(?:\s|\x1b\[[0-9;]*m)*🪨 run solid skill\b[^\n]*\n/;

/**
 * .what = strip the rhx dispatch banner off the front of a captured review stdout, so only the review
 *         body remains (its `🦉 let's review` header onward)
 * .why = when `review.by --for` DISINTERMEDIATES, it re-emits the base review's captured stdout so
 *        the run reads as a plain `rhx review`. that capture opens with the INNER `rhx review`
 *        subprocess's own dispatch banner. to re-emit it verbatim under a guard — which already
 *        stamped its OWN `rhx review.by` banner upstream — yields a DOUBLED banner: two
 *        `🪨 run solid skill` lines where a direct review peer shows one. the inner banner is the
 *        review.by disintermediary's to remove: a dispatch banner is the caller's stamp, not part of
 *        the review body review.by re-emits. strip it, and a guard-dispatched `review.by --for` shows
 *        exactly one banner (the honest `…skill=review.by` stamp) + the review body — the same shape
 *        as a direct review peer. see rule.require.review-by-disintermediates.
 * .note = pure. a stdout with no banner up front (a node-import invocation, or an already-stripped
 *         body) comes back unchanged, so it is safe to apply unconditionally at the disintermediate
 *         print site. the blank line(s) the harness emits after the banner are dropped too, so the
 *         body opens on its first real line.
 */
export const asReviewBodyStdout = (input: { stdout: string }): string => {
  if (!RHX_DISPATCH_BANNER_LEAD.test(input.stdout)) return input.stdout;
  return input.stdout
    .replace(RHX_DISPATCH_BANNER_LEAD, '')
    .replace(/^(?:[ \t]*\n)+/, '');
};
