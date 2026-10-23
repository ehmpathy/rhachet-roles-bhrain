/**
 * .what = is this transcript entry a REAL human utterance?
 * .why = a transcript records four things as `type: "user"`, and only one of them is
 *        a human. a hook's replayed output, a subagent's turn, the compaction summary,
 *        and a tool result each arrive as a user entry, and none is a human who spoke
 *
 * 🟡 the `isMeta` exclusion is the decisive one. a stop-hook's own output is replayed
 *    into the transcript as a meta user turn — so without it a nudge that reads this
 *    predicate would mark the reader warm every time it fired, and then never fire
 *    again. that is a self-silenced loop, and it would look exactly like a throttle that works
 *
 * .note = shared at two callers on purpose: what counts as a human turn is one domain rule;
 *         a second copy would let the token report and the telepath disagree on who spoke
 */
export const isHumanTurn = (entry: {
  type?: unknown;
  isMeta?: unknown;
  isSidechain?: unknown;
  isCompactSummary?: unknown;
  message?: { content?: unknown };
}): boolean => {
  if (entry.type !== 'user') return false;

  // a hook's replayed output, a subagent's turn, and the compaction summary each arrive
  // as a user entry and none is a human who spoke
  if (entry.isMeta === true) return false;
  if (entry.isSidechain === true) return false;
  if (entry.isCompactSummary === true) return false;

  // a tool result is the harness that answers the assistant, never a human
  const content = entry.message?.content;
  if (typeof content === 'string') return true;
  if (!Array.isArray(content)) return false;
  return !content.some(
    (block: { type?: unknown }) => block?.type === 'tool_result',
  );
};
