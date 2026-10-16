import { UnexpectedCodePathError } from 'helpful-errors';

import type { AttributionGrade } from '@src/domain.objects/Reviewer/AttributionGrade';
import type { PromptComposition } from '@src/domain.objects/Reviewer/PromptComposition';
import { getOneAttributionGradeOfMarkup } from '@src/domain.operations/review/getOneAttributionGradeOfMarkup';

/**
 * .what = what a NEGATIVE residual means, and what to do about it
 * .why = the fourth obligation, and it runs the OPPOSITE direction from the share
 *        above — so the share cannot see it. a diff counted but never rendered
 *        inflates `targetDiffs` and drives the residual below zero.
 */
const HINT_OF_NEGATIVE_MARKUP = [
  'markup went NEGATIVE — the census counted mass the renderer never SENT.',
  '',
  'why: a negative residual is arithmetically impossible for a prompt that was',
  '     really rendered, so it names a CODE defect at every scale — never a',
  '     corpus shape, and never a threshold anyone chose.',
  '',
  'fix: every `is*Sent` decision must be read by BOTH the renderer and the census.',
  '     see `isTargetDiffSent`, and rule.require.distinguish-every-review-input',
].join('\n');

/**
 * .what = what an `unattributed` grade means, and what to do about it
 * .why = 🔴 the grade is the ONLY signal for an input that entered with no row,
 *        and a bare `unattributed` teaches a future author naught. they see a
 *        word, not a defect — and the defect is the most expensive one this
 *        census can suffer (rule.require.errors-name-the-fix).
 *
 * .note = it is a HINT rather than an error string because the grade does not
 *         stop a run. the run breadth (`--of run`) renders both arms beside the
 *         composition rows — check FIRST, else the four names to extend. the
 *         input surface renders only the flag, since it shows no composition rows
 *         the arms act on. the grove shows SECTION rows summed over many runs, and
 *         an arm acts on one run's prompt, so it renders the flag plus the
 *         `--of run --at <rundir>` command that opens one run's rows.
 */
export const HINT_OF_UNATTRIBUTED = [
  'the residual is too large to vouch for — it may hide an input with NO row.',
  '',
  'why: `markup` is the RESIDUAL (chars − the other named rows), so the rows sum',
  '     to `chars` by algebra whatever enters. the sum cannot catch this.',
  '',
  'check FIRST: is the corpus many SMALL files? then the residual is real',
  '     scaffold — ~90 chars of tags per target — and no input is absent.',
  '',
  'else: name the new input in `PromptInputName`, state its cache seam in',
  '     `IS_CACHEABLE`, sum its chars in `getOnePromptComposition`, and map it in',
  '     `SECTION_OF_INPUT`. see rule.require.distinguish-every-review-input',
].join('\n');

/**
 * .what = grades whether a composition's residual is small enough to vouch for
 * .why = 🔴 the SHIPPED reader for wish bar 2 — *"an input that enters the prompt
 *        with no row of its own is CAUGHT"*. it runs in the production path, not
 *        only under test: a detector that lives in a test file catches a forged
 *        fixture and lets every live run through.
 *
 * .note = 🔴 the two checks run in OPPOSITE directions, and their DISPOSITIONS
 *         differ because their SUBJECTS differ:
 *
 *         | check | subject | disposition |
 *         |---|---|---|
 *         | negative residual | a CODE defect, impossible for a real render | throws |
 *         | the share bound | a heuristic over runtime DATA | grades |
 *
 *         a failfast is owed to the first and forbidden to the second, and to
 *         flatten them is the defect this operation was rewritten to remove.
 *
 * .note = 🔴 .the hazard a floor cannot reach, and why the share may not throw
 *
 *         markup scales with the BLOCK COUNT — a `<target.file path="…">` open,
 *         a close, and a `\n\n---\n\n` join, ~90 chars plus the path, per target.
 *         so a corpus of MANY SMALL files drives the share past any bound on
 *         purely legitimate decoration, and `FLOOR_OF_ATTRIBUTABLE_CHARS`
 *         (`getOneAttributionGradeOfMarkup`) cannot
 *         save it — the scaffold crosses a fixed floor at ~15 targets, and every
 *         real review carries more.
 *
 *         measured 2026-09-21, `compileReviewPrompt.test.ts [case-wide-corpus]`:
 *         293 small targets, push focus — 52,387 markup chars, 70.8% of a
 *         73,970-char prompt, every char a real tag. this branch's own records
 *         cite a corpus of that exact size.
 *
 *         ⇒ so a THROW here would not catch a defect. it would kill every review
 *         of a repo shaped that way, and the study instrument becomes the outage.
 *         a grade tells the reader precisely what a throw could not: the rows are
 *         recorded, and the census does not vouch for them.
 */
export const getOneAttributionGrade = (input: {
  composition: Omit<PromptComposition, 'attribution'>;
}): AttributionGrade => {
  const { chars } = input.composition.inputs.markup;

  if (chars < 0)
    throw new UnexpectedCodePathError(HINT_OF_NEGATIVE_MARKUP, {
      markupChars: chars,
      promptChars: input.composition.chars,
      inputs: input.composition.inputs,
    });

  return getOneAttributionGradeOfMarkup({
    markupChars: chars,
    promptChars: input.composition.chars,
  });
};
