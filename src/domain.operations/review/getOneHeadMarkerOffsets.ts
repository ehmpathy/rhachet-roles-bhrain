import { UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = the two headers the head census cuts its rows at
 * .why = this is their one home: `compileReviewPrompt` interpolates both into its
 *        template, so the header it emits and the header this census cuts at are
 *        the same string (rule.require.single-source-of-truth-for-render). they are
 *        unconditional, never optional sections — so their absence is a code defect
 *        (a template edit that dropped one), never a runtime condition
 */
export const MARKER_OF_OUTPUT_FORMAT = '## output format';
export const MARKER_OF_RULES = '## rules';

/**
 * .what = what an absent head marker means, and what to do about it
 * .why = the markup bound would also catch this, but under the wrong name —
 *        its hint says to name a new input, and none was added. an author
 *        sent to add a row when the fix is to re-sync a header is a
 *        misdiagnosis, which costs more than none (rule.require.errors-name-the-fix)
 */
const HINT_OF_ABSENT_MARKER = [
  'the prompt head does not carry the markers its census cuts at.',
  '',
  'why: `instructions` and `outputFormat` are measured by the OFFSETS of two',
  '     headers in the compiled head. `compileReviewPrompt` interpolates both from',
  '     this file, so an absent one means a template edit dropped its interpolation.',
  '',
  'fix: restore the interpolation of `MARKER_OF_OUTPUT_FORMAT` / `MARKER_OF_RULES`',
  '     in the template `compileReviewPrompt` renders. do NOT add a row — no input was added.',
].join('\n');

/**
 * .what = what an OUT-OF-ORDER head means, and what to do about it
 * .why = the second way the offset cut fails, and it runs a different direction:
 *        both markers are present, and the rubric leads the output contract. the
 *        span would then be negative, so the old reader clamped it to zero and
 *        dropped the whole output-format block into the residual in silence.
 */
const HINT_OF_INVERTED_MARKERS = [
  'the prompt head carries its markers OUT OF ORDER.',
  '',
  'why: `outputFormat` is measured as the span from its own header to the',
  '     rubric header, so the rubric must FOLLOW it. the rubric marker appears',
  '     only ahead of the output contract, so that span cannot be sized.',
  '',
  'fix: order the head as instructions, then output format, then rules — or',
  '     re-derive the cut if the compiler deliberately reordered them.',
].join('\n');

/**
 * .what = the two offsets the head census cuts its rows at, or a loud refusal
 * .why = it returns the offsets rather than merely assert them, so no caller
 *        can re-derive — and drift from — what this operation already decided
 *
 * .note = it throws rather than returns a grade. an absent or inverted marker
 *         is a code defect, never a runtime condition a caller could recover
 *         from (rule.require.failfast) — else an absent marker would read as
 *         `instructions: 0` and `outputFormat: 0`, two well-formed rows that
 *         under-report by the whole head (rule.forbid.failhide)
 *
 * .note = the rubric marker is sought after the output contract, never from
 *         the head's start — the preamble carries caller-supplied goal text,
 *         and a goal that quotes `## rules` would otherwise capture the cut
 *
 * .note = it has no size floor, unlike the markup share. a floor is owed to a
 *         rate, whose denominator can be too small to read; this is a literal
 *         text check, true of a short head exactly as a long one
 */
export const getOneHeadMarkerOffsets = (input: {
  promptHeadStatic: string;
}): { atOutputFormat: number; atRules: number } => {
  const atOutputFormat = input.promptHeadStatic.indexOf(
    MARKER_OF_OUTPUT_FORMAT,
  );

  // sought anywhere, and used ONLY to tell an absent marker from an inverted one
  const atRulesAnywhere = input.promptHeadStatic.indexOf(MARKER_OF_RULES);

  if (atOutputFormat < 0 || atRulesAnywhere < 0)
    throw new UnexpectedCodePathError(HINT_OF_ABSENT_MARKER, {
      markerOfOutputFormat: MARKER_OF_OUTPUT_FORMAT,
      markerOfRules: MARKER_OF_RULES,
      foundOutputFormat: atOutputFormat >= 0,
      foundRules: atRulesAnywhere >= 0,
      headChars: input.promptHeadStatic.length,
    });

  // the offset the cut actually uses — the first rubric header that follows
  // the output contract, so a goal that quotes `## rules` cannot capture it
  const atRules = input.promptHeadStatic.indexOf(
    MARKER_OF_RULES,
    atOutputFormat,
  );

  if (atRules < 0)
    throw new UnexpectedCodePathError(HINT_OF_INVERTED_MARKERS, {
      atOutputFormat,
      atRulesAnywhere,
      headChars: input.promptHeadStatic.length,
    });

  return { atOutputFormat, atRules };
};
