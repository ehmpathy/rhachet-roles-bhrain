// a sanctioned exposure, declared in src/domain.operations/review/.readme.md
import type { ReviewRun } from '../review/runOneReview';
import type { ReviewVerdict } from './ReviewByResult';

/**
 * .what = maps a runner result into the failhide-safe verdict
 * .why = keeps the outcome decode out of the orchestrator. the rules:
 *        - no detected verdict → malfunctioned (never a silent 0/0; carries the stderr reason)
 *        - a detected verdict with blockers → rejected
 *        - a detected verdict with no blockers → passed (nitpicks alone do not reject)
 *        see rule.forbid.failhide.
 */
export const asReviewVerdict = (input: { run: ReviewRun }): ReviewVerdict => {
  const { run } = input;

  // a run with no trustworthy tally is a malfunction — surface the reason, never a clean 0/0
  if (!run.detected)
    return {
      blockers: 0,
      nitpicks: 0,
      outcome: 'malfunctioned',
      tallier: null,
      talliedBy: null,
      reason: asMalfunctionReason({ run }),
    };

  // a detected verdict rejects on any blocker; nitpicks alone still pass
  const outcome = run.blockers > 0 ? 'rejected' : 'passed';
  return {
    blockers: run.blockers,
    nitpicks: run.nitpicks,
    outcome,
    tallier: run.tallier,
    talliedBy: run.talliedBy,
  };
};

/**
 * .what = the ansi style escapes a child process may wrap its stderr lines in
 * .why = a line of style codes alone carries no words. it must not win the first-line
 *        search, else the tree renders a reason row a human reads as empty
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
const ANSI_STYLE_ESCAPE = /\x1b\[[0-9;]*m/g;

/**
 * .what = the lead of the rhx dispatch banner, and the tree glyphs of its status rows
 * .why = a `rhx <skill>` child stamps its streams with a banner and a status tree
 *        (`└─ 💥 failed with an error`). both name what ran and that it failed, never
 *        why. read as the reason, either renders a malfunction row that explains naught
 */
const LEADS_OF_HARNESS_CHROME = ['🪨 run solid skill', '├─', '└─', '│'];

/**
 * .what = whether a stderr line states a reason, rather than harness chrome or a blank
 * .why = named, so the first-line search below reads as one question
 */
const isReasonLine = (input: { line: string }): boolean =>
  input.line !== '' &&
  !LEADS_OF_HARNESS_CHROME.some((lead) => input.line.startsWith(lead));

/**
 * .what = a line that names an error class and its message — `ReviewTimeoutError: …`,
 *         `💥 MalfunctionError: …`, a bare `Error: …`
 * .why = an uncaught throw prints the source frame (`…/genContextBrain.js:108`) and the
 *        code line ahead of the message, so the first line is rarely the reason
 */
const SHAPE_OF_ERROR_LINE = /\b\w*Error: \S/;

/**
 * .what = extracts the stderr line that states a reason, as the malfunction reason
 * .why = the runner already wrote a clean category reason to stderr; surface it so the human
 *        sees why, without the full dump. the first line that names an error class wins; the
 *        first line of words is the fallback. style escapes and harness chrome are skipped,
 *        since neither states a reason
 */
const asMalfunctionReason = (input: { run: ReviewRun }): string => {
  const lines = input.run.stderr
    .split('\n')
    .map((line) => line.replace(ANSI_STYLE_ESCAPE, '').trim())
    .filter((line) => isReasonLine({ line }));
  const reason =
    lines.find((line) => SHAPE_OF_ERROR_LINE.test(line)) ?? lines[0] ?? null;
  if (reason === null)
    return `review exited ${input.run.exitCode} with no verdict`;

  // an error whose message already opens with its own class name prints that name
  // twice (`XError: XError: …`); the reason states it once
  return reason.replace(SHAPE_OF_CLASS_NAMED_TWICE, '$1: ');
};

/**
 * .what = a class name that opens a line twice — `XError: XError: `
 * .why = node prints `name: message`, and some errors carry their own name inside
 *        the message too
 */
const SHAPE_OF_CLASS_NAMED_TWICE = /^(\w*Error): \1: /;
