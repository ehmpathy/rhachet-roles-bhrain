/**
 * .what = classifies exit codes into semantic categories
 * .why = exit code contract distinguishes pass, constraint, and malfunction
 *
 * exit code contract:
 * - 0 = passed (reviewer/judge succeeded)
 * - 2 = ConstraintError (controlled failure, check failed)
 * - other = MalfunctionError (reviewer/judge itself broke)
 */
export type ExitCodeClass = 'passed' | 'constraint' | 'malfunction';

export const getExitCodeClass = (input: { code: number }): ExitCodeClass => {
  // passed: command succeeded
  if (input.code === 0) return 'passed';

  // constraint: controlled failure (reviewer/judge worked, check failed)
  if (input.code === 2) return 'constraint';

  // malfunction: reviewer/judge itself broke
  return 'malfunction';
};
