/**
 * .what = the semantic class of a reviewer or judge exit code
 * .why = the exit code contract distinguishes pass, constraint, and malfunction. the type lives
 *        here, beside the artifacts that carry it, so a domain object never reaches up into
 *        `domain.operations` for its own field type (rule.require.directional-deps)
 *
 * exit code contract:
 * - 0 = passed (reviewer/judge succeeded)
 * - 2 = ConstraintError (controlled failure, check failed)
 * - other = MalfunctionError (reviewer/judge itself broke)
 */
export type ExitCodeClass = 'passed' | 'constraint' | 'malfunction';
