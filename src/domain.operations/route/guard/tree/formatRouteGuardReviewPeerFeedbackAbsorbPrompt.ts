import { UnexpectedCodePathError } from 'helpful-errors';

import { asGuardDisplayPath } from '../asGuardDisplayPath';
import type { RouteGuardReviewPeerFeedbackUnabsorbed } from '../review/peer/getRouteGuardReviewPeerFeedbackAbsorptionStatus';

/**
 * .what = one reviewer's identity + verdict + the two conversation paths
 * .why = every render case needs the same per-reviewer facts
 *
 * 🔴 .note = DERIVED from the readiness record, never re-declared beside it. a hand-copied
 *         twin drifts silently — only a required field forces the build to fail on a miss;
 *         an optional field or a stale doc comment would not
 *         (rule.require.single-source-of-truth-for-render).
 *
 * `tag` is omitted because it is the readiness verdict (absent vs stale), which the reply-prompt
 * does not render — it lists every owed reviewer alike.
 */
type FeedbackAbsorbReviewer = Omit<
  RouteGuardReviewPeerFeedbackUnabsorbed,
  'tag'
>;

/**
 * .what = a reviewer that still owes a reply, plus whether it is RETIRED — absent from the
 *         live guard config while one of its givens still holds an unanswered blocker
 * .why = only the reply-prompt can meet a retired reviewer. the absent/stale cases scope to a
 *        reviewer the driver just named via --as absorbed, so the flag would be noise there
 *        (rule.forbid.undefined-inputs — the field is required where it applies, absent where
 *        it does not, never optional)
 */
type FeedbackAbsorbReviewerOwed = FeedbackAbsorbReviewer & { retired: boolean };

/**
 * .what = the two conversation paths, cast into the form a driver reads
 * .why = every case prints both, so relativize in one place rather than six
 *
 * 🔴 .note = the cast happens HERE, at the display boundary, and must not be moved
 *         upstream to the read. `pathGiven` and `pathTaken` are not merely rendered —
 *         `getAllRouteGuardReviewPeersFeedbackUnabsorbed` pairs a given to its answer by
 *         set-membership on the ABSOLUTE taken path, and `setStoneAsFeedbackAbsorbed`
 *         stats that same path on disk. relativize at the read and the derived path
 *         no longer equals the globbed one, so every reviewer reads as unanswered
 *         forever — the deadlock this gate exists to avoid. the display form is a
 *         VIEW of the key, never the key.
 */
const asDisplayPaths = (input: {
  reviewer: FeedbackAbsorbReviewer;
  root: string;
}): { given: string; taken: string } => ({
  given: asGuardDisplayPath({
    pathAbsolute: input.reviewer.pathGiven,
    root: input.root,
  }),
  taken: asGuardDisplayPath({
    pathAbsolute: input.reviewer.pathTaken,
    root: input.root,
  }),
});

/**
 * .what = renders "N blockers, M nitpicks" with correct singular/plural
 * .why = the verdict line appears in every case, so pluralize once
 */
const asVerdict = (input: {
  blockers: number;
  nitpicks: number;
  unreadable: boolean;
}): string => {
  // 🔴 never print a fabricated count as though the reviewer had reported it. an
  //    unreadable given carries blockers:1 because the gate needs a number and none
  //    was read — to render that as `1 blocker` tells the driver the guard read a
  //    specific verdict when it read none, and sends them to hunt a blocker that was
  //    never raised
  if (input.unreadable) return 'unreadable — no numeric count found';

  const blockersLabel = input.blockers === 1 ? 'blocker' : 'blockers';
  const nitpicksLabel = input.nitpicks === 1 ? 'nitpick' : 'nitpicks';
  return `${input.blockers} ${blockersLabel}, ${input.nitpicks} ${nitpicksLabel}`;
};

/**
 * .what = renders the peer-review feedbackAbsorption prompt across its three cases
 * .why = one formatter, one voice — the reply-prompt (all feedbackUnabsorbed
 *        reviewers, rendered identically on stophook/arrived/passed), the ABSENT
 *        guidance (a .taken never written), and the STALE guidance (a .taken that
 *        answers an earlier given from the same reviewer). the absent/stale cases
 *        scope to the single reviewer the driver named via --as absorbed.
 */
export const formatRouteGuardReviewPeerFeedbackAbsorbPrompt = (
  input:
    | {
        case: 'reply-prompt';
        stone: string;
        root: string;
        reviewers: FeedbackAbsorbReviewerOwed[];
      }
    | {
        case: 'absent';
        stone: string;
        root: string;
        reviewer: FeedbackAbsorbReviewer;
      }
    | {
        case: 'stale';
        stone: string;
        root: string;
        reviewer: FeedbackAbsorbReviewer;
      },
): string => {
  // the multi-reviewer reply-prompt — shown identically across all three surfaces
  if (input.case === 'reply-prompt') return formatReplyPrompt(input);

  // the single-reviewer absent guidance — the .taken was never written
  if (input.case === 'absent') return formatAbsent(input);

  // the single-reviewer stale guidance — the .taken answers a prior generation
  return formatStale(input);
};

/**
 * .what = the "reviewers await your reply" list of every feedbackUnabsorbed reviewer
 * .why = the driver sees each reviewer, its verdict, and where to read + write
 */
const formatReplyPrompt = (input: {
  stone: string;
  root: string;
  reviewers: FeedbackAbsorbReviewerOwed[];
}): string => {
  // .note = deliberate local line-builder, scoped to this formatter — the escape hatch in
  //         rule.require.immutable-vars permits a scoped emit builder; no array crosses a boundary.
  const lines: string[] = [];
  const total = input.reviewers.length;

  lines.push(`🦉 the reviewers await your reply`);
  lines.push(``);
  lines.push(`🌕 lets respond`);
  lines.push(`   │`);

  input.reviewers.forEach((reviewer, i) => {
    const display = asDisplayPaths({ reviewer, root: input.root });
    lines.push(`   ├─ review.peer ${i + 1}/${total}`);
    lines.push(`   │  ├─ slug = ${reviewer.slug}`);
    // a retired reviewer is named here and found nowhere in the config — say so, or the driver
    // reads the halt as a defect and hunts for a reviewer that no longer exists (F8)
    if (reviewer.retired)
      lines.push(`   │  ├─ status = retired from the guard config`);
    lines.push(`   │  ├─ verdict = ${asVerdict(reviewer)}`);
    lines.push(`   │  ├─ absorb from`);
    lines.push(`   │  │  └─ ${display.given}`);
    lines.push(`   │  └─ articulate into`);
    lines.push(`   │     └─ ${display.taken}`);
    lines.push(`   │`);
  });

  // 🔴 one command PER reviewer — `--as absorbed` takes a single slug, so a close
  //    that names only reviewers[0] reads as "run this one and you are done" and the
  //    driver stops a reviewer short of discharged
  const asFeedbackAbsorbCmd = (slug: string): string =>
    `rhx route.stone.set --stone ${input.stone} --as absorbed --that ${slug}`;

  // a why+fix pair is a BRANCH of the tree, never prose appended after it — one command,
  //    one shape, at one indent scheme (rule.require.treestruct-output).
  // 🔴 one branch-head grammar across every halt this command emits — `why …` / `what to
  //    do …`, never a bare `fix`. the role word leads and the SUBJECT is a suffix,
  //    present only where siblings exist to disambiguate: a reviewer that is retired
  //    AND unreadable renders two why+fix pairs, and a bare `fix` on both leaves the
  //    driver to trace prose under each to learn which answered which. the absent/stale
  //    halts render exactly one why + one what-to-do, so their bare heads stay bare.
  const pushWhyFix = (branch: {
    why: { head: string; body: string[] };
    fix: { head: string; body: string[] };
  }): void => {
    lines.push(`   ├─ ${branch.why.head}`);
    branch.why.body.forEach((line, i) => {
      lines.push(`   │  ${i === 0 ? '└─' : '  '} ${line}`);
    });
    lines.push(`   │`);
    lines.push(`   ├─ ${branch.fix.head}`);
    branch.fix.body.forEach((line, i) => {
      lines.push(`   │  ${i === 0 ? '└─' : '  '} ${line}`);
    });
    lines.push(`   │`);
  };

  // the retired case needs its own why + fix, because the driver's usual instinct — wait for the
  // reviewer to speak again — can never succeed for a reviewer that no longer runs
  if (input.reviewers.some((reviewer) => reviewer.retired))
    pushWhyFix({
      why: {
        head: `why a retired reviewer still awaits`,
        // 🔴 a reviewer is retired by an edit to the guard config, never to the artifact —
        //    so this must not blame an artifact change, or a driver who changed none reads
        //    the halt as someone else's session. it must also not assert a blocker: `retired`
        //    and `unreadable` are independent, so both branches can render together, and an
        //    opener that claims a blocker collides with the unreadable branch's own "there
        //    is none to find". `spoke` is the declared term for the one fact both verdicts
        //    share (`term=route.guard.review.spoken`), and the only opener that stays true
        //    when the two stack.
        body: [
          `it spoke, and was then removed from the guard config. what it said`,
          `was never answered, and a debt is keyed to the reviewer rather than`,
          `to the artifact, so no edit to the artifact can clear it.`,
        ],
      },
      fix: {
        head: `what to do — answer the retired reviewer`,
        body: [
          `answer it as you would any other — write the .taken above. it will`,
          `not speak again, so your answer is what discharges it.`,
        ],
      },
    });

  // the unreadable case needs its own why + fix too: the driver's instinct is to open the given
  // and find the blocker, and there is no blocker in it to find — the reviewer never reported one
  if (input.reviewers.some((reviewer) => reviewer.unreadable))
    pushWhyFix({
      why: {
        head: `why an unreadable reviewer gates`,
        // 🔴 do NOT apologize here for a count the render does not print. `asVerdict`
        //    renders no synthesized count on the unreadable branch, so there is no
        //    figure on screen for this text to disown
        body: [
          `its output carried no numeric blocker or nitpick count, so no`,
          `verdict was ever seen. an absent verdict is not a clean one — to`,
          `score it 0/0 would read as an approval nobody granted, so it gates`,
          `instead.`,
        ],
      },
      fix: {
        head: `what to do — name the malfunction`,
        body: [
          `read its .given above — the reviewer malfunctioned, and the .taken`,
          `is where you say so. do not hunt for a blocker in it; there is none`,
          `to find.`,
        ],
      },
    });

  // .note = the close is the tree's ONE terminator, so it lands last — after any why+fix
  //         branch. that order also reads better than the reverse: the driver learns why
  //         the halt happened, then the command that answers it
  if (total > 1) {
    lines.push(
      `   └─ absorb each reviewer, then run all ${total} — one per reviewer`,
    );
    input.reviewers.forEach((reviewer, i) => {
      lines.push(
        `      ${i === total - 1 ? '└─' : '├─'} ${asFeedbackAbsorbCmd(reviewer.slug)}`,
      );
    });
  } else {
    // `total === 1` here by the branch above, so exactly one reviewer names this
    // prompt's subject. a bare `reviewers[0]` reader must hold that count as an
    // unstated fact; a named slot with a loud throw on a broken invariant makes
    // it a read rather than a trust (r003 nitpick.1, i005; rule.forbid.inline-decode-friction)
    const onlyReviewer = input.reviewers[0];
    if (!onlyReviewer)
      throw new UnexpectedCodePathError(
        'the single-reviewer close ran with an empty reviewers array',
        { total },
      );
    lines.push(`   └─ when you've absorbed this reviewer, run`);
    lines.push(`      └─ ${asFeedbackAbsorbCmd(onlyReviewer.slug)}`);
  }

  return lines.join('\n');
};

/**
 * .what = the crystal-clear absent-file guidance for one reviewer
 * .why = the driver signaled --as absorbed before the .taken existed
 */
const formatAbsent = (input: {
  stone: string;
  root: string;
  reviewer: FeedbackAbsorbReviewer;
}): string => {
  // .note = deliberate local line-builder, scoped to this formatter — the escape hatch in
  //         rule.require.immutable-vars permits a scoped emit builder; no array crosses a boundary.
  const lines: string[] = [];
  const display = asDisplayPaths({
    reviewer: input.reviewer,
    root: input.root,
  });

  // 🔴 no lead `   │` and no blank under the header: the first row is a branch (`├─`),
  //    never a connector. a `│` is correct only where a parent sits on the line directly
  //    above it — as in formatReplyPrompt, where it descends from the `🌕 lets respond`
  //    root. here the header IS that parent, so the tree opens straight into `├─` with
  //    naught between: a blank in that slot is a gap the reader reads as the block's end
  //    (rule.forbid.snapshot-visual-blemishes; r6 blocker.1, i010)
  lines.push(
    `✋ feedbackAbsorption absent for reviewer ${input.reviewer.slug}`,
  );
  lines.push(
    `   ├─ the guard looked for your response here, and did not find it`,
  );
  lines.push(`   │  └─ ${display.taken}`);
  lines.push(`   │`);
  lines.push(`   ├─ why`);
  lines.push(`   │  └─ --as absorbed is a promise that you engaged each`);
  lines.push(`   │     concern. the .taken file IS that engagement — absent`);
  lines.push(`   │     it, there is no ground to stand on.`);
  lines.push(`   │`);
  lines.push(`   └─ what to do`);
  lines.push(`      ├─ absorb from`);
  lines.push(`      │  └─ ${display.given}`);
  lines.push(`      └─ articulate into`);
  lines.push(`         └─ ${display.taken}`);

  return lines.join('\n');
};

/**
 * .what = the stale-file guidance for one reviewer
 * .why = a .taken exists, but it answers an earlier given from this reviewer —
 *        the REVIEWER has spoken again, so a fresh response is owed
 *
 * .note = under the reviewer-keyed debt, an edit to the artifact does NOT stale an
 *         answer: a taken pairs its own given, so it stays paired however many times
 *         the hash moves after it. the one way an answered reviewer becomes owed again
 *         is that the reviewer itself raised a new critique (F7).
 */
const formatStale = (input: {
  stone: string;
  root: string;
  reviewer: FeedbackAbsorbReviewer;
}): string => {
  // .note = deliberate local line-builder, scoped to this formatter — the escape hatch in
  //         rule.require.immutable-vars permits a scoped emit builder; no array crosses a boundary.
  const lines: string[] = [];
  const display = asDisplayPaths({
    reviewer: input.reviewer,
    root: input.root,
  });

  // 🔴 no lead `   │` — same reason as formatAbsent above; the blank parts header from tree
  lines.push(`✋ feedbackAbsorption stale for reviewer ${input.reviewer.slug}`);
  lines.push(``);
  lines.push(
    `   ├─ your response answers an earlier round of feedback from this reviewer`,
  );
  lines.push(`   │`);
  lines.push(`   ├─ why`);
  lines.push(
    `   │  └─ the reviewer has spoken again. your prior response still`,
  );
  lines.push(`   │     stands for what it answered — this is NEW feedback.`);
  lines.push(`   │`);
  lines.push(`   └─ what to do — absorb the feedback that is live`);
  lines.push(`      ├─ absorb from`);
  lines.push(`      │  └─ ${display.given}`);
  lines.push(`      └─ articulate into`);
  lines.push(`         └─ ${display.taken}`);

  return lines.join('\n');
};
