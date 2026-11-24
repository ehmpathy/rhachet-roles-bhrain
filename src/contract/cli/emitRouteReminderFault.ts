import { BadRequestError } from 'helpful-errors';
import { types } from 'util';

import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';

import { asRouteReminderMalfunction } from './asRouteReminderMalfunction';
import { asRouteReminderRefusal } from './asRouteReminderRefusal';

/**
 * .what = the route.reminder shell's fault frame: a caller constraint renders and exits 2; any
 *         other error renders as a malfunction and exits 1
 * .why = the four reminder skills run their entrypoint via `node -e import(…)`. with no catch, a
 *        refusal died on an unhandled rejection: exit 1, a raw stack, no qualified header. this
 *        maps each fault at the one seam where the process exits, behind the header that names who
 *        acts (rule.require.exit-code-semantics, rule.require.qualified-error-headers)
 *
 * .note = it lives at the contract boundary since it owns the i/o and the exit, the same as
 *         emitStatusLineFault. the in-process entrypoints still throw, so a caller (a test, a
 *         hook) gets the error itself
 *
 * .note = a thrown value that is no error at all carries no message to frame, so it rethrows
 */
export const emitRouteReminderFault = (input: { error: unknown }): never => {
  // a caller constraint: the shared refusal frame on stderr, then exit 2
  if (input.error instanceof BadRequestError) {
    emitReviewRefusal({
      kind: 'constraint',
      ...asRouteReminderRefusal({ error: input.error }),
    });
    return process.exit(2);
  }

  // a thrown non-error has no message to frame: rethrow it as is
  // (isNativeError, never `instanceof Error`: a node fs error from another vm realm fails `instanceof`)
  if (!types.isNativeError(input.error)) throw input.error;

  // any other error is the system's to fix: the malfunction frame, its stack kept, then exit 1
  emitReviewRefusal({
    kind: 'malfunction',
    ...asRouteReminderMalfunction({ error: input.error }),
  });
  return process.exit(1);
};
