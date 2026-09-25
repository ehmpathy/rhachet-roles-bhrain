import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import { getGuardSelfReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { delDriveBlockerState } from './drive/delDriveBlockerState';
import { formatRouteStoneEmit } from './formatRouteStoneEmit';
import type { ContextReviewBrainSupply } from './genReviewBrainSupply';
import { getStrayFlagRefusal } from './getStrayFlagRefusal';
import { computePromisedReviewCount } from './guard/review/self/computePromisedReviewCount';
import { findNextUnpromisedReview } from './guard/review/self/findNextUnpromisedReview';
import { findSelfReviewBySlug } from './guard/review/self/findSelfReviewBySlug';
import { getPromisedSlugsSet } from './guard/review/self/getPromisedSlugsSet';
import { getSelfReviewArticulationPath } from './guard/review/self/getSelfReviewArticulationPath';
import { getSelfReviewChallengeDecision } from './guard/review/self/getSelfReviewChallengeDecision';
import { getSelfReviewIndex } from './guard/review/self/getSelfReviewIndex';
import { getSelfReviewSlugs } from './guard/review/self/getSelfReviewSlugs';
import { getStonePromises } from './guard/review/self/getStonePromises';
import { isInvalidSelfReviewSlug } from './guard/review/self/isInvalidSelfReviewSlug';
import { findOneStoneByPattern } from './stones/asStoneGlob';
import { getAllStones } from './stones/getAllStones';
import { setStoneAsApproved } from './stones/setStoneAsApproved';
import { setStoneAsBlocked } from './stones/setStoneAsBlocked';
import { setStoneAsConcernAbsorbed } from './stones/setStoneAsConcernAbsorbed';
import { setStoneAsFeedbackAbsorbed } from './stones/setStoneAsFeedbackAbsorbed';
import { setStoneAsForced } from './stones/setStoneAsForced';
import { setStoneAsOverruled } from './stones/setStoneAsOverruled';
import { setStoneAsPassed } from './stones/setStoneAsPassed';
import { setStoneAsPromised } from './stones/setStoneAsPromised';
import { setStoneAsRewound } from './stones/setStoneAsRewound';

/**
 * .what = orchestrates set of stone status (passed, approved, promised, or rewound)
 * .why = enables robots and humans to mark milestones complete or rewind for fresh evaluation
 */
export const stepRouteStoneSet = async (
  inputRaw: {
    stone: string;
    route: string;
    as:
      | 'passed'
      | 'approved'
      | 'promised'
      | 'absorbed'
      | 'rewound'
      | 'blocked'
      | 'arrived'
      | 'overruled'
      | 'forced'
      | 'disputed'
      | 'conceded';
    that?: string;
    /**
     * the peer reviewer a stance is taken WITH (only for --as disputed | conceded)
     *
     * .why = a stance names a PARTY, where --as absorbed names what you answer. the
     *        parser dispatches on --as, so the two flags never collide — and the grammar
     *        reads as english at the call site: "disputed WITH architect ABOUT blocker.1".
     * .note = the CHECK is setStoneAsFeedbackAbsorbed's, reused whole; only the flag name is new
     */
    with?: string;
    /**
     * the ONE concern a stance answers (only for --as disputed | conceded)
     *
     * .why = S07 — a stance targets one concern, so a lane's other concerns stay owed
     */
    about?: string;
    /**
     * a path to the fulcrum entry that argues a dispute (only for --as disputed)
     *
     * .why = F018 — the driver AUTHORS the entry; this command resolves the path and
     *        refuses when it does not exist. it never mints.
     */
    why?: string;
    /**
     * the harm severity a CONCESSION carries (only for --as conceded)
     *
     * .why = F028/S14 — a concede grades its harm: `urgent` (security | safety | monetary |
     *        reputation | behavioral) earns increased budget and warns the human; `better`
     *        (code idealism, maintenance) is the maintenance floor and NEVER earns budget.
     * .note = defaults to `better` when a concede omits it (an ungraded concede is a `better`
     *         one). forbidden for --as disputed — a dispute concedes naught, so it grades naught.
     */
    severity?: 'better' | 'urgent';
    /**
     * the path the driver declares they wrote their articulation to (only for --as promised)
     *
     * .why = a check with one operand reports a failure; it takes two to report a DIFFERENCE.
     *        before it, a wrong path surfaced as `the articulation is absent`, which names
     *        only where the guard looked and leaves the driver to guess what it read instead.
     * .note = REQUIRED on --as promised. it is the round's one added friction, and it buys
     *         the emit its second operand.
     */
    into?: string;
    yield?: 'keep' | 'drop';
  },
  context: ContextCliEmit & ContextReviewBrainSupply & { isTTY: boolean },
): Promise<{
  passed?: boolean;
  approved?: boolean;
  promised?: boolean;
  absorbed?: boolean;
  rewound?: boolean;
  blocked?: boolean;
  overruled?: boolean;
  forced?: boolean;
  challenged?: boolean;
  disputed?: boolean;
  conceded?: boolean;
  refs?: { reviews: string[]; judges: string[] };
  emit: { stdout: string; stderr?: string } | null;
}> => {
  // alias translator: 'arrived' maps to 'passed' (creates immutable copy)
  const input =
    inputRaw.as === 'arrived'
      ? { ...inputRaw, as: 'passed' as const }
      : inputRaw;

  // refuse a verb-specific flag passed to a verb that does not own it — loud, never dropped.
  // the ownership table and its reason live in `getStrayFlagRefusal`
  const strayFlag = getStrayFlagRefusal({
    as: input.as,
    flags: {
      with: input.with,
      about: input.about,
      why: input.why,
      severity: input.severity,
      that: input.that,
      into: input.into,
    },
  });
  if (strayFlag)
    throw new BadRequestError(strayFlag.message, {
      stone: input.stone,
      as: input.as,
      flag: strayFlag.flag,
    });

  // a --as that MOVES the stone clears the drive-blocker streak — the "stuck Nx" count
  // that the stophook increments each time the driver stops WITHOUT a passage attempt
  // (stepRouteDrive setDriveBlockerState). a driver who marks a status IS NOT STUCK, so the
  // escalation counter resets — but only once the act actually moved the stone. a FAILED
  // --as passed (guard blocks, returns passed:false) must NOT clear it: that is exactly the
  // driver the escalation exists to catch, and an unconditional clear-before-dispatch reset
  // the streak to zero on every repeated failed attempt, so it could never reach 21 (r007
  // blocker.1, i005; rule.forbid.behavior-hazards). so each branch clears AFTER its own
  // dispatch, gated on the flag that says the stone moved — never before it is known.
  // the --as blocked escalation uses its OWN separate triggered-report, so a deliberate
  // block still clears the general streak unconditionally, as before.

  // dispatch to appropriate operation
  if (input.as === 'approved') {
    const result = await setStoneAsApproved(
      {
        stone: input.stone,
        route: input.route,
      },
      { isTTY: context.isTTY },
    );
    if (result.approved) await delDriveBlockerState({ route: input.route });
    return {
      approved: result.approved,
      emit: result.emit,
    };
  }

  if (input.as === 'rewound') {
    const result = await setStoneAsRewound(
      {
        stone: input.stone,
        route: input.route,
        yield: input.yield,
      },
      context,
    );
    if (result.rewound) await delDriveBlockerState({ route: input.route });
    return {
      rewound: result.rewound,
      emit: result.emit,
    };
  }

  if (input.as === 'passed') {
    const result = await setStoneAsPassed(
      {
        stone: input.stone,
        route: input.route,
      },
      context,
    );

    // clear ONLY on a real pass — a blocked/rejected attempt is the stuck driver the
    // 21-stop escalation exists to catch, and must be left to accumulate
    if (result.passed) await delDriveBlockerState({ route: input.route });
    return {
      passed: result.passed,
      refs: result.refs,
      emit: result.emit,
    };
  }

  if (input.as === 'promised') {
    // validate --that is provided
    if (!input.that) {
      throw new BadRequestError('--that is required for --as promised', {
        stone: input.stone,
      });
    }

    // find the stone
    const stones = await getAllStones({ route: input.route });
    const stoneMatched = findOneStoneByPattern({
      stones,
      pattern: input.stone,
    });
    if (!stoneMatched) {
      throw new BadRequestError('stone not found', { stone: input.stone });
    }

    // validate slug exists in stone's review.selfs
    const selfReviews = stoneMatched.guard
      ? getGuardSelfReviews(stoneMatched.guard)
      : [];
    const validSlugs = getSelfReviewSlugs({ selfReviews });
    if (isInvalidSelfReviewSlug({ slug: input.that, validSlugs })) {
      throw new BadRequestError(
        `invalid review.self slug: "${input.that}". valid options: ${validSlugs.join(', ')}`,
        { stone: input.stone, slug: input.that, validSlugs },
      );
    }

    // --into is REQUIRED, and it is checked BEFORE the decision runs.
    // ⚠️ the decision ADJUDICATES — it increments the attempt count, and that count is half
    //    the haste cue's condition. a usage error that burned one would retire this driver's
    //    confrontation with no read behind it, so it must never reach the decision.
    if (!input.into) {
      // .note = the owed path goes in the MESSAGE, never in the metadata alone. the driver
      //         reads a message; a metadata bag is for the log. an error that withholds a
      //         path it already computed names the symptom and not the fix
      //         (rule.require.errors-name-the-fix)
      const owed = getSelfReviewArticulationPath({
        route: input.route,
        stone: stoneMatched.name,
        slug: input.that,
      });
      // 🟡 .why the shape = its two peers in this same family — the bare `--into` and the
      //    `--into` on a verb that does not own it (`getStrayFlagRefusal`) — each render as
      //    headline, blank, reason, blank, the fix on its own indented line. this one was a
      //    single run-on sentence, so one of three promise refusals read as a wall of text
      //    beside two that break cleanly (`rule.forbid.snapshot-visual-blemishes`, the
      //    consistency check). the words are unchanged; only the breaks are new
      throw new BadRequestError(
        [
          `--into is required on --as promised`,
          ``,
          `name the path you wrote your articulation to, so the guard can show you`,
          `the difference rather than a bare absence.`,
          ``,
          `the guard reads:`,
          `  ${owed}`,
          ``,
          `add:`,
          `  --into ${owed}`,
        ].join('\n'),
        { stone: input.stone, slug: input.that, owed },
      );
    }

    // adjudicate the promise: path, then freshness, then the haste cue
    const reviewSelf = findSelfReviewBySlug({ selfReviews, slug: input.that });
    const reviewIndex = getSelfReviewIndex({ selfReviews, slug: input.that });
    const challengeDecision = await getSelfReviewChallengeDecision({
      stone: stoneMatched.name,
      slug: input.that,
      route: input.route,
      into: input.into,
    });

    // if confronted, return early with the verdict's own message.
    // .note = the haste cue is one of five verdicts, and the LAST. a driver whose real
    //         defect is a path meets the path emit and is never told to slow down
    // .note = this branch is verdict-agnostic BY DESIGN — it tests only `!== 'allowed'`, so a
    //         new verdict (`challenge:unasked` was the fifth) needs no edit here. what it must
    //         carry instead is the wider union on the emit's `action` field
    if (challengeDecision.decision !== 'allowed') {
      return {
        challenged: true,
        emit: {
          stdout: formatRouteStoneEmit({
            operation: 'route.stone.set',
            stone: stoneMatched.name,
            action: challengeDecision.decision,
            slug: input.that,
            route: input.route,
            articulationPath: challengeDecision.articulationPath,
            declaredPath: challengeDecision.declaredPath,
            articulationMtime: challengeDecision.articulationMtime,
            askedAt: challengeDecision.askedAt,
            selfReview: reviewSelf
              ? {
                  reviewSelf,
                  index: reviewIndex,
                  total: selfReviews.length,
                }
              : undefined,
          }),
        },
      };
    }

    // record promise (all promises are hashless — firm checkpoints)
    await setStoneAsPromised({
      stone: stoneMatched,
      slug: input.that,
      route: input.route,
    });

    // get all promises after record (includes the one just made)
    const promisesAfter = await getStonePromises({
      stone: stoneMatched,
      route: input.route,
    });
    const promisedSlugs = getPromisedSlugsSet({ promises: promisesAfter });

    // compute progress: how many promised out of total
    const total = selfReviews.length;
    const promisedCount = computePromisedReviewCount({
      selfReviews,
      promisedSlugs,
    });

    // find next unpromised review (if any)
    const nextReview =
      findNextUnpromisedReview({ selfReviews, promisedSlugs }) ?? undefined;

    // reached only once the promise write above succeeded (a throw earlier never gets
    // here, and the challenged early-return above never reaches this line either)
    await delDriveBlockerState({ route: input.route });
    return {
      promised: true,
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'promised',
          slug: input.that,
          route: input.route,
          progress: { index: promisedCount, total },
          nextReview,
        }),
      },
    };
  }

  if (input.as === 'absorbed') {
    // validate --that is provided (which reviewer's critique this absorbs)
    if (!input.that)
      throw new BadRequestError('--that is required for --as absorbed', {
        stone: input.stone,
      });

    const result = await setStoneAsFeedbackAbsorbed({
      stone: input.stone,
      route: input.route,
      slug: input.that,
    });
    if (result.absorbed) await delDriveBlockerState({ route: input.route });
    return {
      absorbed: result.absorbed,
      emit: result.emit,
    };
  }

  if (input.as === 'disputed' || input.as === 'conceded') {
    // --with and --about are both required: a stance names a PARTY and a SUBJECT.
    // .why = a stance keyed to a party alone sheds every concern that party raised
    //        (rule.forbid.suppression-of-undeclared-concerns)
    if (!input.with)
      throw new BadRequestError(`--with is required for --as ${input.as}`, {
        stone: input.stone,
      });
    if (!input.about)
      throw new BadRequestError(
        [
          `--about is required for --as ${input.as}`,
          ``,
          `a stance answers ONE concern, so it must name which:`,
          `  --about blocker.1   --about nitpick.4`,
        ].join('\n'),
        { stone: input.stone },
      );

    const result = await setStoneAsConcernAbsorbed({
      stone: input.stone,
      route: input.route,
      as: input.as,
      with: input.with,
      about: input.about,
      why: input.why,
      severity: input.severity,
    });
    // setStoneAsConcernAbsorbed either throws (a refused declaration) or fully succeeds — its
    // success path never returns disputed:false / conceded:false — so a declaration that
    // reaches this line always recorded a stance
    await delDriveBlockerState({ route: input.route });
    return {
      disputed: result.disputed,
      conceded: result.conceded,
      emit: result.emit,
    };
  }

  if (input.as === 'blocked') {
    const result = await setStoneAsBlocked({
      stone: input.stone,
      route: input.route,
    });
    // --as blocked has its OWN separate triggered-report, so a deliberate block still
    // clears the general stuck streak unconditionally — it never defeats that escalation
    await delDriveBlockerState({ route: input.route });
    return {
      blocked: result.blocked,
      challenged: result.challenged,
      emit: result.emit,
    };
  }

  if (input.as === 'overruled') {
    const result = await setStoneAsOverruled(
      {
        stone: input.stone,
        route: input.route,
      },
      { isTTY: context.isTTY },
    );
    if (result.overruled) await delDriveBlockerState({ route: input.route });
    return {
      overruled: result.overruled,
      emit: result.emit,
    };
  }

  if (input.as === 'forced') {
    const result = await setStoneAsForced(
      {
        stone: input.stone,
        route: input.route,
      },
      { isTTY: context.isTTY },
    );
    if (result.forced) await delDriveBlockerState({ route: input.route });
    return {
      forced: result.forced,
      emit: result.emit,
    };
  }

  throw new UnexpectedCodePathError('unsupported --as value', { as: input.as });
};
