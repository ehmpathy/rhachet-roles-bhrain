import * as fs from 'fs/promises';

import { asAttemptCount } from './asAttemptCount';

/**
 * .what = raise the adjudicated-promise tally in `.attempts` by one, best effort
 * .why = the tally is a DIAGNOSTIC — a human who opens the route dir by hand wants to know how
 *        many promises a slug took. no gate reads it (`setSelfReviewTriggeredReport`'s docblock
 *        states this, and `getSelfReviewChallengeDecision` destructures `firstAdjudication` alone).
 *
 * 🔴 .note = it writes `.attempts`, and it may NEVER write `.since`. until 2026-09-20 it wrote the
 *            tally INTO `.since` and restored that file's mtime with `fs.utimes` — and `.since`'s
 *            mtime is a live gate operand (`askedAt` for the haste cue, the freshness bar's
 *            baseline). two hazards followed, and the `utimes` restore could only narrow the first:
 *            - TRANSIENT: between the write and the restore, `.since` is stamped NOW. a concurrent
 *              lane whose `fs.stat` lands in that window reads the ask as dated now ⇒ a driver
 *              thorough for 40 minutes meets `challenge:rushed`, or a fresh articulation reads as
 *              stale. microseconds wide, and the fork this round enables is what makes it real
 *            - PERMANENT: if the write lands and the `utimes` faults (EACCES, EIO, ENOSPC), the
 *              catch below swallows it and `.since` keeps the NOW stamp forever. the ask's date is
 *              silently rewritten and every later gate reads a falsified ask — so a fault in a
 *              value no gate reads would destroy a gate operand, and report itself as a benign
 *              `null`
 *            ⇒ a separate FILE removes both by construction rather than narrows one. there is no
 *              window left to shrink and no restore left to fault.
 *            found by TWO independent peer lanes at i013, which converged on this same repair.
 *
 * 🔴 .note = it returns `null` on ANY fault rather than throws, and that is the other reason it is
 *            its own operation. it used to sit inline BELOW the atomic `.uptil` claim, in the same
 *            failure domain — so a transient fault here rejected the whole call AFTER `.uptil` was
 *            already on disk. the caller then received no verdict, and every retry read
 *            `firstAdjudication: false`, because the claim was won by a call that never returned.
 *            ⇒ **a fault in a value no gate reads would permanently disable the gate beside it.**
 *            found by a peer lane at i010; no prior round exercised it, since it needs a fault
 *            mid-write or a rewind that races a promise.
 *
 * ⚠️ .note = `null` means "the tally could not be raised", NEVER "zero attempts". the two are
 *            different facts, and a caller that collapses them would report a fresh slug where the
 *            truth is an unreadable one. the return type says so rather than a sentinel.
 *
 * ⚠️ .note = an ABSENT `.attempts` reads as 0 rather than as a fault, and that is correct: the ask
 *            mints `.since` alone, so the first adjudicated promise is the first write here. every
 *            OTHER error still reaches the catch and returns `null`.
 */
export const setSelfReviewAttemptTally = async (input: {
  attemptsPath: string;
  slug: string;
}): Promise<number | null> => {
  try {
    const content = await fs
      .readFile(input.attemptsPath, 'utf-8')
      .catch((error: NodeJS.ErrnoException) => {
        // the ask mints no tally, so the first promise finds none. every other fault falls
        // through to the catch below and reports itself as `null`
        if (error.code === 'ENOENT') return '';
        throw error;
      });
    const attempts = asAttemptCount(content) + 1;
    await fs.writeFile(
      input.attemptsPath,
      [`slug: ${input.slug}`, `attempts: ${attempts}`].join('\n'),
    );
    return attempts;
  } catch (error) {
    // 🔴 EVERY fault is ABSORBED here rather than rethrown, and the breadth is the point.
    // the caller needs the opposite of a throw — it holds a verdict already won on disk, and to
    // let any fault through would strand that claim and disable a gate for the slug's whole life.
    //
    // 🔴 but absorbed is not HIDDEN, and until i017 it was. the old catch bound no error and
    // named no code, so an EACCES, EIO, EISDIR, or ENOSPC reached the operator as a bare `null`
    // — which says the tally is unreadable and never says WHY. two peer lanes found that
    // independently in one round (`arch-hazards-maintenance` blocker.1, `mech-failhides`
    // nitpick.1), and both are right: `rule.forbid.failhide`'s claim is about the fault's
    // IDENTITY, never about the control flow.
    //
    // ⇒ the repair keeps the `null` and surfaces the fault on stderr. the caller is unstranded,
    // the operator is told, and no gate operand is touched either way
    // (`rule.forbid.stdout-on-exit-errors`: a fault report belongs on stderr).
    const code =
      (error as NodeJS.ErrnoException | undefined)?.code ?? 'UNKNOWN';
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      `🟡 self-review attempt tally unwritten (${code}) — the promise verdict stands, the count does not\n` +
        `   ├─ path: ${input.attemptsPath}\n` +
        `   ├─ slug: ${input.slug}\n` +
        `   └─ why:  ${reason}`,
    );

    // 🟡 the blast radius is bounded to the diagnostic itself. while this wrote `.since`, a
    // swallowed fault could leave a GATE operand corrupt; it can now leave only the tally stale.
    return null;
  }
};
