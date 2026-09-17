import type { GuardProgressEvent } from '../../../../domain.objects/Driver/GuardProgressEvent';

/**
 * .what = the `review` half of a guard progress outcome, from one review's exit
 * .why  = the per-lane closure in `runStoneGuardReviews` sits beside the meter
 *         write and the emit, so this derivation was decode-friction wedged
 *         between two i/o calls. pure, named, and testable at the leaf grain
 * .note = a malfunction/constraint outcome is a MESSAGE, never an Error — an
 *         Error object is constructed only where one is thrown
 */
export const asReviewProgressOutcome = (input: {
  exitClass: 'passed' | 'constraint' | 'malfunction';
  exitCode: number;
  blockers: number;
  nitpicks: number;
  stderr: string;
}): NonNullable<GuardProgressEvent['outcome']>['review'] => {
  // a malfunction carries stderr's lead line, so a driver reads the cause here
  // rather than after they open the artifact
  if (input.exitClass === 'malfunction') {
    const detail = asStderrDetail({ stderr: input.stderr });
    return {
      malfunction: `review command failed with exit code ${input.exitCode}${detail}`,
    };
  }

  // exit 2 WITH blockers means the review ran and found issues; exit 2 WITHOUT
  // them means it never rendered a verdict — an absent credential, say
  if (input.exitClass === 'constraint' && input.blockers === 0)
    return {
      constraint: `review returned constraint (exit code ${input.exitCode}) without blockers`,
    };

  return { blockers: input.blockers, nitpicks: input.nitpicks };
};

/**
 * .what = stderr's lead line, as a suffix a message can carry
 * .why  = `stderr.split('\n')[0]` is positional array access, which
 *         `rule.forbid.inline-decode-friction` names outright
 */
const asStderrDetail = (input: { stderr: string }): string => {
  const lineFirst = input.stderr.split('\n')[0]?.trim();
  return lineFirst ? `. ${lineFirst}` : `. see review artifact for details`;
};
