import * as fs from 'fs/promises';

import { isENOENT } from '../guard/isENOENT';

/**
 * .what = removes a file, and treats an ALREADY-ABSENT file as the job done
 * .why = every unlink on the lock path races a peer that may have removed it first — a
 *        human by hand, or a reap that won its claim. an absent lock is the state the
 *        caller wanted, so it is a success rather than a fault
 *        (`rule.require.idempotent-operations`)
 *
 * .note = named, since `del` already means "no-op if absent" (`rule.require.get-set-gen-verbs`)
 *
 * .note = every other unlink fault (EACCES, EBUSY, EPERM) travels. a lock that could not
 *         be removed is a wedge the caller must hear about, never one to swallow
 */
export const delOneFile = async (input: { path: string }): Promise<void> => {
  await fs.unlink(input.path).catch((error: unknown) => {
    if (isENOENT(error)) return;
    throw error;
  });
};
