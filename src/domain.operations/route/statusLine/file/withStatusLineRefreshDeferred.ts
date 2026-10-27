import { MalfunctionError } from 'helpful-errors';

import { STORE_OF_STATUS_LINE_REFRESH_DEFERRED } from './STORE_OF_STATUS_LINE_REFRESH_DEFERRED';
import { setRouteStatusLineFileOrWarn } from './setRouteStatusLineFileOrWarn';

/**
 * .what = runs the logic with every status file refresh it asks for held back, then refreshes
 *         each route it named, once, after the logic settles
 * .why = a stone's hold must span one watermark transition, never a render
 *        (rule.require.locks-via-with-simple-mutex), and one compound move (a rewind) must cost
 *        one render, never one per ledger row. the ledger writers keep their refresh as their
 *        last act, so no writer can omit it; under this scope it waits for the scope to end
 *
 * .note = for short compound moves alone (a hold, a rewind). never wrap a guard round: a round
 *         runs for minutes, and its mid-round progress must show on the line as it lands
 * .note = a nested scope defers to the outer one, which owns the flush
 * .note = the flush runs after a throw too, since a write may have landed before it; a flush
 *         defect then rides beside the move's own error, never in place of it
 */
export const withStatusLineRefreshDeferred = async <TOutput>(
  logic: () => Promise<TOutput>,
): Promise<TOutput> => {
  // an outer scope already defers: it flushes for us
  if (STORE_OF_STATUS_LINE_REFRESH_DEFERRED.getStore()) return logic();
  // run the logic with refreshes recorded
  const deferred: Map<
    string,
    { route: string; pointerAuthority: 'lookup' | 'flag' }
  > = new Map();
  const outcome: { ok: true; output: TOutput } | { ok: false; cause: unknown } =
    await STORE_OF_STATUS_LINE_REFRESH_DEFERRED.run(deferred, async () =>
      logic().then(
        (output) => ({ ok: true as const, output }),
        (cause: unknown) => ({ ok: false as const, cause }),
      ),
    );

  // flush each route once; a flush defect after a failed move keeps both errors
  const flushed = await flushDeferred({ deferred }).then(
    () => null,
    (cause: unknown) => ({ cause }),
  );
  if (!outcome.ok && flushed)
    throw new MalfunctionError(
      'the move failed, and its status line refresh failed after it',
      {
        cause: outcome.cause instanceof Error ? outcome.cause : undefined,
        causeOfMove: String(outcome.cause),
        causeOfRefresh: String(flushed.cause),
      },
    );
  if (!outcome.ok) throw outcome.cause;
  if (flushed) throw flushed.cause;
  return outcome.output;
};

/**
 * .what = renders each deferred route once
 */
const flushDeferred = async (input: {
  deferred: Map<string, { route: string; pointerAuthority: 'lookup' | 'flag' }>;
}): Promise<void> => {
  for (const { route, pointerAuthority } of input.deferred.values())
    await setRouteStatusLineFileOrWarn({ route, pointerAuthority });
};
