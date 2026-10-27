import * as fs from 'fs';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = the one record the status line cache holds per branch
 * .why = the line already computed, the route it named, and the fingerprint it was computed
 *        from — so a repaint can tell whether that line is still current
 *
 * .note = `degradeRow` is the stderr row of a render whose phase derivation faulted, else
 *         null; a hit replays it, so the cache never silences a ledger that needs repair
 * .note = the record holds no time: its age is the cache file's own mtime, set by the
 *         atomic rename that wrote it (rule.forbid.timestamps-in-route-artifacts, `.exception`)
 */
export interface RouteStatusLineCacheRecord {
  line: string;
  route: string | null;
  fingerprint: string;
  degradeRow: string | null;
}

/**
 * .what = reads the branch's status line cache record and its write time, or null when
 *         there is none to use
 * .why = an absent or corrupt cache is a MISS, never a fault: the line is computed fresh and
 *        the cache rewritten, so a broken cache costs one recompute and never correctness
 *
 * .note = only absence (ENOENT, ENOTDIR) and a json SyntaxError read as a miss here; any other
 *         fault — a permission denial, an io error — rethrows (rule.forbid.failhide), and the
 *         caller turns an fs code into a loud miss
 */
export const getOneRouteStatusLineCache = (input: {
  cachePath: string;
}): { record: RouteStatusLineCacheRecord; writtenAtMs: number } | null => {
  const found = getOneCacheFileContent({ filePath: input.cachePath });
  if (found === null) return null;
  const record = asRouteStatusLineCacheRecordOrNull({ raw: found.raw });
  if (record === null) return null;
  return { record, writtenAtMs: found.mtimeMs };
};

/**
 * .what = the cache file's utf-8 content and mtime, or null when the file is absent
 * .why = the cache is disposable; an absent one is a miss
 *
 * .note = content and mtime come from ONE open file: a rename between two path lookups
 *         would pair old content with a new file's mtime and stretch the max age
 */
const getOneCacheFileContent = (input: {
  filePath: string;
}): { raw: string; mtimeMs: number } | null => {
  const fd = getOneOpenFdOrNull({ filePath: input.filePath });
  if (fd === null) return null;
  try {
    const { mtimeMs } = fs.fstatSync(fd);
    return { raw: fs.readFileSync(fd, 'utf-8'), mtimeMs };
  } finally {
    fs.closeSync(fd);
  }
};

/**
 * .what = a read-only fd for a file, or null when the file is absent
 */
const getOneOpenFdOrNull = (input: { filePath: string }): number | null => {
  try {
    return fs.openSync(input.filePath, 'r');
  } catch (error) {
    if (isErrorOfAbsence({ error })) return null;
    throw error;
  }
};

/**
 * .what = parses the raw cache json into a record, or null when it is not one
 * .why = a torn, hand-edited, or older-shaped file must read as a miss, never as a line
 */
const asRouteStatusLineCacheRecordOrNull = (input: {
  raw: string;
}): RouteStatusLineCacheRecord | null => {
  const parsed = asJsonOrNull({ raw: input.raw });
  if (typeof parsed !== 'object' || parsed === null) return null;

  // narrow each field via `in` + typeof, so no cast asserts the shape
  if (!('line' in parsed) || typeof parsed.line !== 'string') return null;
  if (!('route' in parsed)) return null;
  if (typeof parsed.route !== 'string' && parsed.route !== null) return null;
  if (!('fingerprint' in parsed) || typeof parsed.fingerprint !== 'string')
    return null;
  if (!('degradeRow' in parsed)) return null;
  if (typeof parsed.degradeRow !== 'string' && parsed.degradeRow !== null)
    return null;
  return {
    line: parsed.line,
    route: parsed.route,
    fingerprint: parsed.fingerprint,
    degradeRow: parsed.degradeRow,
  };
};

/**
 * .what = JSON.parse, or null on a SyntaxError
 * .why = corrupt json is a miss; any other throw is a defect and rethrows
 */
const asJsonOrNull = (input: { raw: string }): unknown => {
  try {
    return JSON.parse(input.raw);
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};
