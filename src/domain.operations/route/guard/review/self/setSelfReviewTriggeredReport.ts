import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import { isPathFound } from '../../../isPathFound';
import { asAttemptCount } from './asAttemptCount';
import { getSelfReviewTriggeredPaths } from './getSelfReviewTriggeredPaths';
import { setSelfReviewAttemptTally } from './setSelfReviewAttemptTally';

/**
 * .what = write .since marker (on the ask) and touch .uptil marker (on each adjudicated promise)
 * .why = .since mtime records when the review was asked for; .uptil mtime records the latest attempt
 *
 * .note = sinceOnly lets setStoneAsPassed mint the ask without .uptil, which would otherwise
 *         read as a prior attempt on the driver's first promise
 * .note = attempts counts ADJUDICATED promises only. the ask leaves it at 0.
 *         a usage error must not reach this operation — a burned attempt is a leaked review.
 * .note = the key is (stone, slug) — hashless. see getSelfReviewTriggeredPaths for why.
 *
 * 🔴 .note = `firstAdjudication`, NEVER `attempts`, is what the haste cue reads. the two answer
 *            different questions, and only one of them is safe under the fork:
 *            - `firstAdjudication` is claimed by an ATOMIC exclusive create (`wx`). the OS
 *              guarantees exactly one caller wins that race, so it is true for at most one
 *              promise per slug whatever the concurrency. "fires at most once" then holds BY
 *              CONSTRUCTION rather than by a read the next lane can invalidate.
 *            - `attempts` is a read-modify-write on a text file, so two lanes that promise one
 *              slug in the same instant can both read N and both write N+1. ⇒ it is a
 *              DIAGNOSTIC, it may undercount under a same-slug fork, and no gate reads it.
 *            ⇒ the fork this round enables is what made the distinction matter: before it, one
 *              lane promised at a time, so a stale read could not be stale.
 *
 * ⚠️ .note = `attempts` is KEPT DELIBERATELY, and its cost is real. it is there for the one
 *            caller it serves: a human who opens `.since` by hand and wants to know how many
 *            promises a slug took.
 *            🔴 DO NOT BUILD A GATE ON IT. it is known-racy under a same-slug fork and may
 *            undercount, so a gate keyed on it would fire twice or never. a gate that wants
 *            "how many times" needs an atomic claim per attempt, as `firstAdjudication` is.
 *            ⇒ stated because the other available reading — that the RMW is load-bearing — is
 *              what a maintainer reaches for when they meet this much machinery around a number.
 *
 * 🔴 .note = the tally lives in `setSelfReviewAttemptTally`, its OWN failure domain, and that
 *            boundary carries real load. it used to sit inline below the `.uptil` claim, so a
 *            transient fault in it rejected the whole call AFTER `.uptil` was on disk — the
 *            caller got no verdict, and every retry then read `firstAdjudication: false`,
 *            because the claim was won by a call that never returned. ⇒ a fault in a value no
 *            gate reads would permanently disable the gate beside it. found by a peer lane at
 *            i010. `attempts: null` is the report of that fault, never a count of zero.
 *
 * 🔴 .note = and it lives in its own FILE, `.attempts`, which is a SECOND and separate boundary.
 *            i010 isolated the failure DOMAIN; the tally and the gate operand still shared
 *            `.since`, so every tally write rewrote the file whose mtime the gate reads and then
 *            restored it with `fs.utimes`. that left a transient wrong mtime for any concurrent
 *            reader, and a permanent one if the restore faulted after the write landed — both
 *            swallowed by the best-effort catch. ⇒ **isolation of the failure domain did not
 *            isolate the STORAGE**, and only the second isolation removes the hazard by
 *            construction. found by TWO independent lanes at i013.
 *            ⚠️ THREE markers now: `.since` (the ask, a gate operand) · `.uptil` (the atomic
 *            first-ness claim) · `.attempts` (the diagnostic). only the first two gate aught.
 */
export const setSelfReviewTriggeredReport = async (
  input: {
    stone: string;
    slug: string;
    route: string;
  },
  options?: { sinceOnly?: boolean },
): Promise<{
  sincePath: string;
  uptilPath: string;
  attempts: number | null;
  firstAdjudication: boolean;
}> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // compute marker file paths
  const { sincePath, uptilPath, attemptsPath } =
    getSelfReviewTriggeredPaths(input);

  // probe for the ask. an ENOENT is the real absence; every other error is a fault, and a
  // fault must reach the caller rather than read as "no ask on record"
  // (rule.forbid.failhide — a bare catch here sends an EACCES down the mint-a-new-ask branch,
  //  which overwrites the extant marker AND resets the mtime that dates the ask)
  //
  // 🔴 .note = the SHARED probe, never a private copy. this line was a byte-identical
  //    re-implementation of `isPathFound` until i020 — and `isPathFound` was minted THIS
  //    round to be "the one owner, reached from production and from tests alike" of exactly
  //    this shape. ⇒ the file the round rewrote hardest for atomicity still carried its own
  //    copy, one directory below the owner's own home
  //    (`enroll-impl-arch-defects` nitpick.1 at i020, `rule.prefer.most-common-denominator`)
  const sinceFound = await isPathFound(sincePath);

  // 🔴 mint the ask ATOMICALLY, exactly as the .uptil claim below does.
  // `wx` creates-if-absent in ONE syscall, so under a fork exactly one lane wins the mint and
  // every other lane reads that lane's mtime. a probe-then-write cannot promise that: two lanes
  // can both see ENOENT and both write, and the mtime that survives is then the LAST writer's.
  // that mtime is a GATE operand — the haste cue reads it as askedAt, the freshness bar diffs
  // the articulation against it — so a probe would make a verdict depend on write order.
  if (options?.sinceOnly) {
    await fs
      .writeFile(sincePath, `slug: ${input.slug}`, {
        flag: 'wx',
      })
      .catch((error: NodeJS.ErrnoException) => {
        // another lane won the mint; its mtime dates the ask, so a re-ask is a no-op
        if (error.code === 'EEXIST') return;
        throw error;
      });
    // 🔴 the ask writes `.since` and naught else — no tally line, no second write, no mtime to
    // restore. it reads the tally from `.attempts` instead, because a re-ask of an already
    // promised slug must still report the true count
    const attemptsContent = await fs
      .readFile(attemptsPath, 'utf-8')
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return '';
        throw error;
      });
    return {
      sincePath,
      uptilPath,
      attempts: asAttemptCount(attemptsContent),
      // the ask adjudicates naught, so it claims no first-ness
      firstAdjudication: false,
    };
  }

  // 🔴 .note = an ABSENT ask is a broken precondition here, never a case to recover from. this
  //            branch minted a fresh `.since` dated now until i005 — and that mint LAUNDERED the
  //            absent ask: a pre-rewind articulation then read as fresh against a timestamp that
  //            postdates it, which is the exact defect the freshness bar exists to catch, entered
  //            from the other side. it was also the one non-atomic write left in this operation.
  //            ⇒ the caller (`getSelfReviewChallengeDecision`) returns `challenge:unasked` before
  //              it ever reaches here, so the state is unreachable ABSENT CONCURRENCY — and it
  //              fails loud rather than quiet, because a silent mint is what made it invisible
  //              for a whole round
  // 🔴 .note = it IS reachable under one race, and the throw is the intended answer rather than a
  //            gap. a rewind that lands between the caller's read of the report and this probe
  //            archives `.since` mid-adjudication. the loud throw is right there for two reasons:
  //            no write precedes it (the check sits above the `.uptil` claim), so the throw
  //            corrupts no state; and a rewind that races a promise is a genuinely exceptional
  //            event whose remedy is to re-drive, never a domain verdict to hand the driver.
  //            ⚠️ `challenge:unasked` would be WRONG here — the caller already returns that when
  //            the ask is absent at read time, so to return it again would render a concurrent
  //            rewind indistinguishable from an ordinary un-asked promise.
  //            ⇒ found by a peer lane at i010, which read the older "unreachable" claim as false.
  //              it was: the word covered the sequential case and asserted the concurrent one
  // 🔴 .note = the check sits ABOVE the `.uptil` claim deliberately. below it, a rewind that
  //            archived `.since` between the probe and the check left this call's `wx` write
  //            behind as an ORPHAN `.uptil` — created after the archive walk, so never archived,
  //            and then read by the next ask's report as its own uptil mtime. above the claim,
  //            no write precedes the throw, and zero awaits separate the probe from its read
  if (!sinceFound)
    throw new UnexpectedCodePathError(
      'an adjudicated promise reached setSelfReviewTriggeredReport with no ask on record. the caller must return challenge:unasked first',
      { stone: input.stone, slug: input.slug, sincePath },
    );

  // 🔴 claim first-ness ATOMICALLY, before any decision reads it.
  // `wx` creates-if-absent in ONE syscall and fails `EEXIST` otherwise, so exactly one caller
  // can win — which is what makes the haste cue's "at most once per slug" bound hold under a
  // fork. a read-then-decide on the counter below cannot make that promise
  const firstAdjudication = await fs
    .writeFile(uptilPath, `slug: ${input.slug}`, { flag: 'wx' })
    .then(() => true)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'EEXIST') return false;
      throw error;
    });

  // a later adjudication touches .uptil, so its mtime dates the latest attempt
  if (!firstAdjudication) await fs.writeFile(uptilPath, `slug: ${input.slug}`);

  // raise the diagnostic tally, best effort. it runs in its OWN failure domain AND its own FILE,
  // so a fault in it can neither strand the verdict won above nor touch the `.since` mtime the
  // gate reads
  const attempts = await setSelfReviewAttemptTally({
    attemptsPath,
    slug: input.slug,
  });

  return { sincePath, uptilPath, attempts, firstAdjudication };
};
