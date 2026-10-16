import type { BrainChoice, ContextBrain } from 'rhachet';

import { asErrorHeadline } from '@src/domain.operations/review/asErrorHeadline';
import { isErrorOfPokeFault } from '@src/domain.operations/review/poke/isErrorOfPokeFault';
import { setOneWarmerPoke } from '@src/domain.operations/review/poke/setOneWarmerPoke';
import { asWatermarkFaultOrThrow } from '@src/domain.operations/review/watermark/asWatermarkFaultOrThrow';
import { asCountedNoun } from '@src/utils/asCountedNoun';

import type { ReviewWarmerPlan } from './asReviewWarmerPlan';
import { asWarmerPokePrompt } from './asWarmerPokePrompt';
import { getOneMinutesElapsed } from './getOneMinutesElapsed';
import { getOneReviewerLastRunAt } from './getOneReviewerLastRunAt';
import { getOneWarmerRunArtifacts } from './getOneWarmerRunArtifacts';
import { getOneWarmerWakeVerdict } from './getOneWarmerWakeVerdict';
import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';
import { setOneWarmerPokeRow } from './setOneWarmerPokeRow';
import { setOneWarmerRetireBeforeBegin } from './setOneWarmerRetireBeforeBegin';
import { setReviewWarmerPokeClaim } from './setReviewWarmerPokeClaim';
import { setReviewWarmerWake } from './setReviewWarmerWake';
import type { WarmerClock } from './WarmerClock';
import type { WarmerPokeRowQuiet, WarmerPokeRowSpent } from './WarmerPokeRow';

/**
 * .what = the share of a poke's prompt above which it counts as a HIT
 * .why = a partial serve is real — the prefix census measured 27.8% — so the
 *        grade needs a declared line rather than `> 0`. half is unambiguous.
 */
const SHARE_OF_POKE_HIT = 0.5;

/**
 * .what = whether the provider served this poke from cache
 * .why = the ratio needs a guard on its denominator, and the share line is declared once
 *        above; a named predicate states both, so the loop reads the verdict
 */
const isPokeHit = (input: {
  measured: { promptTokens: number; cacheGetTokens: number };
}): boolean => {
  if (input.measured.promptTokens <= 0) return false;
  return (
    input.measured.cacheGetTokens / input.measured.promptTokens >
    SHARE_OF_POKE_HIT
  );
};

/**
 * .what = runs one reviewer's warmer to completion — wake, decide, poke, repeat
 * .why = the warmer exists because the review cache's defect is the CLOCK, not
 *        the prompt layout. the reach decays monotone in elapsed time and is noise
 *        in prefix size (`CENSUS_OF_CACHE_REACH`).
 *        a two-arm probe then settled the policy as LRU: a read refreshes
 *        residency, so a poke on a cadence keeps a prefix alive.
 *
 * .note = it EXITS when its poke budget is spent — it never polls for a round
 *         that may never come. a driver who abandons a route bounds their own
 *         exposure at a figure declared before the warmer started: `pokes` after
 *         the last real review, since a review refills the budget.
 *
 * .note = the loop counts ATTEMPTS, never wakes. a deferral spent no money and
 *         protected no bytes, so it does not advance the counter — to count one
 *         would retire a warmer that never poked at all.
 *
 * .note = it holds no lock across its life. at each wake it reads its prefix's
 *         watermark: a lane that now sends another prefix ends it, and a peer
 *         warmer's poke within the cadence defers it. the poke is claimed under a
 *         short hold, then sent outside it (rule.require.locks-via-with-simple-mutex)
 */
export const setReviewWarmerPokes = async (
  input: {
    cwd: string;
    reviewer: string;
    plan: ReviewWarmerPlan;
    /** the run whose prompt artifacts this warmer replays, and whose dir its rows land beside */
    logDir: string;
    /** the prefix this warmer keeps warm — what its watermark is keyed on */
    prefix: ReviewWarmerPrefix;
    /** this warmer's own pid — it pokes only while its prefix's record still names it */
    pid: number;
  },
  /**
   * .note = only the two EXTERNAL boundaries ride here — the provider and the clock.
   *         the poke itself is this repo's own leaf, composed by import
   *         (rule.forbid.inject-same-repo-domain-ops)
   */
  context: {
    brain: ContextBrain<BrainChoice>;
    clock: WarmerClock;
  },
): Promise<void> => {
  /**
   * .what = binds this warmer's identity onto one row, so a branch states only what varies
   *
   * .why = every branch writes a row — the artifact refusal, a watermark fault, a
   *        superseded prefix, a `retire` verdict, a `defer`, a claim a peer took, a
   *        `fault`, a `poke`, and the budget-spent terminator. without this, each
   *        would re-declare the same four-field envelope (`cwd`, `reviewer`,
   *        `logDir`, and `reviewer` again inside the row), and a reader would
   *        diff near-identical literals to find the one field that
   *        differs — decode-friction `rule.prefer.decomposable-architecture`
   *        names in an orchestrator.
   *
   * .note = `reviewer` appears at BOTH levels on purpose, and this is the one
   *         place it cannot be got wrong. the outer one routes the write to a
   *         lane's own sink; the inner one is the row's own content, read back
   *         by `getOneWarmerCost` from a ledger whose rows must name their lane
   *         (`0.wish` bar 9). each copy would be one more chance for the two to disagree.
   */
  //         each member is omitted on its own, since `Omit` over the union would fuse
  //         `act` and `measured` and admit a `poke` with no measurement
  const setRow = (
    row:
      | Omit<WarmerPokeRowSpent, 'reviewer'>
      | Omit<WarmerPokeRowQuiet, 'reviewer'>,
  ): void =>
    setOneWarmerPokeRow({
      cwd: input.cwd,
      reviewer: input.reviewer,
      logDir: input.logDir,
      row: { ...row, reviewer: input.reviewer },
    });

  // the prompt a poke replays comes from the run's OWN artifacts, never a
  // re-compile: a re-compile reads a tree that has since moved, and would warm
  // a prefix the next round cannot share
  const { head, prompt } = getOneWarmerRunArtifacts({
    logDir: input.logDir,
    reviewer: input.reviewer,
  });
  const poke = asWarmerPokePrompt({ head, prompt });
  if (!poke) {
    setOneWarmerRetireBeforeBegin(
      {
        cwd: input.cwd,
        reviewer: input.reviewer,
        logDir: input.logDir,
        why: 'the run artifacts disagree — its head does not prefix its prompt',
      },
      context,
    );
    return;
  }

  // .note = deliberate mutation, per `rule.require.immutable-vars`. these three are
  //         the warmer's LOOP STATE — the budget it has spent, the last instant the
  //         prefix was touched, and how long until the next wake. each holds "where
  //         in the schedule am i", which by nature changes as the schedule is
  //         walked, and a warmer's whole subject is a cadence over time.
  //
  //         the scope is one function and not one of them escapes it: every read is
  //         inside the `while` below, and every write is a step of the same loop.
  //         a recursive or reduce-shaped recast would carry all three through an
  //         accumulator and make the defer rule — which advances `lastTouchAt` and
  //         `waitOfNextWake` while it holds `attemptsSpent` still — far harder to
  //         read than it is here.
  let attemptsSpent = 0;
  let lastTouchAt = context.clock.now();

  /**
   * how long until the NEXT wake, and it is not always the cadence. a deferral
   * re-aims the wake at `lastTouch + everyMinutes`, so the wait it names is the
   * REMAINDER of the cadence, never a fresh one.
   *
   * a `sleep(everyMinutes)` at the head of the loop plus a `sleep(waitMinutes)`
   * inside the defer branch would make a deferred wake wait
   * `waitMinutes + everyMinutes` — up to twice the cadence. the harm is silent
   * and lands exactly where the warmer is most needed: a driver who re-drives
   * the guard pushes every subsequent poke a full cadence later, so the gap can
   * cross the ttl and the prefix ages out between two pokes that both looked on
   * schedule.
   */
  let waitOfNextWake = input.plan.everyMinutes;

  while (attemptsSpent < input.plan.pokes) {
    await context.clock.sleep(waitOfNextWake);

    // read the watermark: is this prefix still the lane's, and when did any warmer
    // of it last poke? a store fault ends this warmer with a row, never a crash
    const wake = await setReviewWarmerWake({
      cwd: input.cwd,
      reviewer: input.reviewer,
      prefix: input.prefix,
      plan: input.plan,
      pid: input.pid,
      now: context.clock.now(),
    }).catch(asWatermarkFaultOrThrow);
    if ('fault' in wake) {
      setRow({
        at: context.clock.now().toISOString(),
        attempt: attemptsSpent,
        act: 'retire',
        why: `the warmer watermark could not be read or written — ${wake.fault}`,
        measured: null,
      });
      return;
    }

    // a newer round of this lane sends another prefix: no later round reads this
    // one, so every further poke would warm a cache nobody reads
    if (wake.superseded) {
      setRow({
        at: context.clock.now().toISOString(),
        attempt: attemptsSpent,
        act: 'retire',
        why: 'the lane now sends another prompt head or brain — this prefix is no longer current',
        measured: null,
      });
      return;
    }

    // a duplicate booted beside this warmer and took the record's pid: the `kill` a
    // round prints now names that one, so this warmer exits rather than spend where
    // no printed command can stop it
    if (wake.displaced) {
      setRow({
        at: context.clock.now().toISOString(),
        attempt: attemptsSpent,
        act: 'retire',
        why: 'the record names another warmer of this prefix — only the warmer a printed kill reaches still pokes',
        measured: null,
      });
      return;
    }

    // a real review is a TOUCH. if one ran since the last poke, it already
    // warmed this replica, so a poke now buys naught and bills in full.
    // a fault of that read (a denied log root, an unreadable args file) ends this
    // warmer: it cannot tell a touch from none, so a poke would spend on a fact it
    // never established. the row is its voice — this process is detached, with no
    // terminal — and the fault then stands as itself (rule.forbid.failhide); the
    // caller stamps the record ended, so no round reads a dead warmer as awake
    const lastRunAt = await getOneReviewerLastRunAt({
      cwd: input.cwd,
      reviewer: input.reviewer,
      since: lastTouchAt,
    }).catch((error: unknown) => {
      setRow({
        at: context.clock.now().toISOString(),
        attempt: attemptsSpent,
        act: 'retire',
        why: `the review log root could not be read — ${asErrorHeadline({ error })}`,
        measured: null,
      });
      throw error;
    });
    // and a review REFILLS the budget: the plan counts attempts from the last
    // nominal review (`0.wish` "the schedule is relative to the LAST TOUCH"), so
    // a driver who walks away after round N gets the full `pokes x everyMinutes`
    // the spawn line printed, never the remainder an earlier gap left over. the
    // spend stays bounded — `pokes` per review gap, and each gap opens only on
    // a real review the driver ran
    if (lastRunAt) {
      lastTouchAt = lastRunAt;
      attemptsSpent = 0;
    }

    // a peer warmer's poke of this prefix is a touch too
    if (wake.pokedAt && wake.pokedAt > lastTouchAt) lastTouchAt = wake.pokedAt;

    const verdict = getOneWarmerWakeVerdict({
      sinceTouchMinutes: getOneMinutesElapsed({
        since: lastTouchAt,
        until: context.clock.now(),
      }),
      attemptsSpent,
      plan: input.plan,
    });

    if (verdict.act === 'retire') {
      setRow({
        at: context.clock.now().toISOString(),
        attempt: attemptsSpent,
        act: 'retire',
        why: verdict.why,
        measured: null,
      });
      return;
    }

    if (verdict.act === 'defer') {
      setRow({
        at: context.clock.now().toISOString(),
        attempt: attemptsSpent,
        act: 'defer',
        why: verdict.why,
        measured: null,
      });
      waitOfNextWake = verdict.waitMinutes;
      continue;
    }

    // claim this poke on the prefix's watermark, so a peer warmer that woke beside
    // this one cannot poke the same cache in the same window. the claim is the
    // check-then-write under a short hold; the poke runs after, outside it
    const claim = await setReviewWarmerPokeClaim({
      cwd: input.cwd,
      reviewer: input.reviewer,
      prefix: input.prefix,
      plan: input.plan,
      now: context.clock.now(),
    }).catch(asWatermarkFaultOrThrow);
    if ('fault' in claim) {
      setRow({
        at: context.clock.now().toISOString(),
        attempt: attemptsSpent,
        act: 'retire',
        why: `the warmer watermark could not be read or written — ${claim.fault}`,
        measured: null,
      });
      return;
    }
    if (claim.act === 'denied') {
      lastTouchAt = claim.pokedAt;
      waitOfNextWake = Math.max(
        input.plan.everyMinutes -
          getOneMinutesElapsed({
            since: claim.pokedAt,
            until: context.clock.now(),
          }),
        0,
      );
      setRow({
        at: context.clock.now().toISOString(),
        attempt: attemptsSpent,
        act: 'defer',
        why: `a peer warmer poked this prefix at ${claim.pokedAt.toISOString()}, within the cadence`,
        measured: null,
      });
      continue;
    }

    // the per-poke isolation. a poke reaches a live provider over a network, so
    // it can time out, 5xx, or be refused — and this warmer is DETACHED with
    // `stdio: 'ignore'`, so a rejection that escaped here would kill the process
    // with no terminal to print to and no row to read afterward. the pokes the
    // budget still owed would silently never be sent, which is the whole product
    // (rule.forbid.failhide: a fault must surface, and here the row IS the surface).
    //
    // .note = an INLINE IIFE rather than a named leaf — a deliberate exception,
    // not an oversight (`rule.prefer.decomposable-architecture`).
    //
    //    the fault arm mutates THREE pieces of this loop's state —
    //    `attemptsSpent`, `lastTouchAt`, `waitOfNextWake` — each for a reason
    //    argued in the catch below. an extracted leaf has two shapes and both
    //    are worse:
    //      · take the loop's state and write it back — a leaf that mutates its
    //        caller's variables is a hidden side effect at a seam that reads pure
    //        (rule.forbid.hidden-side-effects), and harder to follow than a
    //        mutation the loop can see beside it
    //      · return a verdict the loop applies — moves the fault path's control
    //        flow out of the loop that owns `continue`, so the one arm that must
    //        never wedge the plan becomes the one arm split across two files
    //
    //    ⇒ bounded to ONE arm of ONE loop; a second inline closure here would be
    //    a defect rather than a peer.
    const measured = await (async () => {
      try {
        return await setOneWarmerPoke(
          {
            cwd: input.cwd,
            reviewer: input.reviewer,
            head: poke.head,
            tail: poke.tail,
            msOfTimeout: null,
          },
          { brain: context.brain },
        );
      } catch (error) {
        // the allowlist: a provider fault is recorded and survived; a defect in
        // the poke's own code RETHROWS as itself, so it is never filed in the
        // ledger under the provider's name (rule.forbid.failhide)
        if (!isErrorOfPokeFault({ error })) throw error;

        // the attempt is SPENT, even though it measured naught. a timeout
        // abandons the wait and cannot cancel the provider's work, so the call
        // may well have billed — and a fault that did not advance the counter
        // would let a wedged provider loop the warmer without bound, which is
        // exactly what `0.wish` bar 11 forbids.
        //
        // `lastTouchAt` advances too, and that is a DELIBERATE overstatement with
        // a named cost: a faulted poke may have warmed the replica (the provider's
        // work ran; only our wait was abandoned) or may have warmed naught, and no
        // measurement can part the two. so the clock treats it as a touch, which
        // pushes the next wake a full cadence out from HERE rather than from the
        // last PROVEN touch.
        //
        //    ⇒ the cost is bounded and the alternative is not. to hold the clock
        //    still would re-aim the next wake at a gap already elapsed, so the warmer
        //    would fire again at once and spend the rest of its budget in a burst
        //    against the very provider that just failed. one stretched cadence loses
        //    at most one interval of coverage; a burst loses the whole plan.
        attemptsSpent += 1;
        lastTouchAt = context.clock.now();
        waitOfNextWake = input.plan.everyMinutes;

        setRow({
          at: lastTouchAt.toISOString(),
          attempt: attemptsSpent,
          act: 'fault',
          why: String(error),
          // nil, never a zero-token poke — an unmeasured spend graded as a
          // free success is the failhide the meter exists to refuse
          measured: null,
        });
        return null;
      }
    })();
    if (measured === null) continue;

    attemptsSpent += 1;
    lastTouchAt = context.clock.now();
    waitOfNextWake = input.plan.everyMinutes;

    setRow({
      at: lastTouchAt.toISOString(),
      attempt: attemptsSpent,
      act: 'poke',
      why: verdict.why,
      measured: {
        promptTokens: measured.promptTokens,
        cacheGetTokens: measured.cacheGetTokens,
        hit: isPokeHit({ measured }),
        cost: measured.cost,
      },
    });
  }

  // the TERMINATOR — the budget-spent exit is the NORMAL exit, the one every
  // healthy warmer takes. the other two (`!poke`, and a `retire` verdict) each
  // write a row and return; this one falls out of the `while`.
  //
  //    ⇒ a record with no terminator cannot be told from one that STOPPED.
  //    `0.wish` bar 9b promises a driver can `cat` this log mid-flight and read
  //    what each poke cost, and a detached process has no terminal, so these
  //    rows are its only voice. `poke, poke, poke` with no row after it reads
  //    the same whether the warmer retired on schedule or was killed between wakes.
  //
  //    sharpest where the last attempt FAULTED: `poke, poke, fault` is the log
  //    of a warmer that spent its budget AND of one that died on a wedged
  //    provider with pokes still owed. those are different facts about money,
  //    and the record could not part them without a terminator
  //    (rule.forbid.failhide — the row IS the surface here).
  //
  // it grades `naught` in `getOneWarmerCost`, alongside `defer` and the other
  // retires — a fact added to the record, not a cent to any sum.
  setRow({
    at: context.clock.now().toISOString(),
    attempt: attemptsSpent,
    act: 'retire',
    why: `the plan is spent — ${attemptsSpent} of ${asCountedNoun({ count: input.plan.pokes, one: 'attempt', many: 'attempts' })}`,
    measured: null,
  });
};
