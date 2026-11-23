import {
  BadRequestError,
  ConstraintError,
  UnexpectedCodePathError,
} from 'helpful-errors';

import { MESSAGE_OF_TORN_PASSAGE_LINE } from '@src/domain.operations/route/passage/MESSAGE_OF_TORN_PASSAGE_LINE';
import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

import { asStatusLineFileWriteFaultRow } from '../asStatusLineFileWriteFaultRow';
import { asRouteStatusLineRouteDir } from '../cache/asRouteStatusLineRouteDir';
import { STORE_OF_STATUS_LINE_REFRESH_DEFERRED } from './STORE_OF_STATUS_LINE_REFRESH_DEFERRED';
import { setRouteStatusLineFile } from './setRouteStatusLineFile';

/**
 * .what = writes the route's status file; a fault of the write warns on stderr, never fails
 * .why = the writer runs as the last act of a move that already landed (a passage, a meter
 *        round, a bind). a display cache must never veto the state it displays, so a fault
 *        is reported loud with its fix and the move still succeeds. the line reads stale
 *        until the next write, which the reader shows as such
 *
 * .note = the catch allowlists the faults a route's own state can cause: an fs fault (a
 *         string `code`), a corrupt ledger (a raw `SyntaxError`, or the passage parser's own
 *         torn-line error, `MESSAGE_OF_TORN_PASSAGE_LINE`), and a route-state refusal
 *         (`BadRequestError`, `ConstraintError`). any other error is a defect, and rethrows
 *         (rule.forbid.failhide)
 * .note = under a deferral scope (withStatusLineRefreshDeferred, which a stone's hold opens)
 *         it records the route and returns; the scope renders once after the hold releases
 */
export const setRouteStatusLineFileOrWarn = async (input: {
  route: string;
  pointerAuthority: 'lookup' | 'flag';
}): Promise<void> => {
  // under a deferral scope (a stone's hold), record the route; the scope refreshes it later
  // .note = keyed by the route's dir, so a relative route and its absolute twin render once
  const deferred = STORE_OF_STATUS_LINE_REFRESH_DEFERRED.getStore();
  if (deferred) {
    const key = asRouteStatusLineRouteDir({
      cwd: process.cwd(),
      route: input.route,
    });
    const isLookup =
      deferred.get(key)?.pointerAuthority === 'lookup' ||
      input.pointerAuthority === 'lookup';
    deferred.set(key, {
      route: input.route,
      pointerAuthority: isLookup ? 'lookup' : 'flag',
    });
    return;
  }

  // render and write now; an expected fault warns, any other rethrows
  try {
    await setRouteStatusLineFile(input);
  } catch (error) {
    const cause = asExpectedFaultCause({ error });
    if (cause === null) throw error;
    console.error(asStatusLineFileWriteFaultRow({ cause, route: input.route }));
  }
};

/**
 * .what = the short cause of an expected write fault, or null for an unexpected error
 * .why = names the allowlist in one place, so the catch reads as narrative
 */
const asExpectedFaultCause = (input: { error: unknown }): string | null => {
  const code = getFsErrorCode(input.error);
  if (code !== null) return code;
  if (input.error instanceof SyntaxError) return 'corrupt ledger';
  if (
    input.error instanceof UnexpectedCodePathError &&
    input.error.message.includes(MESSAGE_OF_TORN_PASSAGE_LINE)
  )
    return 'corrupt ledger';
  if (
    input.error instanceof BadRequestError ||
    input.error instanceof ConstraintError
  )
    return input.error.message.split('\n')[0] ?? input.error.name;
  return null;
};
