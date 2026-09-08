import { asGuardDisplayPath } from '../asGuardDisplayPath';
import type { RouteGuardReviewPeerUncontemplated } from '../review/peer/getRouteGuardReviewPeerContemplationStatus';

/**
 * .what = one reviewer's identity + verdict + the two conversation paths
 * .why = every render case needs the same per-reviewer facts
 *
 * 🔴 .note = DERIVED from the readiness record, never re-declared beside it. the two are one
 *         concept, and a hand-copied twin drifts: when `unreadable` landed, both copies had to
 *         be edited by hand, and only a required field would have failed the build had one been
 *         missed — an optional field or a stale doc comment would have drifted silently
 *         (rule.require.single-source-of-truth-for-render; r11 nitpick.1, i003).
 *
 * `tag` is omitted because it is the readiness verdict (absent vs stale), which the reply-prompt
 * does not render — it lists every owed reviewer alike.
 */
type ContemplateReviewer = Omit<RouteGuardReviewPeerUncontemplated, 'tag'>;

/**
 * .what = a reviewer that still owes a reply, plus whether it is RETIRED — absent from the
 *         live guard config while one of its givens still holds an unanswered blocker
 * .why = only the reply-prompt can meet a retired reviewer. the absent/stale cases scope to a
 *        reviewer the driver just named via --as contemplated, so the flag would be noise there
 *        (rule.forbid.undefined-inputs — the field is required where it applies, absent where
 *        it does not, never optional)
 */
type ContemplateReviewerOwed = ContemplateReviewer & { retired: boolean };

/**
 * .what = the two conversation paths, cast into the form a driver reads
 * .why = every case prints both, so relativize in one place rather than six
 *
 * 🔴 .note = the cast happens HERE, at the display boundary, and must not be moved
 *         upstream to the read. `pathGiven` and `pathTaken` are not merely rendered —
 *         `getAllRouteGuardReviewPeersUncontemplated` pairs a given to its answer by
 *         set-membership on the ABSOLUTE taken path, and `setStoneAsContemplated`
 *         stats that same path on disk. relativize at the read and the derived path
 *         no longer equals the globbed one, so every reviewer reads as unanswered
 *         forever — the deadlock this gate exists to avoid. the display form is a
 *         VIEW of the key, never the key (r11 blocker.1, i004).
 */
const asDisplayPaths = (input: {
  reviewer: ContemplateReviewer;
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
  //    specific verdict when it read no verdict at all, and sends them to hunt a
  //    blocker that was never raised (r9 nitpick.1, i003)
  if (input.unreadable) return 'unreadable — no numeric count found';

  const blockersLabel = input.blockers === 1 ? 'blocker' : 'blockers';
  const nitpicksLabel = input.nitpicks === 1 ? 'nitpick' : 'nitpicks';
  return `${input.blockers} ${blockersLabel}, ${input.nitpicks} ${nitpicksLabel}`;
};

/**
 * .what = renders the peer-review contemplation prompt across its three cases
 * .why = one formatter, one voice — the reply-prompt (all uncontemplated
 *        reviewers, rendered identically on stophook/arrived/passed), the ABSENT
 *        guidance (a .taken never written), and the STALE guidance (a .taken that
 *        answers an earlier given from the same reviewer). the absent/stale cases
 *        scope to the single reviewer the driver named via --as contemplated.
 */
export const formatRouteGuardReviewPeerContemplatePrompt = (
  input:
    | {
        case: 'reply-prompt';
        stone: string;
        root: string;
        reviewers: ContemplateReviewerOwed[];
      }
    | {
        case: 'absent';
        stone: string;
        root: string;
        reviewer: ContemplateReviewer;
      }
    | {
        case: 'stale';
        stone: string;
        root: string;
        reviewer: ContemplateReviewer;
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
 * .what = the "reviewers await your reply" list of every uncontemplated reviewer
 * .why = the driver sees each reviewer, its verdict, and where to read + write
 */
const formatReplyPrompt = (input: {
  stone: string;
  root: string;
  reviewers: ContemplateReviewerOwed[];
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
    lines.push(`   │  ├─ contemplate from`);
    lines.push(`   │  │  └─ ${display.given}`);
    lines.push(`   │  └─ articulate into`);
    lines.push(`   │     └─ ${display.taken}`);
    lines.push(`   │`);
  });

  // 🔴 one command PER reviewer — `--as contemplated` takes a single slug, so a close
  //    that names only reviewers[0] reads as "run this one and you are done" and the
  //    driver stops a reviewer short of discharged (r9 nitpick.1, i002)
  const asContemplateCmd = (slug: string): string =>
    `rhx route.stone.set --stone ${input.stone} --as contemplated --that ${slug}`;

  // 🔴 a why+fix pair is a BRANCH of the tree, never prose appended after it. an earlier
  //    render closed the tree with `└─ rhx …` and then hung two flat paragraphs beneath
  //    it, at a second indent scheme (3-space lead, 8-space continuation) the eye cannot
  //    pattern-match against the `├─`/`└─` depths above. one command, one shape
  //    (rule.require.treestruct-output; r6 i002)
  // 🔴 ONE branch-head grammar across every halt this command emits — `why …` and
  //    `what to do …`. two findings landed on this together and they pull the same way:
  //
  //    1. the fix head was the literal `fix` for BOTH branches, so a reviewer that is
  //       retired AND unreadable rendered two byte-identical `├─ fix` siblings and the
  //       driver had to read the prose under each to learn which answered which
  //       (r4 nitpick.1, i003)
  //    2. the absent + stale halts head their branches `why` / `what to do` while this
  //       one headed them `why …` / `fix`, so a driver who reads the command's outputs
  //       could not tell whether `fix` and `what to do` name the same role
  //       (r7 nitpick.2, i003)
  //
  //    ⇒ the role word leads and the SUBJECT is a suffix, present only where siblings
  //      exist to disambiguate. the absent/stale halts render exactly one why + one
  //      what-to-do, so their bare heads stay bare and stay correct.
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
        // 🔴 state the RULE, never a history. an earlier draft closed with "so it did not
        //    clear when the artifact changed" — but a reviewer is retired by an edit to the
        //    guard config, and the artifact need not have moved at all. a driver who changed
        //    no artifact then reads the halt as a report of someone else's session (r7 i001)
        //
        // 🔴 and it must NOT assert a blocker. `retired` and `unreadable` are independent
        //    axes, so both branches render together — and this line opened `it raised a
        //    blocker`, which the unreadable branch four lines below then contradicted with
        //    `there is none to find`. one tree told the driver to hunt a blocker and told
        //    them there was none to hunt. `spoke` is the declared term for the one fact
        //    that holds across BOTH verdicts (`term=route.guard.review.spoken`), so it is
        //    the only opener that stays true when the two stack (found by the stacked cli
        //    cell at 5.3 i011 — the cell existed in no test until then)
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
        // 🔴 do NOT apologize here for a count the render does not print. an earlier draft
        //    closed with "the count shown for it is not the reviewer's" — a leftover from
        //    back when `asVerdict` still printed the synthesized `blockers: 1`. once that
        //    fix landed the sentence disowned a number no longer on screen, and a reader
        //    who hunts the render for it finds no count at all (r7 i002)
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
      `   └─ contemplate each reviewer, then run all ${total} — one per reviewer`,
    );
    input.reviewers.forEach((reviewer, i) => {
      lines.push(
        `      ${i === total - 1 ? '└─' : '├─'} ${asContemplateCmd(reviewer.slug)}`,
      );
    });
  } else {
    lines.push(`   └─ when you've contemplated this reviewer, run`);
    lines.push(
      `      └─ ${asContemplateCmd(input.reviewers[0]?.slug ?? '<slug>')}`,
    );
  }

  return lines.join('\n');
};

/**
 * .what = the crystal-clear absent-file guidance for one reviewer
 * .why = the driver signaled --as contemplated before the .taken existed
 */
const formatAbsent = (input: {
  stone: string;
  root: string;
  reviewer: ContemplateReviewer;
}): string => {
  // .note = deliberate local line-builder, scoped to this formatter — the escape hatch in
  //         rule.require.immutable-vars permits a scoped emit builder; no array crosses a boundary.
  const lines: string[] = [];
  const display = asDisplayPaths({
    reviewer: input.reviewer,
    root: input.root,
  });

  // 🔴 no lead `   │` here, and the blank line above is why. a `│` is a connector, so it
  //    is correct only where a parent sits on the line directly above it — as in
  //    formatReplyPrompt, where it descends from the `🌕 lets respond` root. this halt
  //    parts its header from its tree with a blank, so a `│` in that slot would connect
  //    to a blank line: a stroke with no parent above it, shipped verbatim to a driver
  //    through seven snapshots (rule.forbid.snapshot-visual-blemishes; r6 blocker.1, i010)
  lines.push(`✋ contemplation absent for reviewer ${input.reviewer.slug}`);
  lines.push(``);
  lines.push(
    `   ├─ the guard looked for your response here, and did not find it`,
  );
  lines.push(`   │  └─ ${display.taken}`);
  lines.push(`   │`);
  lines.push(`   ├─ why`);
  lines.push(`   │  └─ --as contemplated is a promise that you engaged each`);
  lines.push(`   │     critique. the .taken file IS that engagement — absent`);
  lines.push(`   │     it, there is no ground to stand on.`);
  lines.push(`   │`);
  lines.push(`   └─ what to do`);
  lines.push(`      ├─ contemplate from`);
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
 * .note = the why-line no longer blames the artifact change (F7). under the
 *         reviewer-keyed debt, an edit to the artifact does NOT stale an answer:
 *         a taken pairs its own given, so it stays paired however many times the
 *         hash moves after it. the one way an answered reviewer becomes owed again
 *         is that the reviewer itself raised a new critique.
 *
 * .note = THREE lines carry that change, not one — the lead line, the why-line, and
 *         the what-to-do line. F7 predicted the copy would need no edit at all and
 *         scored its confidence on that; the prediction was wrong, and the entry is
 *         re-scored 88% -> 70%. only the header line survives verbatim. recorded here
 *         because a reader who greps F7 finds this note first, and a note that names
 *         one of three understates what the fork actually cost.
 */
const formatStale = (input: {
  stone: string;
  root: string;
  reviewer: ContemplateReviewer;
}): string => {
  // .note = deliberate local line-builder, scoped to this formatter — the escape hatch in
  //         rule.require.immutable-vars permits a scoped emit builder; no array crosses a boundary.
  const lines: string[] = [];
  const display = asDisplayPaths({
    reviewer: input.reviewer,
    root: input.root,
  });

  // 🔴 no lead `   │` — same reason as formatAbsent above; the blank parts header from tree
  lines.push(`✋ contemplation stale for reviewer ${input.reviewer.slug}`);
  lines.push(``);
  lines.push(
    `   ├─ your response answers an earlier critique from this reviewer`,
  );
  lines.push(`   │`);
  lines.push(`   ├─ why`);
  lines.push(
    `   │  └─ the reviewer has spoken again. your prior response still`,
  );
  lines.push(`   │     stands for what it answered — this is a NEW critique.`);
  lines.push(`   │`);
  lines.push(`   └─ what to do — answer the critique that is live`);
  lines.push(`      ├─ contemplate from`);
  lines.push(`      │  └─ ${display.given}`);
  lines.push(`      └─ articulate into`);
  lines.push(`         └─ ${display.taken}`);

  return lines.join('\n');
};
