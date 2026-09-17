/**
 * .what = the canonical order a concede resolves in — the S11 norm, as an ordered array AND
 *         the one joined label both the stance prompt and the stance ack compose from
 * .why = `concede → fix → budget → re-arrive` is the wisher's ruled sequence (S11): the
 *        default answer to a critique is to fix it, and a budget top-up is bought AFTER the
 *        fix, never led with. the label lived as one inline string in the stance prompt; the
 *        ack rendered the same steps in its own prose, cross-referenced by a comment alone —
 *        two independent copies of the WORDS, never composed from one array
 *        (r004 nitpick.3, raised i003/i005/i006; rule.forbid.duplicate-format-tree-operations).
 *
 * 🔴 the ARRAY is the source of truth; the joined label is derived from it. the ack composes
 *    its own prose from the same array elements (`ABSORPTION_CONCEDE_STEPS[0]` = `fix`,
 *    `[2]` = `re-arrive`), so an S11 reword of a step's WORD lands once and both renderers
 *    inherit it. a change to the sequence's STRUCTURE — a step inserted or moved — still needs
 *    each renderer's own prose touched, since the ack's shape (a tree with real commands) and
 *    the prompt's shape (one sentence) are not interchangeable.
 */
export const ABSORPTION_CONCEDE_STEPS = ['fix', 'budget', 're-arrive'] as const;

export const ABSORPTION_CONCEDE_SEQUENCE = [
  'concede',
  ...ABSORPTION_CONCEDE_STEPS,
].join(' → ');
