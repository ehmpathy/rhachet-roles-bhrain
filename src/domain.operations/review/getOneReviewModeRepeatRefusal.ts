/**
 * .what = the refusal for a `--mode` typed more than once with values that differ, or null
 * .why = `--mode` is the dispatcher's own flag, so a repeat of it is exempt from the
 *        generic one-value-per-flag refusal — yet review reads it too, to choose a free
 *        preview (`plan`) or a paid review (any other). a last-wins parse of
 *        `--mode plan --mode hard` ran a PAID review where a free one was asked for, in
 *        silence (rule.forbid.failhide). which one the human meant is theirs to say
 *
 * .note = a repeat of ONE value (`--mode hard --mode hard`) is accepted: every value
 *         read agrees, so no choice was dropped and no cost differs from what was typed.
 *         a dispatcher that forwards its own `--mode` beside a caller's identical one
 *         stays unrefused
 */
export const getOneReviewModeRepeatRefusal = (input: {
  modes: string[];
}): string | null => {
  // each value once, in the order first typed
  const modesDistinct = [...new Set(input.modes)];
  if (modesDistinct.length < 2) return null;

  return `--mode given more than once with different values: ${modesDistinct.join(', ')}`;
};
