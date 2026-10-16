import * as path from 'path';

import { asReviewWarmerDir } from './asReviewWarmerDir';
import { asReviewWarmerPathSegment } from './asReviewWarmerPathSegment';

/**
 * .what = the output log for one warmer's whole life — all k of its pokes, in order
 *
 * .why = keyed by the run the warmer was spawned for, because that is the axis its
 *        one reader reads on. no operation consumes these files —
 *        `getOneWarmerSpend` reads the run-dir `warmer.pokes.jsonl` — they exist
 *        for the `cat` 0.wish bar 9b promises a driver mid-flight: the warmer's log
 *        is readable while it runs, since a detached process has no terminal and
 *        its rows are its only voice.
 *
 *        a key of attempt (1..k within one warmer's life, reset to 1 on the next
 *        spawn) parts the pokes of one warmer but cannot part warmers from each
 *        other: one warmer's chronology scatters across k files, and k warmers'
 *        rows mix inside each file — `cat output.*.log` would yield every
 *        attempt-1 row across all history then every attempt-2, k interleaved
 *        chronologies sorted by poke index rather than time, so a driver who
 *        reads a live spender could see a week-old row as current.
 *
 * .note = the run slug, never a fresh stamp of spawn time, buys three properties a
 *         stamp does not:
 *
 *         - it joins the two sinks. `output.<run>.log` names the exact run dir
 *           whose `warmer.pokes.jsonl` mirrors it, so a reader in the per-reviewer
 *           dir can say which round each warmer served
 *         - it sorts chronologically under the glob, because `genLogDirName`
 *           leads with an escaped iso stamp of fixed width. `cat output.*.log`
 *           therefore reads oldest-first, one warmer per block
 *         - it is already held. a warmer is spawned for exactly one run and
 *           `setReviewWarmerPokes` takes that run's `logDir`, so no new identity is
 *           threaded through the loop to reach this seam
 *
 * .note = what protects an earlier warmer's record is the append in
 *         `setOneWarmerPokeRow`, never this key. a comment that names the wrong
 *         protection licenses the defect it warns about: it reads a switch of
 *         `appendFileSync` to `writeFileSync` as a tidy-up rather than the data
 *         loss it is. clamped by `setReviewWarmerPokes.integration.test [case7]`.
 */
export const asReviewWarmerOutputPath = (input: {
  cwd: string;
  reviewer: string;
  /** the run this warmer was spawned for — one file per warmer life, k rows inside it, in order */
  run: string;
}): string =>
  path.join(
    asReviewWarmerDir(input),
    `output.${asReviewWarmerPathSegment({ of: input.run })}.log`,
  );
