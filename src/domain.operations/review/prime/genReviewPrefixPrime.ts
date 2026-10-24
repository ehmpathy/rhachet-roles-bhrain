import { sleep } from 'iso-time';
import { getUuid } from 'uuid-fns';

import { asReviewWatermarkKey } from '@src/domain.operations/review/watermark/asReviewWatermarkKey';
import { asWatermarkFaultOrThrow } from '@src/domain.operations/review/watermark/asWatermarkFaultOrThrow';

import { asReviewPrimeFaultLine } from './asReviewPrimeFaultLine';
import { genPartOfMeet } from './meet/genPartOfMeet';
import { getOneMsLeftOfMeet } from './meet/getOneMsLeftOfMeet';
import { getOneOutcomeOfLeader } from './meet/getOneOutcomeOfLeader';
import { getOneReleaseOfHolder } from './meet/getOneReleaseOfHolder';
import { setReleaseOfClaim } from './meet/setReleaseOfClaim';
import type { ReviewPrefixPrimeOutcome } from './ReviewPrefixPrimeOutcome';

/**
 * .what = the default windows of the meet, in milliseconds
 *
 * .note = `gather` is how long the lane that claims the head waits for a peer
 *         before it decides a prime is worth a poke. the guard launches a
 *         level's lanes ~62ms apart (measured 2026-10-06), but each lane then
 *         compiles its own scope, so the gap at this point runs to a second or
 *         so. 1.5s covers it; a solo lane pays only this wait, never a poke
 * .note = `await` bounds how long a peer waits on the primer, and is the age past
 *         which an unreleased claim is judged abandoned. it exceeds the poke's own
 *         wedge bound (`MS_OF_POKE_TIMEOUT`, 120s) by a margin, so a healthy primer
 *         always writes its release first; a primer that crashed costs its peers
 *         this wait once, and never the review — the lane's deadline caps it too
 * .note = `stale` is the age past which a release no longer implies a warm cache.
 *         a provider holds a prefix for ~5 minutes from its last read, so a release
 *         younger than 4 minutes means the prefix was sent recently and a lane that
 *         finds it can pour at once
 * .note = `reach` is the age a COLD release must reach before a late lane reads its head as
 *         written. a leader whose review departs at its release (it went solo, or its poke
 *         faulted) carries the head to the provider in that review; once its prefill has had
 *         this long to land, the head is in cache. lanes reach the meet after their own
 *         compile, so arrival spreads by seconds — past any gather — and without this rule
 *         each late lane claimed the head afresh and went solo too (measured 2026-10-08:
 *         every prime watermark read `peers: []`, `warm: false`). a late lane that arrives
 *         sooner waits out the remainder, never a poke
 */
const MS_OF_GATHER_DEFAULT = 1_500;
const MS_OF_AWAIT_DEFAULT = 130_000;
const MS_OF_STALE_DEFAULT = 4 * 60_000;
const MS_OF_POLL_DEFAULT = 100;
const MS_OF_REACH_DEFAULT = 5_000;

/**
 * .what = finds a prime of this head, or creates one — across every lane that
 *         shares the head, in any process
 *
 * .why = the guard pours a level's lanes at once, each as its own `rhx review`
 *        subprocess. lanes whose heads are byte-identical arrive at the brain
 *        within milliseconds of each other, before any has written the prefix to
 *        the cache, so all miss and each pays the head in full (measured: N
 *        lanes, 0 cache read). the pour is not known in any one process, so the
 *        prime is coordinated on one watermark per head key, which every lane can
 *        read (rule.require.prime-the-shared-prefix-before-a-pour)
 *
 * .note = 🔴 no lock spans the prime. each read-check-write of the watermark runs
 *         inside a short hold; the poke itself, and every wait, runs outside it
 *         (rule.require.locks-via-with-simple-mutex)
 * .note = 🔴 the reviews still pour. only ONE poke (max one output token) goes
 *         first; each lane then runs its own review at once
 *         (rule.forbid.serial-reviews-that-could-pour)
 * .note = 🔴 a prime is an optimization, never a gate. a poke fault or a watermark
 *         fault is named on stderr and the lane pours cold; a peer that never sees a
 *         release pours at its deadline (rule.forbid.cold-pour-of-a-shared-prefix).
 *         a defect in our own code still rethrows (rule.forbid.failhide)
 * .note = 🔴 the meet never spends past `input.deadline.msOfStop` — the instant past which
 *         the lane's brain call would no longer keep its share of the review's bound
 *         (`getOneReviewPrimeMeetStopMs`). every wait (gather, trail, poke, holder) is capped
 *         by what that instant leaves, and a lane that reaches the meet with none left takes
 *         no claim at all. so a wedged or crashed primer costs the cache, never the review
 * .note = 🔴 a release is warm only where the poke settled. the claim is released on every
 *         exit, but a solo exit, a lapsed exit, or a faulted poke releases it COLD: the lane's
 *         own review has not reached the provider yet, so a lane that read that release as
 *         warm would pour against a cache no request filled. a LATE lane that finds such a
 *         release trails it instead: the holder's own review departed at the release and
 *         carries the head, so the late lane waits out the rest of `msOfReach`, then pours
 *         warm — never a second solo claim on the same head
 * .note = `options.prime` is the poke — a caller-chosen step, so it rides `options`, never
 *         `context` (rule.forbid.inject-same-repo-domain-ops: this operation reaches no external
 *         boundary of its own). `stepReview` passes `setOneReviewLanePrime`; a test passes a fake
 */
export const genReviewPrefixPrime = async (
  input: {
    cwd: string;
    key: string;
    /** the epoch-ms instant past which the meet must not wait, so the brain call keeps its share */
    deadline: { msOfStop: number };
  },
  options: {
    prime: () => Promise<unknown>;
    msOfGather?: number;
    msOfAwait?: number;
    msOfStale?: number;
    msOfPoll?: number;
    msOfReach?: number;
  },
): Promise<{ outcome: ReviewPrefixPrimeOutcome }> => {
  const ms = {
    gather: options.msOfGather ?? MS_OF_GATHER_DEFAULT,
    await: options.msOfAwait ?? MS_OF_AWAIT_DEFAULT,
    stale: options.msOfStale ?? MS_OF_STALE_DEFAULT,
    poll: options.msOfPoll ?? MS_OF_POLL_DEFAULT,
    reach: options.msOfReach ?? MS_OF_REACH_DEFAULT,
  };
  const meet = {
    cwd: input.cwd,
    key: asReviewWatermarkKey({ kind: 'prime', of: [input.key] }),
  };
  const nonce = `pid${process.pid}.${getUuid()}`;

  // the deadline left the meet no time: pour cold at once, with no claim a peer would wait on
  if (getOneMsLeftOfMeet(input.deadline) <= 0) return { outcome: 'lapsed' };

  // decide this lane's part in the meet, under a short hold; a store fault pours cold
  const part = await genPartOfMeet({ meet, nonce, ms }).catch(
    asWatermarkFaultOrThrow,
  );
  if ('fault' in part) {
    console.error(asReviewPrimeFaultLine({ kind: 'store', cause: part.fault }));
    return { outcome: 'faulted' };
  }

  // a recent release already warmed this head
  if (part.role === 'warm') return { outcome: 'awaited' };

  // a recent cold release whose holder sent its own review: let that review reach the
  // provider, then pour against the head it wrote — no claim, no gather, no poke
  if (part.role === 'trail') {
    await sleep({
      milliseconds: Math.min(
        part.msOfRemainder,
        getOneMsLeftOfMeet(input.deadline),
      ),
    });
    return { outcome: 'awaited' };
  }

  // a peer holds the claim: await its release, outside any hold
  if (part.role === 'peer')
    return {
      outcome: await getOneReleaseOfHolder({
        meet,
        holder: part.holder,
        ms,
        deadline: input.deadline,
      }),
    };

  // this lane holds the claim: settle it, then release it on every exit, so no peer waits
  // on a primer that has already moved on
  const settled = await getOneOutcomeOfLeader({
    meet,
    nonce,
    ms,
    deadline: input.deadline,
    prime: options.prime,
  }).then(
    (outcome) => ({ ok: true as const, outcome }),
    (error: unknown) => ({ ok: false as const, error }),
  );

  // a solo close already released the claim, in the same hold that read the empty peer list
  // (`getOneGatherOfLeader`). a second release would re-stamp `primedAt` after a late lane
  // may have read the first, and hold this lane's own review back by one more hold
  if (settled.ok && settled.outcome === 'solo') return { outcome: 'solo' };

  // release — warm only where the poke settled, so no peer reads a cache no request filled
  const release = await setReleaseOfClaim({
    meet,
    holder: nonce,
    warm: settled.ok && settled.outcome === 'primed',
    sent: settled.ok,
  }).then(() => null, asWatermarkFaultOrThrow);
  if (release)
    console.error(
      asReviewPrimeFaultLine({ kind: 'release', cause: release.fault }),
    );

  // a defect in the prime surfaces only after the release, so no peer waits on it
  if (!settled.ok) throw settled.error;
  return { outcome: settled.outcome };
};
