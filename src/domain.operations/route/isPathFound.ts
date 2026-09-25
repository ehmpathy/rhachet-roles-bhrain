import * as fs from 'fs/promises';

/**
 * .what = whether a path is present on disk — true if found, false if genuinely absent
 * .why = the one honest presence probe. a bare `.catch(() => false)` reads an EACCES, an EIO,
 *        or an ENOTDIR as "not there", so an assertion goes green for the wrong reason and a
 *        production branch takes the absent path on a fault (`rule.forbid.failhide`).
 *
 * .note = ENOENT is the ONLY absence. every other error is a fault and reaches the caller.
 * .note = it answers presence, never readability — `fs.access` with no mode checks visibility
 *         alone, so a file the process may see and not read still reports `true`.
 *
 * 🔴 .note = the shape lived as a private copy in three test files before i017, and one peer
 *            round found six MORE sites that still carried the bare form
 *            (`mech-failhides` blocker.1, `arch-hazards-maintenance` nitpick.1). a probe
 *            re-derived per file is a probe that is right in some files and wrong in others
 *            ⇒ one owner, reached from production and from tests alike
 *            (`rule.prefer.most-common-denominator`).
 *
 * 🔴 .note = `async`, deliberately. a bare `return fs.access(at).then(…)` hands back a promise
 *            minted in node's INTERNAL realm, and `Promise.resolve(p) === p` is false for one
 *            of those inside a jest vm context — so `getError` reads it as a non-promise,
 *            attaches no handler, and the fault escapes as an unhandled rejection while the
 *            assertion reads `no error was thrown`. an `async` fn mints in the CALLER's realm.
 */
export const isPathFound = async (at: string): Promise<boolean> => {
  try {
    await fs.access(at);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
};
