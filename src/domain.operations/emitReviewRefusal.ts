/**
 * .what = the owl header every `rhx review` and `rhx route.*` refusal opens with
 * .why = named so a glyph swap is one edit rather than five, and so a reader
 *        greps one constant instead of a string that reads like prose
 *
 * .note = 🦉 the repo mascot, never a role marker — a refusal is the REPO that
 *         speaks, not the reviewer (define.bhrain-repo-mascot)
 */
const HEADER_OF_REVIEW_REFUSAL = '🦉 woah there';

/**
 * .what = the glyph and error class each refusal kind opens its headline with
 * .why = a glyph alone is ambiguous; the class says who must act
 *        (rule.require.qualified-error-headers). the glyph and the class are keyed
 *        together, so a refusal cannot pair `✋` with a malfunction or `💥` with a
 *        constraint.
 *
 *        | kind          | who must act                                   |
 *        |---------------|------------------------------------------------|
 *        | `constraint`  | the caller — a flag, a scope, a budget to fix  |
 *        | `malfunction` | the system — a host fault, a code defect       |
 *        | `warn`        | no one, now — the command proceeds; a cause to |
 *        |               | clear later, so it names no error class        |
 *
 * .note = the owl header stays above it: the mascot is the voice, the class is the
 *         verdict, and the two are different axes (define.bhrain-repo-mascot)
 *
 * .note = `warn` carries no error class on purpose. `ConstraintError` means the run
 *         halted with exit 2 (rule.require.exit-code-semantics), so a notice that lets
 *         the run proceed must never wear it — a reader who greps stderr for the class
 *         would read a refusal where the run succeeded
 */
const HEAD_OF_REVIEW_REFUSAL_KIND = {
  constraint: {
    glyph: '✋',
    class: 'ConstraintError',
    header: HEADER_OF_REVIEW_REFUSAL,
  },
  malfunction: {
    glyph: '💥',
    class: 'MalfunctionError',
    header: HEADER_OF_REVIEW_REFUSAL,
  },
  warn: { glyph: '🟡', class: 'warn', header: '🦉 heads up, the run goes on' },
} as const;

/**
 * .what = emits a refusal to stderr — the owl header, a headline, the
 *         caller's detail lines, and the blank line that closes the block
 * .why = one shared frame for every refusal site, rather than the glyph, the
 *        blank-line convention, and the headline prefix each hand-repeated
 *        at its own call site (rule.prefer.most-common-denominator).
 *
 * .note = it sits at the domain.operations root since both the review and the route
 *         surfaces speak through it — their common ancestor
 *
 * .note = it emits and returns — it does not throw. sites disagree on what
 *         follows: most raise a `BadRequestError`, and the context-window
 *         one emits a scope dump beneath. so the frame is shared and the
 *         disposition stays at the call site, where it differs.
 *
 * .note = stderr rather than stdout, because a refusal on stdout corrupts a pipe
 *         (rule.forbid.stdout-on-exit-errors). a `constraint` or `malfunction` caller
 *         then exits non-zero; a `warn` caller proceeds, and stderr keeps its `--json`
 *         document on stdout parseable either way.
 */
export const emitReviewRefusal = (input: {
  /** who must act — decides the glyph and the class the headline opens with */
  kind: keyof typeof HEAD_OF_REVIEW_REFUSAL_KIND;
  /** the one-line reason, rendered after the qualified class */
  headline: string;
  /** the detail tree beneath it — already formatted, emitted verbatim */
  lines: string[];
}): void => {
  const head = HEAD_OF_REVIEW_REFUSAL_KIND[input.kind];
  console.error('');
  console.error(head.header);
  console.error('');
  console.error(`${head.glyph} ${head.class}: ${input.headline}`);
  for (const line of input.lines) console.error(line);
  console.error('');
};
