import { DIR_OF_ROUTE_STATUS_LINE_CACHE } from './cache/asRouteStatusLineCachePath';
import { ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS } from './cache/ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS';

/**
 * .what = the stderr row for a status line cache drop that failed at bind time
 * .why = the bind landed; the line may lag it for up to the max age. the row names the
 *        code, the bound on the lag, and the fix, beside its peers (the read and write rows)
 */
export const asStatusLineCacheDropFaultRow = (input: {
  code: string;
}): string =>
  `[route.bind.set] warn: status line cache drop failed (${input.code}); the line may lag the bind for up to ${ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS / 1000}s. fix: remove ${DIR_OF_ROUTE_STATUS_LINE_CACHE}/, or repair its permissions`;
