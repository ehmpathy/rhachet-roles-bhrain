import * as fs from 'fs/promises';

import { getFsErrorCode } from './getFsErrorCode';

/**
 * .what = gen a symlink at `at` that targets `to`; idempotent + race-safe. the `idem`
 *         option picks the idempotent primitive: `findsert` (default, existence-only)
 *         or `upsert` (reconcile the target to `to`).
 * .why = the glossary scaffold links its rules back to the install-managed learner
 *        briefs. fs.symlink is atomic — it throws EEXIST when `at` already exists, so
 *        the create IS the find: no lstat pre-check on the happy path. tolerate EEXIST
 *        (already present, or a concurrent clone-face run won the race) so both runs
 *        converge instead of one throw (rule.require.idempotent-operations).
 *
 *        `upsert` earns its keep: the target briefs are install-managed, so if a rule
 *        is renamed (or a prior run wrote a stale target) the link must re-point rather
 *        than point at a ghost. upsert reconciles to the declared `to` — converge to
 *        the state, not mere existence (rule.require.idempotent-operations).
 * .note = the return `created` reads as "written this run": true when the link was
 *         absent OR (upsert) re-pointed; false when already at `to`. upsert refuses to
 *         clobber a non-symlink at `at` — that is an unexpected state, so it fails loud
 *         (rule.forbid.failhide) rather than delete a real file.
 */
export const genSymlink = async (input: {
  at: string;
  to: string;
  idem?: 'findsert' | 'upsert';
}): Promise<{ created: boolean }> => {
  const idem = input.idem ?? 'findsert';

  // absent → create; fs.symlink is atomic and throws EEXIST if a run beat us to it
  try {
    await fs.symlink(input.to, input.at);
    return { created: true };
  } catch (error) {
    // only EEXIST is benign (already present, or a concurrent run won the race);
    // all else fails loud (rule.forbid.failhide). getFsErrorCode reads the code by
    // shape, not instanceof — vm-realm safe for a native fs rejection
    if (getFsErrorCode(error) !== 'EEXIST') throw error;

    // findsert: present is enough — converge without a target reconcile
    if (idem === 'findsert') return { created: false };

    // upsert: reconcile the target to the declared `to`
    const link = await fs.lstat(input.at);
    if (!link.isSymbolicLink())
      throw new Error(
        `genSymlink upsert: ${input.at} is present but is not a symlink — refuse to clobber`,
      );
    const target = await fs.readlink(input.at);
    if (target === input.to) return { created: false }; // already at `to`

    // re-point: unlink the stale link, then re-create at the declared target
    await fs.unlink(input.at);
    await fs.symlink(input.to, input.at);
    return { created: true };
  }
};
