import { BadRequestError } from 'helpful-errors';

import type { RouteGuardReviewPeerFeedbackUnabsorbed } from './getRouteGuardReviewPeerFeedbackAbsorptionStatus';

/**
 * .what = R1 — refuses an absorption on a lane whose feedback is unanswered
 * .why = the wish's boundary: *"a dispute is a verdict on the disagreement; it does not
 *        discharge the duty to answer each point."* so the two gates are ORDERED rather than
 *        merged — answer first, then absorb each concern you answered.
 *
 * 🔴 it is a DIFFERENT class from R2, and the two must not share a message. both refuse an
 *    absorption move; they refuse it for opposite reasons — *"you owe an answer"* against *"no
 *    verdict stands to answer"* — and a driver who reads one message for both takes the wrong
 *    next step (case=3 [t3]).
 *
 * .note = the refusal names the blocker count AND the exact `.taken` path, both of which the
 *         feedbackUnabsorbed record already carries. the path is printed IN FULL, hash and all:
 *         the driver copies it rather than derives it, so any elision becomes a refusal they
 *         cannot act on.
 */
export const assertAbsorptionIsAnswered = (input: {
  stone: string;
  slug: string;
  feedbackUnabsorbed: RouteGuardReviewPeerFeedbackUnabsorbed[];
}): void => {
  const owed = input.feedbackUnabsorbed.find((one) => one.slug === input.slug);
  if (!owed) return;

  // the subject and its verb agree, so a one-blocker refusal does not read as broken
  // english at the exact moment a driver is already stuck (r10 b3, caught by its snapshot)
  const isPlural = !owed.unreadable && owed.blockers !== 1;
  const countLabel = owed.unreadable
    ? `an unreadable verdict (counted as 1 blocker)`
    : `${owed.blockers} blocker${isPlural ? 's' : ''}`;

  throw new BadRequestError(
    [
      `answer ${input.slug} before you absorb it`,
      ``,
      `${countLabel} ${isPlural ? 'stand' : 'stands'} with no .taken.by_self.${input.slug}`,
      ``,
      // 🔴 the composition gate (define.invariant.review.peer.absorb) now refuses step 2
      // until EVERY concern of the given carries a disposition — so a sequence that
      // jumped straight from the .taken to `--as absorbed` taught a command that was
      // itself refused, with no next step named (r009 nitpick.1, i005). the middle step
      // is owed, even though the exact concerns cannot be enumerated here (this refusal
      // fires BEFORE the given is re-read, so only the blocker count is known)
      `answer first, then dispose each concern, then absorb:`,
      `  1. write ${owed.pathTaken}`,
      `     └─ one [REPAIR] or [REFUTE] per point`,
      `  2. once per concern — ${countLabel}:`,
      // 🔴 --severity is MANDATORY on a concede and --why is MANDATORY on a dispute
      //    (setStoneAsConcernAbsorbed refuses either without it). this is the FIRST
      //    surface a driver meets on a rejected lane, so the taught command must not
      //    be one the boundary itself refuses (r009 blocker.1, i009)
      `     ├─ rhx route.stone.set --stone ${input.stone} \\`,
      `     │    --as conceded --with ${input.slug} --about <concern> --severity better|urgent`,
      `     └─ rhx route.stone.set --stone ${input.stone} \\`,
      `          --as disputed --with ${input.slug} --about <concern> --why <fulcrum-path>`,
      `  3. rhx route.stone.set --stone ${input.stone} --as absorbed --that ${input.slug}`,
    ].join('\n'),
    {
      stone: input.stone,
      slug: input.slug,
      blockers: owed.blockers,
      pathTaken: owed.pathTaken,
    },
  );
};
