import type { ReviewRubric } from './asReviewRubricsConfig';

/**
 * .what = wraps a value as a single-quoted, injection-safe shell argument
 * .why = the cmd runs through a shell (runOneReview execs a string). a raw single-quote in a
 *        value (a rubric path, a brain slug, an output path) would otherwise close the quote
 *        and let the rest of the value break — or hijack — the command. the POSIX-safe escape
 *        is: end the quote, emit an escaped quote, reopen — `'` becomes `'\''`. a value with no
 *        quote renders as plain `'value'`, unchanged (rule.prefer.prevent-over-correct).
 */
const asShellArg = (input: { value: string }): string =>
  `'${input.value.replace(/'/g, "'\\''")}'`;

/**
 * .what = builds the `rhx review …` command string that reviews one rubric
 * .why = review.by dispatches this cmd through the shared runOneReview runner (subprocess),
 *        exactly as the route guard execs its peer cmd. the rubric supplies the rules; the
 *        caller forwards scope (paths/diffs), brain, and the per-rubric output path. one place
 *        that knows the review flag contract, so a flag change is a one-file edit.
 */
export const genReviewRubricCmd = (input: {
  rubric: ReviewRubric;
  output: string;
  paths: string | null;
  diffs: string | null;
  mode: string | null;
  brain: string | null;
}): string => {
  // each rule becomes its OWN --rules flag. review's --rules glob is expanded by globby, which
  // does NOT split a value on commas — a comma-joined 'a.md,b.md' reads as one literal pattern and
  // matches no files. review accepts a repeated --rules flag instead (parseReviewArgs collects them
  // into an array), so we emit one flag per rule. a single-rule rubric renders one flag, unchanged.
  const rulesArgs = input.rubric.rules.map(
    (rule) => `--rules ${asShellArg({ value: rule })}`,
  );

  // assemble the flags; forward only those the caller supplied. every value is shell-escaped
  // so a stray quote in config/args cannot break or hijack the command.
  // .note = review's live flags are --paths-with (--paths is deprecated) and --focus
  //         (review has no --mode); review.by's --paths/--mode map onto them (review.ts).
  const parts = ['rhx review', ...rulesArgs];
  if (input.paths !== null)
    parts.push(`--paths-with ${asShellArg({ value: input.paths })}`);
  if (input.diffs !== null)
    parts.push(`--diffs ${asShellArg({ value: input.diffs })}`);
  if (input.mode !== null)
    parts.push(`--focus ${asShellArg({ value: input.mode })}`);
  if (input.brain !== null)
    parts.push(`--brain ${asShellArg({ value: input.brain })}`);
  parts.push(`--output ${asShellArg({ value: input.output })}`);

  return parts.join(' ');
};
