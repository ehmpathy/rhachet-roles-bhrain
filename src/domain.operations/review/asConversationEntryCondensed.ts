// review.tally/ is a declared shared exposure (see its .readme.md), never another context's internals
import { getOneReviewCountsViaRegex } from '@src/domain.operations/review.tally/getOneReviewCountsViaRegex';

/**
 * .what = condenses one conversation entry: a peer given that holds no verdict becomes one line
 * .why = a given with no count and no concern is a malfunction's or a refusal's stdout. it carries
 *        no argument a reviewer can judge a repair against, yet it rides whole into every later
 *        round's prompt. one line keeps the fact that the round happened and drops the rest.
 *        measured 2026-10-15 over one route's 5.1 stone: 39 of 1,409 givens, 129.6k of 4.59M
 *        given chars (2.8%) — a small lever, but a free one, and it grows with every fault
 *
 * .note = the test is the guard's own: no numeric count read (`contract.reviewer-output`), so the
 *         guard graded it unreadable. it adds one more condition, so no argument can be lost: the
 *         given names no concern (`blocker.N` / `nitpick.N`). a given that holds a concern rides
 *         whole, whatever its tally
 * .note = only a peer given is condensed. a `.taken` is the driver's argument, and rides whole
 */
export const asConversationEntryCondensed = (input: {
  entry: { path: string; content: string };
}): { path: string; content: string } => {
  // only a peer given can be a verdictless reviewer stdout
  if (!input.entry.path.includes('.given.by_peer.')) return input.entry;

  // a given with a readable verdict rides whole
  const counts = getOneReviewCountsViaRegex({ content: input.entry.content });
  if (counts.detected) return input.entry;

  // a given that names any concern rides whole, so no argument is dropped
  if (/\b(blocker|nitpick)\.\d+\b/.test(input.entry.content))
    return input.entry;

  // the one line names the cause where the given printed a refusal, and what was dropped
  const cause = /ConstraintError: ([^\n]+)/
    .exec(input.entry.content)?.[1]
    ?.trim();
  const kind = cause ? `refused — ${cause}` : 'malfunction — no verdict read';
  return {
    path: input.entry.path,
    content: `(condensed) this round's review held no verdict: ${kind}. its ${input.entry.content.length} chars of stdout carry no concern, so they are omitted.\n`,
  };
};
