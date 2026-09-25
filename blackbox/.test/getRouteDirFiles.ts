import * as fs from 'fs/promises';

/**
 * .what = lists a route dir's files, where an ABSENT dir is the only tolerated fault
 * .why = `readdir(dir).catch(() => [])` reads EACCES, EIO, EMFILE, and ENOTDIR as "no
 *        files", so an assertion over the result goes green for the wrong reason and a
 *        fixture mutation that walks the result silently no-ops (`rule.forbid.failhide`).
 *        ENOENT is the real absence; every other error is a fault, and a fault must reach
 *        the test rather than read as an empty dir.
 *
 * 🔴 .why here, rather than `isExpectedFsReadFault` = that allowlist is for a DISPLAY
 *     fallback, and it admits EACCES, EISDIR, ENOTDIR, ELOOP, and ENAMETOOLONG. every one
 *     of those is a broken fixture when a test asks what a route dir holds, so to route a
 *     test read through it would re-introduce the exact swallow this operation removes.
 *     two allowlists, because the two callers tolerate different faults.
 *
 * .note = the two harms are NOT the same size. a read fed to an assertion costs one false
 *         green; a read fed to a fixture mutation — a back-date loop, a cleanup — makes the
 *         loop a no-op, so every case downstream runs against the wrong precondition and
 *         fails as a WRONG VERDICT rather than as a fault. the second sends the next
 *         traveler to debug the subject rather than the fixture.
 */
export const getRouteDirFiles = async (routeDir: string): Promise<string[]> =>
  fs.readdir(routeDir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
