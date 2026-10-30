import { DIR_OF_ROUTE_STATUS_LINE_CACHE } from './cache/asRouteStatusLineCachePath';
import { ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS } from './cache/ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS';

/**
 * .what = the stderr row for a status line cache drop that failed at bind time
 * .why = the bind landed; a seat on the node entry may lag it for up to the max age. the
 *        bash reader reads the status file the bind writes next, so it does not lag. the
 *        fix names the node records alone: the dir also holds the bash reader's pointers
 */
export const asStatusLineCacheDropFaultRow = (input: {
  code: string;
}): string =>
  `[route.bind.set] warn: status line cache drop failed (${input.code}); a seat on the node entry may lag the bind for up to ${ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS / 1000}s. fix: rm -f ${DIR_OF_ROUTE_STATUS_LINE_CACHE}/branch=*.json (keep the branch=*.route pointers), or repair its permissions`;
