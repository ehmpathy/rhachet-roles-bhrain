import { ConstraintError, UnexpectedCodePathError } from 'helpful-errors';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asGuardDisplayPath } from '../guard/asGuardDisplayPath';
import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import { asRouteStoneAbsorbCommand } from '../guard/review/peer/asRouteStoneAbsorbCommand';
import { asRouteStoneStanceCommand } from '../guard/review/peer/asRouteStoneStanceCommand';
import { assertValidPeerReviewSlug } from '../guard/review/peer/assertValidPeerReviewSlug';
import { getAllStoneUndeclaredConcerns } from '../guard/review/peer/getAllStoneUndeclaredConcerns';
import {
  getOneRouteGuardReviewPeerFeedbackAbsorptionStatus,
  type RouteGuardReviewPeerFeedbackUnabsorbed,
} from '../guard/review/peer/getOneRouteGuardReviewPeerFeedbackAbsorptionStatus';
import { formatRouteGuardReviewPeerFeedbackAbsorbPrompt } from '../guard/tree/formatRouteGuardReviewPeerFeedbackAbsorbPrompt';
import { setPassageReport } from '../passage/setPassageReport';
import { findOneStoneByPattern } from './asStoneGlob';
import { asStoneNotFoundError } from './asStoneNotFoundError';
import { getAllStones } from './getAllStones';

/**
 * .what = the tail lines of an absorb ack, per ready state
 * .why = the gate holds on blockers alone, so a nitpick-only lane is ready with or without an
 *        answer — yet its reviewer re-raises each nitpick that no .taken answers. the ack once
 *        said "no response needed" there, which affirmed the exit
 *        `rule.always.converge-with-reviewers.via-a-taken-per-point` forbids. so each state
 *        renders its own truth, and the unanswered one names the path the answer belongs at
 */
const asFeedbackAbsorbedTailLines = (input: {
  reason: 'responded' | 'no-concerns' | 'nitpicks-unanswered';
  pathTaken: string | null;
}): string[] => {
  // an answer sits at the path the latest given derives
  if (input.reason === 'responded')
    return [
      `   └─ your response is recorded — the reviewer will see it next round`,
    ];

  // the reviewer raised naught, so naught is owed
  if (input.reason === 'no-concerns')
    return [`   └─ this reviewer raised no concerns — no response needed`];

  // no gate holds, but the reviewer weighs points and re-raises each unanswered nitpick
  return [
    `   └─ no blockers, so no gate holds — but its nitpicks carry no .taken`,
    `      ├─ the reviewer re-raises each unanswered nitpick next round`,
    `      └─ answer them at ${input.pathTaken ?? 'the .taken path its given derives'}`,
  ];
};

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
    throw asStoneNotFoundError({
      act: 'absorbed',
      route: input.route,
      pattern: input.stone,
      stones,
    });

  // the shared readiness computation, scoped to this one reviewer (B2). it also reports
  // every slug that has SPOKEN on this stone, which the validity check below reads
  const status = await getOneRouteGuardReviewPeerFeedbackAbsorptionStatus({
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
    //         `.taken` exists (asAbsorptionIsAnswered). so the driver cannot absorb a
    //         concern before the answer, and the pit-of-success order is .taken → absorb each
    //         concern → absorb the feedback. the absent-.taken guidance stays first, so the
    //         order reads clear rather than a step the driver cannot yet take.
    //
    // .note = getAllStoneUndeclaredConcerns already excludes the lanes that OWE naught — approved,
    //         unreadable, human-forgiven, and clean (0-concern) lanes all yield no undeclared
    //         concerns — so the gate fires only on a rejected lane that still owes a stance.
    const undeclared = await getAllStoneUndeclaredConcerns({
      stone: stoneMatched,
      route: input.route,
    });
    const owedHere = undeclared.find((one) => one.slug === input.slug);

    // the taught stance commands, from the composer that owns their flag grammar
    const concede = asRouteStoneStanceCommand({
      stone: stoneMatched.name,
      as: 'conceded',
      with: input.slug,
      about: '<concern>',
    });
    const dispute = asRouteStoneStanceCommand({
      stone: stoneMatched.name,
      as: 'disputed',
      with: input.slug,
      about: '<concern>',
      why: '<fulcrum-path>',
    });
    if (owedHere)
      throw new ConstraintError(
        [
          `absorb each concern before you absorb ${input.slug}'s feedback`,
          ``,
          `${asCountedNoun({ count: owedHere.concerns.length, one: 'concern', many: 'concerns' })} of ${input.slug} ${
            owedHere.concerns.length === 1 ? 'stands' : 'stand'
          } un-absorbed:`,
          ...owedHere.concerns.map((label) => `  - ${label}`),
          ``,
          `absorb each, THEN absorb the feedback:`,
          // each taught command carries its REQUIRED flag, so a driver who copies one is not
          // refused at the boundary (r9 b1). concede leads — it is the default (S11)
          `  1. per concern — concede it (the default), or dispute it:`,
          `     ${concede.head} \\`,
          `       ${concede.flags}`,
          `     ${dispute.head} \\`,
          `       ${dispute.flags}`,
          `  2. then absorb the feedback:`,
          `     ${asRouteStoneAbsorbCommand({ stone: stoneMatched.name, that: input.slug }).command}`,
        ].join('\n'),
      );

    // record the forward motion in passage.jsonl so a prior blocker clears
    // .why = rule.require.forward-motion-clears-blocker — the latest entry wins, so
    //        this 'absorbed' status supersedes a stale escalation halt; its
    //        disposition is push (the machine's own peer-review reply), so the route
    //        keeps its own momentum
    // .note = a status read, then an append, with no lock — deliberately, the same bound
    //         `setRouteGuardPartitions` states for its own read-modify-write. one driver
    //         absorbs a reviewer by hand, so two concurrent absorbs of one slug are out of
    //         scope; and were it to happen, two identical `absorbed` rows read the same as
    //         one, since passage is latest-entry-wins
    await setPassageReport({
      report: new PassageReport({
        stone: stoneMatched.name,
        status: 'absorbed',
        reason: `absorbed review.peer: ${input.slug}`,
      }),
      route: input.route,
    });

    // tell the truth about which of the three ready states holds — and where the answer goes
    // .note = the root is read only for the one case that prints a path
    const tail = asFeedbackAbsorbedTailLines({
      reason: status.readyReason ?? 'no-concerns',
      pathTaken:
        status.readyReason === 'nitpicks-unanswered' && status.readyPathTaken
          ? asGuardDisplayPath({
              pathAbsolute: status.readyPathTaken,
              root: await getRepoRootWithFallback({ from: input.route }),
            })
          : null,
    });
    return {
      absorbed: true,
      emit: {
        stdout: [`🦉 absorbed: ${input.slug}`, ...tail].join('\n'),
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
