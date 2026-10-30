import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

import { asRouteStatusLineCachePath } from './cache/asRouteStatusLineCachePath';
import { getOneRouteStatusLineBranch } from './cache/getOneRouteStatusLineBranch';
import {
  getOneRouteStatusLineCache,
  type RouteStatusLineCacheRecord,
} from './cache/getOneRouteStatusLineCache';
import { getOneRouteStatusLineFingerprint } from './cache/getOneRouteStatusLineFingerprint';
import { isRouteStatusLineBindFlagPresent } from './cache/isRouteStatusLineBindFlagPresent';
import { isRouteStatusLineCacheAgeWithinMax } from './cache/isRouteStatusLineCacheAgeWithinMax';
import { setRouteStatusLineCache } from './cache/setRouteStatusLineCache';

/**
 * .what = an fs fault the cache met, and the cache file it met it at
 */
interface RouteStatusLineCacheFault {
  code: string;
  cachePath: string;
}

/**
 * .what = computes the claude code status line, served from a per-branch cache when current
 * .why = the harness repaints the line up to ~3 times a second per seat, and the line is a
 *        display of state that rarely changes. a repaint whose render inputs did not move
 *        prints the line already computed and does no fresh work
 *
 * .note = a hit = the cached fingerprint equals a fresh one AND the cache file is younger
 *         than the max age. it reads one cache file and stats the render inputs, no more
 * .note = a miss renders the cached route while its own bind flag stands and the record is
 *         younger than the max age; else it runs the bind lookup (the repo-wide glob, which
 *         faults loud on a multi-bind). it renders via the extant `stepRouteStatusLine`, then
 *         writes the cache atomically under the fingerprint taken BEFORE the render. an input
 *         that moves mid-render then differs from the cached fingerprint, so the next repaint
 *         misses and heals
 * .note = a hit, and a miss that reuses the cached route, both trust that route's own flag, so
 *         a second bind flag planted by hand beside it surfaces within the max age at most.
 *         `route.bind.set` drops the cache, so a multi-bind made through it faults at once
 * .note = a fault (multi-bind, unreadable route) throws and is never cached: it prints no line.
 *         a degraded phase prints a line, so it IS cached, with its row: each hit returns the
 *         row the miss returned, and the ledgers sit in the fingerprint, so a repair misses
 * .note = it writes no stderr. the rows (a degrade, a cache read fault, a cache write fault)
 *         are returned as data, and the cli entry is the one writer of stderr
 * .note = an unreadable cache file is a miss, never a fault: the line renders afresh, the
 *         write replaces the file, and the read fault is returned for a loud row
 * .note = the render ops load by dynamic import, only on a miss: their module graph is the
 *         cost a hit must not pay (the module-graph clamp, acceptance `[case16]`)
 * .note = it takes no cwd, by design: the bind lookup reads `process.cwd()`, so the cache,
 *         the fingerprint, and the lookup all anchor at the one cwd read here. a cwd input
 *         would advertise an anchor the lookup does not hold
 * .note = `context.renderRoute` defaults to the real render, loaded lazily. a caller that
 *         must act between the fingerprint and the cache write (the mid-render clamp) passes
 *         its own, which calls through to the real one
 */
export const stepRouteStatusLineCached = async (
  _input: Record<string, never> = {},
  context: { renderRoute?: RenderRoute } = {},
): Promise<{
  line: string;
  degradeRow: string | null;
  cacheReadFault: RouteStatusLineCacheFault | null;
  cacheWriteFault: RouteStatusLineCacheFault | null;
}> => {
  // locate this branch's cache, anchored at the process cwd as the bind lookup is
  const cwd = process.cwd();
  const branch = getOneRouteStatusLineBranch({ cwd });
  const cachePath = asRouteStatusLineCachePath({ cwd, branch });

  // read the cache record; an unreadable file is a miss, its fault kept for a loud row
  const { cached, cacheReadFault } = getOneCachedRecordOrFault({ cachePath });
  const nowMs = Date.now();

  // a hit: the cached line is still current
  if (cached && isCacheRecordCurrent({ cwd, branch, cached, nowMs }))
    return {
      line: cached.record.line,
      degradeRow: cached.record.degradeRow,
      cacheReadFault: null,
      cacheWriteFault: null,
    };

  // a miss: find the route, fingerprint its inputs, then render it
  const route = await getOneRouteForMiss({ cwd, branch, cached, nowMs });
  const fingerprint = getOneRouteStatusLineFingerprint({ cwd, branch, route });
  const rendered = await getOneRenderedLine({ route }, context);

  // cache the line and its degrade row; a write fault is reported, never fatal
  const cacheWriteFault = await setCacheOrFault({
    cachePath,
    record: {
      line: rendered.line,
      route,
      fingerprint,
      degradeRow: rendered.degradeRow,
    },
  });
  return {
    line: rendered.line,
    degradeRow: rendered.degradeRow,
    cacheReadFault,
    cacheWriteFault,
  };
};

/**
 * .what = a cache record read from disk, with the time its file was written
 */
interface RouteStatusLineCacheRecordRead {
  record: RouteStatusLineCacheRecord;
  writtenAtMs: number;
}

/**
 * .what = reads the cache file, or returns the fs fault that refused the read
 * .why = an unreadable cache is a miss, never a fault: the miss's write replaces the file
 *
 * .note = only fs faults (a string `code`) are returned; any other error rethrows
 */
const getOneCachedRecordOrFault = (input: {
  cachePath: string;
}): {
  cached: RouteStatusLineCacheRecordRead | null;
  cacheReadFault: RouteStatusLineCacheFault | null;
} => {
  try {
    return {
      cached: getOneRouteStatusLineCache({ cachePath: input.cachePath }),
      cacheReadFault: null,
    };
  } catch (error) {
    const code = getFsErrorCode(error);
    if (code === null) throw error;
    return {
      cached: null,
      cacheReadFault: { code, cachePath: input.cachePath },
    };
  }
};

/**
 * .what = the route a miss renders: the cached route while its own bind flag stands, else
 *         the route the repo-wide bind lookup finds
 * .why = a change to a bound route costs the render alone, never a walk of the whole repo
 *
 * .note = the cached route is reused only when the record is younger than the max age, so
 *         the full lookup — and its loud multi-bind fault — runs at least once per max age.
 *         a hit already trusts the cached route for that long, so a hand-planted second flag
 *         surfaces no later than it would on a hit
 * .note = an unbound record (route null) always runs the lookup: a new flag is what it seeks
 */
const getOneRouteForMiss = async (input: {
  cwd: string;
  branch: string;
  cached: RouteStatusLineCacheRecordRead | null;
  nowMs: number;
}): Promise<string | null> => {
  const routeReusable = getOneCachedRouteReusable(input);
  if (routeReusable !== null) return routeReusable;
  return getOneBoundRoute({ branch: input.branch });
};

/**
 * .what = the cached route, when a miss may render it without the repo-wide lookup; else null
 * .why = names the four terms of reuse: a record, a bound route in it, a young file, and
 *        that route's own bind flag still on disk
 */
const getOneCachedRouteReusable = (input: {
  cwd: string;
  branch: string;
  cached: RouteStatusLineCacheRecordRead | null;
  nowMs: number;
}): string | null => {
  // no record, or an unbound one: no route to reuse
  const routeCached = input.cached?.record.route ?? null;
  if (!input.cached || routeCached === null) return null;

  // an old record: the full lookup is owed once per max age
  if (!isCacheRecordYoung({ cached: input.cached, nowMs: input.nowMs }))
    return null;

  // the route's own bind flag must still stand
  const isFlagPresent = isRouteStatusLineBindFlagPresent({
    cwd: input.cwd,
    route: routeCached,
    branch: input.branch,
  });
  return isFlagPresent ? routeCached : null;
};

/**
 * .what = the route bound to this branch, or null, via the repo-wide bind lookup
 * .why = the glob faults loud on a multi-bind. it loads lazily: its module graph is the
 *        cost a hit must not pay
 *
 * .note = the branch is passed in, the one the cache is keyed by, so the lookup spawns no
 *         second `git rev-parse` and cannot read another branch than the cache names
 */
const getOneBoundRoute = async (input: {
  branch: string;
}): Promise<string | null> => {
  const { getRouteBindByBranch } = await import(
    '@src/domain.operations/route/bind/getRouteBindByBranch'
  );
  return (await getRouteBindByBranch({ branch: input.branch }))?.route ?? null;
};

/**
 * .what = the render of one bound route: its line, and the degrade row its phase owes
 */
type RenderRoute = (input: {
  route: string;
}) => Promise<{ line: string; degradeRow: string | null }>;

/**
 * .what = the real render of a bound route, loaded lazily
 * .why = the render ops' module graph is the cost a hit must not pay
 */
const renderRouteReal: RenderRoute = async (input) => {
  const { stepRouteStatusLine } = await import(
    '@src/domain.operations/route/stepRouteStatusLine'
  );
  return stepRouteStatusLine(input);
};

/**
 * .what = the line for a route: its render, or the blank line when no route is bound
 * .why = the render ops load lazily, so a hit never pays their module graph
 */
const getOneRenderedLine = async (
  input: { route: string | null },
  context: { renderRoute?: RenderRoute },
): Promise<{ line: string; degradeRow: string | null }> => {
  // an unbound seat: the blank line
  if (input.route === null) {
    const { asStatusLine } = await import('./asStatusLine');
    return { line: asStatusLine({ kind: 'blank' }), degradeRow: null };
  }

  // a bound seat: the full render
  const renderRoute = context.renderRoute ?? renderRouteReal;
  return renderRoute({ route: input.route });
};

/**
 * .what = whether a cached record still names the current line
 * .why = its file must be younger than the max age (the backstop for a render input the
 *        fingerprint does not name), and its fingerprint must match a fresh one
 *
 * .note = the age is checked first: it costs no stat. a fault on a render input's stat
 *         throws, so the line faults loud rather than shows a render over a file nobody
 *         could read
 */
const isCacheRecordCurrent = (input: {
  cwd: string;
  branch: string;
  cached: RouteStatusLineCacheRecordRead;
  nowMs: number;
}): boolean =>
  isCacheRecordYoung({ cached: input.cached, nowMs: input.nowMs }) &&
  getOneRouteStatusLineFingerprint({
    cwd: input.cwd,
    branch: input.branch,
    route: input.cached.record.route,
  }) === input.cached.record.fingerprint;

/**
 * .what = whether a cached record's file is younger than the max age
 */
const isCacheRecordYoung = (input: {
  cached: RouteStatusLineCacheRecordRead;
  nowMs: number;
}): boolean =>
  isRouteStatusLineCacheAgeWithinMax({
    writtenAtMs: input.cached.writtenAtMs,
    nowMs: input.nowMs,
  });

/**
 * .what = writes the cache, or returns the fs fault that refused the write
 * .why = an unwritable cache must not blank the line, yet must not hide either
 *
 * .note = only fs faults (a string `code`) are returned; any other error rethrows
 * .note = every fs code is returned, not a short list, by design: the cache is an
 *         optimization, so no fault of its write (EACCES, ENOSPC, EROFS, EIO, …) may blank
 *         a correct line. none is hidden either: the caller prints each to stderr with its
 *         code, its path, and the fix (`asStatusLineCacheWriteFaultRow`)
 */
const setCacheOrFault = async (input: {
  cachePath: string;
  record: RouteStatusLineCacheRecord;
}): Promise<RouteStatusLineCacheFault | null> => {
  try {
    await setRouteStatusLineCache(input);
    return null;
  } catch (error) {
    const code = getFsErrorCode(error);
    if (code === null) throw error;
    return { code, cachePath: input.cachePath };
  }
};
