import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import { assertValidPeerReviewSlug } from '../guard/review/peer/assertValidPeerReviewSlug';
import {
  getRouteGuardReviewPeerFeedbackAbsorptionStatus,
  type RouteGuardReviewPeerFeedbackUnabsorbed,
} from '../guard/review/peer/getRouteGuardReviewPeerFeedbackAbsorptionStatus';
import { getStoneUndeclaredConcerns } from '../guard/review/peer/getStoneUndeclaredConcerns';
import { formatRouteGuardReviewPeerFeedbackAbsorbPrompt } from '../guard/tree/formatRouteGuardReviewPeerFeedbackAbsorbPrompt';
import { setPassageReport } from '../passage/setPassageReport';
import { findOneStoneByPattern } from './asStoneGlob';
import { getAllStones } from './getAllStones';

/**
 * .what = the single feedbackUnabsorbed reviewer in a single-slug-scoped status
 * .why = --as absorbed --that <slug> scopes readiness to one reviewer, so a
 *        not-ready status holds exactly one entry — a named accessor keeps the
 *        orchestrator narrative (no bare positional index)
 */
const getOneScopedFeedbackUnabsorbed = (input: {
  feedbackUnabsorbed: RouteGuardReviewPeerFeedbackUnabsorbed[];
}): RouteGuardReviewPeerFeedbackUnabsorbed => {
  const one = input.feedbackUnabsorbed[0];

  // the caller reaches here only on the `!ready` branch of a single-slug-scoped status,
  // which is defined to hold exactly one entry — so an empty array is the scope
  // invariant broken, not a legal empty state. fail loud with the full array rather
  // than crash on `undefined.slug` with no context (r002 nitpick.2, i005;
  // rule.forbid.maintenance-hazards)
  if (!one)
    throw new UnexpectedCodePathError(
      'a scoped not-ready status holds zero feedbackUnabsorbed entries',
      { feedbackUnabsorbed: input.feedbackUnabsorbed },
    );

  return one;
};

/**
 * .what = acknowledges one reviewer's feedbackAbsorption, or guides the driver to it
 * .why = --as absorbed --that <slug> is the per-reviewer confirmation loop:
 *        it validates the named reviewer's .taken is present (the .taken IS the
 *        record), and emits crystal-clear guidance when it is absent or stale
 */
export const setStoneAsFeedbackAbsorbed = async (input: {
  stone: string;
  route: string;
  slug: string;
}): Promise<{
  absorbed: boolean;
  emit: { stdout: string; stderr?: string } | null;
}> => {
  // find the stone
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findOneStoneByPattern({
    stones,
    pattern: input.stone,
  });
  if (!stoneMatched)
    throw new BadRequestError('stone not found', { stone: input.stone });

  // the shared readiness computation, scoped to this one reviewer (B2). it also reports
  // every slug that has SPOKEN on this stone, which the validity check below reads
  const status = await getRouteGuardReviewPeerFeedbackAbsorptionStatus({
    route: input.route,
    stone: stoneMatched,
    scope: { slug: input.slug },
  });

  // validate --that names a real peer reviewer (compare sanitized slugs)
  //
  // .note = this runs AFTER the status rather than before, so the spoken half comes from
  //         the read the status already did — one full corpus read per invocation rather
  //         than two (r11 nitpick.1, i005). the throw still precedes every USE of the
  //         status, so an invalid slug is rejected exactly as before; the only difference
  //         is one wasted read on the typo path, which is the rare one
  //
  // 🔴 the check itself lives in assertValidPeerReviewSlug, shared with `--as disputed`
  //    and `--as conceded`. it was inline here until three commands needed the identical
  //    set — see that operation for why the valid set is `configured ∪ spoken`
  assertValidPeerReviewSlug({
    slug: input.slug,
    stone: stoneMatched,
    slugsSpoken: status.slugsSpoken,
  });

  // ready = the .taken is present, or the reviewer raised no blockers (clean /
  // nitpick-only). the ack must tell the truth about WHICH: the status reports
  // its own readyReason (sourced from the givens it already read), so do not
  // claim a response was recorded when the reviewer simply had no concern
  if (status.ready) {
    // 🔴 the COMPOSITION gate (define.invariant.review.peer.absorb): absorb the feedback is
    //    REFUSED until every concern within it is absorbed. the `.taken` engages the reviewer
    //    as a WHOLE, and a whole response can be authored while a concern within it stands
    //    un-absorbed — so a per-concern disposition (dispute|concede) is a precondition on the
    //    feedback act. `feedbackAbsorbed(given) ⟺ ∀ concern : absorbed(concern)`, the ⟸ half.
    //
    // .note = it fires INSIDE the ready branch, AFTER the answer-first (.taken) check, because
    //         a concern is absorbed via `--as disputed|conceded`, which R1 refuses until the
    //         `.taken` exists (assertAbsorptionIsAnswered). so the driver cannot absorb a
    //         concern before the answer, and the pit-of-success order is .taken → absorb each
    //         concern → absorb the feedback. the absent-.taken guidance stays first, so the
    //         order reads clear rather than a step the driver cannot yet take.
    //
    // .note = getStoneUndeclaredConcerns already excludes the lanes that OWE naught — approved,
    //         unreadable, human-forgiven, and clean (0-concern) lanes all yield no undeclared
    //         concerns — so the gate fires only on a rejected lane that still owes a stance.
    const undeclared = await getStoneUndeclaredConcerns({
      stone: stoneMatched,
      route: input.route,
    });
    const owedHere = undeclared.find((one) => one.slug === input.slug);
    if (owedHere)
      throw new BadRequestError(
        [
          `absorb each concern before you absorb ${input.slug}'s feedback`,
          ``,
          `${owedHere.concerns.length} concern${
            owedHere.concerns.length === 1 ? '' : 's'
          } of ${input.slug} stand un-absorbed:`,
          ...owedHere.concerns.map((label) => `  - ${label}`),
          ``,
          `absorb each, THEN absorb the feedback:`,
          // each taught command carries its REQUIRED flag, so a driver who copies one is not
          // refused at the boundary (r9 b1). concede leads — it is the default (S11)
          `  1. per concern — concede it (the default), or dispute it:`,
          `     rhx route.stone.set --stone ${stoneMatched.name} \\`,
          `       --as conceded --with ${input.slug} --about <concern> --severity better|urgent`,
          `     rhx route.stone.set --stone ${stoneMatched.name} \\`,
          `       --as disputed --with ${input.slug} --about <concern> --why <fulcrum-path>`,
          `  2. then absorb the feedback:`,
          `     rhx route.stone.set --stone ${stoneMatched.name} --as absorbed --that ${input.slug}`,
        ].join('\n'),
        {
          stone: stoneMatched.name,
          slug: input.slug,
          undeclared: owedHere.concerns,
        },
      );

    // record the forward motion in passage.jsonl so a prior blocker clears
    // .why = rule.require.forward-motion-clears-blocker — the latest entry wins, so
    //        this 'absorbed' status supersedes a stale escalation halt; its
    //        disposition is push (the machine's own peer-review reply), so the route
    //        keeps its own momentum
    await setPassageReport({
      report: new PassageReport({
        stone: stoneMatched.name,
        status: 'absorbed',
        reason: `absorbed review.peer: ${input.slug}`,
      }),
      route: input.route,
    });

    const tail =
      status.readyReason === 'responded'
        ? `   └─ your response is recorded — the reviewer will see it next round`
        : `   └─ this reviewer raised no blockers — no concern to absorb, no response needed`;
    return {
      absorbed: true,
      emit: {
        stdout: [`🦉 absorbed: ${input.slug}`, tail].join('\n'),
      },
    };
  }

  // not ready — in single-slug scope exactly one reviewer is feedbackUnabsorbed (the
  // scoped one); render its absent-or-stale guidance
  const reviewer = getOneScopedFeedbackUnabsorbed({
    feedbackUnabsorbed: status.feedbackUnabsorbed,
  });

  // .note = read HERE rather than at the top, so the ready path — the common one —
  //         pays no git subprocess. only a halt prints a path, so only a halt needs
  //         the root to print it against
  const root = await getRepoRootWithFallback({ from: input.route });

  return {
    absorbed: false,
    emit: {
      stdout: formatRouteGuardReviewPeerFeedbackAbsorbPrompt({
        case: reviewer.tag,
        stone: stoneMatched.name,
        root,
        reviewer,
      }),
    },
  };
};
