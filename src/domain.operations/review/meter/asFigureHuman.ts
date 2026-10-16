/**
 * .what = what the run and tree reports print where a figure was never measured
 * .why = the branch's central law: an absent figure renders as absent, never as
 *        zero. a `$0.00` that means "unrecorded" is the worst read available, so
 *        every surface on the `--of` axis names its absence rather than print a
 *        figure nobody measured (rule.forbid.failhide).
 *
 *        the law is shared across the whole axis; the glyph is shared by
 *        exactly two surfaces, declared here so those two cannot drift.
 *
 * .note = the grove report deliberately does not read this. it prints the word
 *         `absent`, since its columns already carry dashes as separators and a
 *         second dash there reads as punctuation. this is the tree-shaped
 *         surfaces' glyph, never the repo's — do not cite it as canonical.
 *
 * .note = where the mark stands alone in a figure's slot, two spaces follow it before
 *         its caveat (`—  🟡 unknown, …`), at every such site. that gap is deliberate:
 *         it parts the mark, which IS the figure, from the caveat that explains it, so
 *         a reader does not read the dash as the caveat's own punctuation. where the mark
 *         sits inside prose (`(— output tokens billed, …)`) it is a word, and takes one
 */
export const MARK_OF_ABSENT = '—';

/**
 * .what = what the GROVE report prints where a figure was never measured
 * .why = the same law as `MARK_OF_ABSENT`, in the other vocabulary — declared
 *        here, beside its peer, on purpose. a divergence that lived as a prose
 *        `.note` beside one of them plus a bare literal inside the other would
 *        be indistinguishable from drift — declared as a pair, the choice is
 *        the artifact (rule.require.single-source-of-truth-for-render).
 *
 * .note = the two surfaces diverge deliberately, and are not folded into one:
 *         the grove's columns already carry dashes as separators, so a second
 *         dash reads as punctuation there; the tree surfaces are scanned down
 *         a narrow column where the word `absent` costs six characters of
 *         alignment. the acts are one; the glyphs are two.
 */
export const WORD_OF_ABSENT = 'absent';

/**
 * .what = renders a count at human scale — 12,400,000 as `12.4M`
 * .why = a seven-digit figure does not compare at a glance, and these reports are
 *        read by a human at a terminal who wants the magnitude, never the units
 *        digit (rule.require.treestruct-output).
 *
 *        takes `of` rather than `tokens` or `chars` because the scale is the
 *        same act for both, and two named copies of one act is how the run and
 *        tree reports came to carry byte-identical `asTokensHuman` bodies.
 *
 * .note = the grove report scales differently on purpose — it prints thousands
 *         separators in full, since its census rows are compared against each
 *         other rather than skimmed. a real divergence, not a drift. that full
 *         render has its own one home, `asCountHuman`.
 */
export const asFigureHuman = (input: { of: number }): string => {
  // a billion-scale figure is one grove away — the wish opened on 779.5M — and
  // without this rung it rendered `1500.0M`, which reads as a typo
  if (input.of >= 1_000_000_000)
    return `${(input.of / 1_000_000_000).toFixed(1)}B`;
  if (input.of >= 1_000_000) return `${(input.of / 1_000_000).toFixed(1)}M`;
  if (input.of >= 1_000) return `${(input.of / 1_000).toFixed(1)}k`;
  return String(input.of);
};
