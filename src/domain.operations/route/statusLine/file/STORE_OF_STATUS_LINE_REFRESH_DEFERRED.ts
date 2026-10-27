import { AsyncLocalStorage } from 'async_hooks';

/**
 * .what = the routes whose status file refresh waits on the scope that opened this store,
 *         keyed by route dir, each with the route as first named and the strongest pointer
 *         authority any of its writers asked for
 * .why = a ledger write inside a short compound move (a stone's hold, a rewind) must not render
 *        mid-move; it records its route here, and the scope refreshes once at its end
 *        (withStatusLineRefreshDeferred)
 *
 * .note = AsyncLocalStorage, so two scopes aloft in one process each see only their own map
 */
export const STORE_OF_STATUS_LINE_REFRESH_DEFERRED = new AsyncLocalStorage<
  Map<string, { route: string; pointerAuthority: 'lookup' | 'flag' }>
>();
