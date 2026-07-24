import * as fs from 'fs/promises';

import { getFsErrorCode } from './getFsErrorCode';

/**
 * .what = gen a file at `at` with `content`; idempotent + race-safe. the `idem` option
 *         picks the idempotent primitive: `findsert` (default, existence-only) or
 *         `upsert` (reconcile the content to `content`).
 * .why = the glossary scaffold writes a static .gitignore into the cache (findsert —
 *        stable, keep any local edits). a stat-then-write check-then-act races under two
 *        concurrent clone-face runs; the `wx` flag makes the create atomic — the loser
 *        catches EEXIST and converges (rule.require.idempotent-operations).
 *
 *        `upsert` earns its keep for any machine-owned content whose source can change: a
 *        version bump that changes the declared content must reach the committed file, not
 *        sit stale behind a findsert. upsert reconciles to the declared content — converge
 *        to the state, not mere existence.
 * .note = the return `created` reads as "written this run": true when the file was
 *         absent OR (upsert) rewritten; false when already at `content`. findsert
 *         preserves an already-present file (so a hand-edited findsert file survives);
 *         upsert overwrites it, so reserve upsert for machine-owned content.
 */
export const genFile = async (input: {
  at: string;
  content: string;
  idem?: 'findsert' | 'upsert';
}): Promise<{ created: boolean }> => {
  const idem = input.idem ?? 'findsert';

  // absent → create atomically; `wx` throws EEXIST if a concurrent run beat us to it
  try {
    await fs.writeFile(input.at, input.content, { flag: 'wx' });
    return { created: true };
  } catch (error) {
    // only EEXIST is benign (already present, or a concurrent run won the race);
    // all else fails loud (rule.forbid.failhide). getFsErrorCode reads the code by
    // shape, not instanceof — vm-realm safe for a native fs rejection
    if (getFsErrorCode(error) !== 'EEXIST') throw error;

    // findsert: present is enough — converge without a content reconcile
    if (idem === 'findsert') return { created: false };

    // upsert: reconcile the content — no-op when already equal, else overwrite
    const current = await fs.readFile(input.at, 'utf8');
    if (current === input.content) return { created: false };
    await fs.writeFile(input.at, input.content);
    return { created: true };
  }
};
