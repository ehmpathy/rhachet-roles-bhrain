import { asStatusLineFaultRow } from '@src/domain.operations/route/statusLine/asStatusLineFaultRow';
import { isCallerConstraintError } from '@src/utils/isCallerConstraintError';

/**
 * .what = the status line's fault frame: log the row, then exit
 * .why = the row and the exit policy are one fact, held in one place. its one caller is
 *        `route.status.line`, which the legacy `cli/route` export forwards to
 *
 * .note = it lives at the contract boundary since it owns the i/o and the exit; the row
 *         itself stays a pure transformer in the domain
 * .note = fail loud, never hidden: the row goes to stderr (never stdout, which the harness
 *         renders as the line). a caller constraint exits 2 (rule.require.exit-code-semantics);
 *         every other fault is rethrown, so the process exits non-zero with its stack
 */
export const emitStatusLineFault = (input: { error: unknown }): never => {
  console.error(asStatusLineFaultRow({ error: input.error }));
  if (isCallerConstraintError(input.error)) process.exit(2);
  throw input.error;
};
