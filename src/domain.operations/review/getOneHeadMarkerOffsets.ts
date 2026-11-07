import { UnexpectedCodePathError } from 'helpful-errors';

import { getOneOffsetOfFirstBlockMarker } from './getOneOffsetOfFirstBlockMarker';

/**
 * .what = the headers the head census cuts its rows at
 * .why = this is their one home: the prompt templates interpolate each, so the header
 *        a template emits and the header a census cuts at are the same string
 *        (rule.require.single-source-of-truth-for-render). each is unconditional, never
 *        an optional section — so an absent one is a code defect (a template edit that
 *        dropped it), never a runtime condition
 *
 * .note = two headers can open the first block behind the output contract, one per
 *         layout on disk. a corpus-first prompt — what `compileReviewPrompt` emits — opens
 *         it with the target, since the corpus a level shares leads every lane's prompt
 *         (`asPromptHead`). a rubric-first prompt opens it with the rubric. the
 *         census accepts whichever comes first (`getOneOffsetOfFirstBlockMarker`), so it
 *         parses both
 */
export const MARKER_OF_OUTPUT_FORMAT = '## output format';
export const MARKER_OF_TARGET = '## target';
export const MARKER_OF_RULES = '## rules';

/**
 * .what = the headers that may open the first block behind the output contract
 * .why = the disk census reads a prompt of either layout, so it accepts both
 */
export const MARKERS_OF_FIRST_BLOCK = [MARKER_OF_TARGET, MARKER_OF_RULES];

/**
 * .what = the one header that may open the first block of a COMPILED head
 * .why = a compiled head is corpus-first; the rubric opens no block of it
 */
const MARKERS_OF_COMPILED_HEAD = [MARKER_OF_TARGET];

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
  '     headers in the compiled head: the output contract, and the first block',
  '     behind it. the templates interpolate both from this file, so an absent one',
  '     means a template edit dropped its interpolation.',
  '',
  'fix: restore the interpolation of `MARKER_OF_OUTPUT_FORMAT` / `MARKER_OF_TARGET`',
  '     in the template `asPromptHead` renders. do NOT add a row — no input was added.',
].join('\n');

/**
 * .what = what an OUT-OF-ORDER head means, and what to do about it
 * .why = the second way the offset cut fails, and it runs a different direction:
 *        both markers are present, and the first block leads the output contract.
 *        the span would then be negative, and a clamp to zero would drop the whole
 *        output-format block into the residual in silence — so the cut refuses instead.
 */
const HINT_OF_INVERTED_MARKERS = [
  'the prompt head carries its markers OUT OF ORDER.',
  '',
  'why: `outputFormat` is measured as the span from its own header to the',
  '     first block header, so that block must FOLLOW it. the block marker appears',
  '     only ahead of the output contract, so that span cannot be sized.',
  '',
  'fix: order the head as instructions, then output format, then the target — or',
  '     re-derive the cut if the compiler deliberately reordered them.',
].join('\n');

/**
 * .what = the two offsets the head census cuts its rows at, or a loud refusal
 * .why = it returns the offsets rather than merely assert them, so no caller
 *        can re-derive — and drift from — what this operation already decided
 *
 * .note = it throws rather than returns a grade. an absent or inverted marker is a
 *         code defect, never a runtime condition a caller could recover from
 *         (rule.require.failfast) — else an absent marker would read as
 *         `instructions: 0` and `outputFormat: 0`, two well-formed rows that
 *         under-report by the whole head (rule.forbid.failhide)
 *
 * .note = it has no size floor, unlike the markup share. a floor is owed to a
 *         rate, whose denominator can be too small to read; this is a literal
 *         text check, true of a short head exactly as a long one
 *
 * .note = 🔴 it accepts the TARGET header alone. a compiled head is corpus-first by
 *         construction, so a head whose first block is the rubric is a template edit that
 *         put the rubric back ahead of the corpus — it throws here. only the disk reader,
 *         which parses rubric-first prompts too, accepts both (`MARKERS_OF_FIRST_BLOCK`)
 */
export const getOneHeadMarkerOffsets = (input: {
  promptHead: string;
}): { atOutputFormat: number; atFirstBlock: number } => {
  const atOutputFormat = input.promptHead.indexOf(MARKER_OF_OUTPUT_FORMAT);

  // sought anywhere, and used ONLY to tell an absent marker from an inverted one
  const atFirstBlockAnywhere = getOneOffsetOfFirstBlockMarker({
    text: input.promptHead,
    from: 0,
    markers: MARKERS_OF_COMPILED_HEAD,
  });

  if (atOutputFormat < 0 || atFirstBlockAnywhere < 0)
    throw new UnexpectedCodePathError(HINT_OF_ABSENT_MARKER, {
      markerOfOutputFormat: MARKER_OF_OUTPUT_FORMAT,
      markersOfFirstBlock: MARKERS_OF_COMPILED_HEAD,
      foundOutputFormat: atOutputFormat >= 0,
      foundFirstBlock: atFirstBlockAnywhere >= 0,
      headChars: input.promptHead.length,
    });

  // the offset the cut actually uses — the first block header that follows the
  // output contract, so a goal that quotes one cannot capture it
  const atFirstBlock = getOneOffsetOfFirstBlockMarker({
    text: input.promptHead,
    from: atOutputFormat,
    markers: MARKERS_OF_COMPILED_HEAD,
  });

  if (atFirstBlock < 0)
    throw new UnexpectedCodePathError(HINT_OF_INVERTED_MARKERS, {
      atOutputFormat,
      atFirstBlockAnywhere,
      headChars: input.promptHead.length,
    });

  return { atOutputFormat, atFirstBlock };
};
