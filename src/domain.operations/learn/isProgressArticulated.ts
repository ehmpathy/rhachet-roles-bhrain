/**
 * .what = the least substance a progress sentinel must carry to count as a real
 *         articulation — measured in non-whitespace characters
 * .why = the wish's ONE hard requirement is that the learner articulates what it
 *        distilled and why. an empty or one-word file (a bare `touch`) is not that.
 *        a genuine "done? what? why?" note clears this floor with ease (even a terse
 *        "no new terms this round — all names decomposed to sanctioned verbs" is well
 *        over it), so the floor rejects the trivial bypass but not real prose
 */
export const MIN_ARTICULATION_CHARS = 40;

/**
 * .what = decide whether a progress sentinel's content is a real articulation
 * .why = staleness by mtime alone lets a bare `touch progress.md` silence the onStop
 *        nudge with no distillation — which guts the wish's one hard requirement. this
 *        guards the CONTENT: an absent, empty, or trivially-short sentinel is not an
 *        articulation, so isSweepStale treats it as stale and the nudge holds
 * .note = this floors on SUBSTANCE (non-whitespace length), not markdown structure —
 *         the wish asks for "what + why", not a prescribed section shape. it rejects
 *         the named bypass (empty/touch) but not a learner's free-form prose
 */
export const isProgressArticulated = (input: {
  content: string | null;
}): boolean => {
  // absent sentinel → not articulated (first run, or a deleted file)
  if (input.content === null) return false;

  // count only non-whitespace so a file of blank lines / spaces cannot pass
  const substanceChars = input.content.replace(/\s/g, '').length;
  return substanceChars >= MIN_ARTICULATION_CHARS;
};
