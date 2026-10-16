import * as fs from 'fs/promises';
import * as path from 'path';

import { asReviewLogsDir } from '@src/domain.operations/review/asReviewLogsDir';
import { isPathPresent } from '@src/domain.operations/review/isPathPresent';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = the nearest ANCESTOR of a dir that carries a review log root, if any
 * .why = 🔴 it exists for the REFUSAL, never for the read. `--at` still defaults to
 *        the bare cwd and this operation does not change that by one byte — it only
 *        lets the refusal say WHERE the reviews actually are.
 *
 *        the miss it answers is not a rare one. `rule.forbid.cwd-outside-gitroot`
 *        forbids the WRITER from writing anywhere but the git root, so a review run
 *        from `my-tree/src/` still logs to `my-tree/.log/…`. a reader that takes the
 *        bare cwd therefore misses by CONSTRUCTION whenever cwd is not the root — and
 *        the refusal it printed said only *"run a review here first"*, which is false
 *        advice to a driver whose reviews ran minutes ago.
 *
 *        ⇒ an error names the fix, never merely the symptom
 *        (rule.require.errors-name-the-fix).
 *
 * .note = 🔴 a HINT is deliberately the whole scope. the fuller repair — let the
 *         default `--at` derive the git root — fails both the SAFE and the CLEAN
 *         test: it moves where two shipped breadths look, and the peer `review`
 *         command reads the cwd the same way, so to change one and not the other
 *         trades one inconsistency for a worse one. that half stays reserved
 *         (`F10`), and the dream carries its shape.
 *
 *         ⇒ the hint makes the miss LEGIBLE; only the walk-up makes it IMPOSSIBLE.
 *
 * .note = it answers the TREE, never the log dir inside it — because the hint it
 *         feeds is a `--at` value, and `--at` takes a tree. to answer the log dir
 *         would put a `path.dirname` at the call site, three segments deep, which is
 *         exactly the re-typed join `asReviewLogsDir` exists to refuse.
 *
 * .note = the walk halts at the filesystem root, which `path.dirname` reports by
 *         answering its own input. that fixed point is the terminator, so no depth
 *         bound is owed and none is imposed.
 */
export const getOneReviewedTreeAbove = async (input: {
  cwd: string;
}): Promise<string | null> => {
  /**
   * .note = deliberate mutation, in a scoped zone. `at` is the walk's cursor and
   *         `rule.require.immutable-vars` forbids a non-const by default, so the
   *         reason is stated rather than left to a reader to judge.
   *
   *         the mutation is SAFE because it is total and monotone: `path.dirname`
   *         is pure, each step is strictly shorter than the last, and the
   *         filesystem root is a fixed point that the `up === at` check reads as
   *         the terminator. so the cursor cannot escape the ancestor chain of its
   *         own seed, and the loop cannot run forever.
   *
   *         it is CONFINED to this function — `at` is never handed out as a mutable
   *         handle, never captured by a closure that outlives the loop, and the one
   *         value that does escape is a `return` of the cursor's then-current
   *         string, which is immutable (rule.forbid.hidden-side-effects).
   *
   * .note = a recursion would drop the `let` and buy a stack frame per ancestor
   *         instead. that trades a named mutation for an unnamed one, so it was
   *         not taken — the convention asks that the mutation be EXAMINED, never
   *         that it be hidden behind a call.
   */
  // the walk seeds from the REAL path, as its twin `getOneReviewedTreeAtOrAbove` does:
  // a symlinked cwd's lexical parents lead into whichever tree holds the link, which is
  // not its ancestor. a cwd removed since it was named has no ancestors to name
  const cwdReal = await fs.realpath(input.cwd).catch((error: unknown) => {
    if (!isErrorOfAbsence({ error })) throw error;
    return null;
  });
  if (cwdReal === null) return null;
  let at = path.dirname(cwdReal);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (await isPathPresent({ at: asReviewLogsDir({ cwd: at }) })) return at;

    const up = path.dirname(at);
    if (up === at) return null;
    at = up;
  }
};
