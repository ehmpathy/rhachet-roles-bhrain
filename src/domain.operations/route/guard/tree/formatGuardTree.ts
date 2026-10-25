import type { RouteStoneGuardReviewPeerArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { asGuardReasonHead } from '../asGuardReasonHead';
import { formatGuardMalfunctionClearLines } from '../formatGuardMalfunctionClearLines';
import { asConcessionReasonDisplay } from '../review/peer/asConcessionReasonDisplay';
import { asJudgeReasonBranches } from '../review/peer/asJudgeReasonBranches';
import {
  computeReviewPeerVerdict,
  type ReviewPeerVerdict,
} from '../review/peer/meter/computeReviewPeerVerdict';
import { LEVEL_OF_UNMAPPED_REVIEW } from '../review/peer/meter/getOneReviewLevelByIndex';
import {
  computeBlockRemedyGroups,
  formatBlockRemedyGroups,
} from './formatBlockRemedyGroups';
import {
  formatGuardReviewerTree,
  OVERRULED_NARRATIVE,
  type ReviewerTreeState,
} from './formatGuardReviewerTree';

/**
 * .what = peer reviewer meter status for display
 * .why = displays budget/level/verdict in guard output
 */
export interface GuardPeerMeterStatus {
  /**
   * .what = the reviewer's declared position in the guard file (1-based)
   * .why = the declared index is the permanent identity key for artifact filenames (r001,
   *        r002…) and the rN label in the guard detail block. array position (m + 1) breaks
   *        when reviewers are appended mid-journey, because the level-sorted meters array
   *        places the late addition at a lower position than its declared slot — so the 🗿
   *        block shows r5 while the artifact says r008 and the 🦉 tree says r8.
   */
  index: number;
  slug: string;
  level: number;
  rounds: number;
  budget: number;
  verdict: ReviewPeerVerdict;
  awaits: { level: number } | false;
  blockers: number;
  nitpicks: number;
  /**
   * whether the human waved this reviewer's level through (overrule).
   * .why = an overrule is a SEPARATE forgiveness flag, not a verdict — the raw verdict of an
   *        overruled reviewer stays 'rejected'. this flag is the single source of truth every
   *        display consumer reads so an overruled level renders as terminal-for-unlock
   *        (forgiven), never as an un-forgiven rejection or a bogus `awaits lower terminal`.
   *        see rule.require.single-source-of-truth-for-render.
   */
  overruled: boolean;
  /**
   * whether a DISPUTE took this lane out of this generation's round.
   * .why = the peer of `overruled`, and required for the same reason: it is the single source
   *        every display consumer reads, so a skipped lane cannot render as one that ran on one
   *        surface and quiet on another (rule.require.single-source-of-truth-for-render).
   *
   * 🔴 required rather than optional, on the phase-5 lesson: `RouteStoneGuardBlockerType` promised
   *    the compiler would flag every consumer of a new member and three absorbed it silently,
   *    because each read it through a default tail. a required field has no tail to fall through.
   */
  skippedByDispute: boolean;
  /**
   * this LANE's own disputed concern counts — what the driver's disputes have shed from its
   * own raised total, never the stone-wide residual (the judge's `residual:` line, a sum
   * across every lane).
   *
   * .why = a lane's raw `blockers`/`nitpicks` rendered alone reads as "the road still holds
   *        here", even at the exact moment a dispute above it already sheds the count — the
   *        render forced a reader to hold two lines in their head and do the subtraction
   *        themselves. required, not optional, on the same phase-5 lesson `skippedByDispute`
   *        cites: an optional field has a default tail every consumer can silently fall through.
   */
  disputed: { blockers: number; nitpicks: number };
  /** path to review artifact file */
  path: string | null;
}

/**
 * .what = record for route format tree guard review output
 * .why = composes domain artifact with runtime context for display
 *
 * combines:
 * - artifact fields (persisted result from RouteStoneGuardReviewPeerArtifact)
 * - runtime context (cmd, cached, duration - determined at execution time)
 * - peer meter association (slug, level, rounds, budget - from meter state)
 */
export interface RouteFormatTreeGuardReviewRecord {
  /** from RouteStoneGuardReviewPeerArtifact */
  artifact: Pick<
    RouteStoneGuardReviewPeerArtifact,
    | 'index'
    | 'path'
    | 'blockers'
    | 'nitpicks'
    | 'tallier'
    | 'talliedBy'
    | 'exitClass'
  >;
  /** command that was run (from guard file) */
  cmd: string;
  /** cache status (runtime determination) */
  cached: { hit: true; on: string[] } | false;
  /** execution duration (runtime measurement) */
  durationSec: number | null;
  /** peer meter info (from meter state) */
  peer?: {
    slug: string;
    level: number;
    rounds: number;
    budget: number;
  };
}

/**
 * .what = reads the reviewer slug a review record carries
 * .why = the slug is minted once at parse (`standardizePeerReviewSlugs`) and rides in on
 *        `peer.slug`; a re-derivation from `cmd` here would be a second source that a change
 *        to the parse rule cannot reach (rule.require.review-standardization-at-parse).
 *        a record with no peer info falls back to the parser's own default for a slug it
 *        could not mint (`peer-<N>`, 1-based), never to the command
 */
const asReviewRecordSlug = (input: {
  review: RouteFormatTreeGuardReviewRecord;
}): string => input.review.peer?.slug ?? `peer-${input.review.artifact.index}`;

/**
 * .what = derives peerMeters from reviews when not explicitly provided
 * .why = all reviews are metered - when explicit meters absent, use defaults
 *
 * .note = uses default thresholds (0, 0) since guard judges not available here
 */
const deriveMetersFromReviews = (
  reviews: RouteFormatTreeGuardReviewRecord[],
): GuardPeerMeterStatus[] => {
  return reviews.map((review) => {
    // read the slug minted at parse
    const slug = asReviewRecordSlug({ review });
    const level = review.peer?.level ?? LEVEL_OF_UNMAPPED_REVIEW;
    const budget = review.peer?.budget ?? Infinity;
    const rounds = review.peer?.rounds ?? 1;
    // derive verdict from rounds, budget, blockers, nitpicks, exitClass (defaults for thresholds)
    // wasExhausted: false since review artifact exists = review ran
    const verdict = computeReviewPeerVerdict({
      rounds,
      budget,
      blockers: review.artifact.blockers,
      nitpicks: review.artifact.nitpicks,
      exitClass: review.artifact.exitClass,
      wasExhausted: false,
    });
    return {
      index: review.artifact.index,
      slug,
      level,
      rounds,
      budget,
      verdict,
      awaits: false,
      overruled: false,
      // a derived meter has no stance corpus to fold — it is built from review ARTIFACTS alone,
      // and a skip is a fact about the ledger. the authoritative meter
      // (`getAllReviewPeerMeterStatuses`) computes it; this fallback states the safe default
      // rather than guess, exactly as it does for `overruled`
      skippedByDispute: false,
      // a derived meter has no stance corpus to fold, on the same ground as `skippedByDispute`
      // above — there is naught to dispute against
      disputed: { blockers: 0, nitpicks: 0 },
      blockers: review.artifact.blockers,
      nitpicks: review.artifact.nitpicks,
      path: review.artifact.path,
    };
  });
};

/**
 * .what = formats peer reviewer meters as tree lines via shared formatter
 * .why = shared format for reviews section in guard output and route.drive status
 *
 * delegates to formatGuardReviewerTree for consistent format:
 * - header: r${index}: slug (l${level}, ${rounds}/${budget})
 * - verdict + duration as first detail line
 * - blockers/nitpicks always shown (even 0)
 * - path as final detail line
 *
 * @see rule.forbid.duplicate-format-tree-operations
 */
export const formatReviewsMeterLines = (input: {
  meters: GuardPeerMeterStatus[];
  reviews?: RouteFormatTreeGuardReviewRecord[];
  /** base indent for all lines (e.g., '      ' or '   │  ') */
  baseIndent?: string;
  /** section indent for content under header (e.g., '│  ' or '   ') */
  sectionIndent?: string;
  /** whether to include the header line */
  includeHeader?: boolean;
  /** header prefix: '├─' or '└─' or '' for no prefix */
  headerPrefix?: string;
  /** header text: 'reviews' or '🦉 peer reviewers' */
  headerText?: string;
  /** row density, passed to formatGuardReviewerTree — `full` by default */
  density?: 'full' | 'compact';
  /**
   * whether the last meter closes its section (`└─`). false where the caller appends peer
   * rows beneath the meters — the drive round block appends a collapsed-lane count and the
   * judge rows — so the last meter keeps a `├─` and the tree does not close early.
   * defaults to true, so every extant call is unchanged
   */
  closesSection?: boolean;
}): string[] => {
  // .note = deliberate local line-builder, scoped to this formatter — the escape hatch in
  //         rule.require.immutable-vars permits a scoped emit builder; no array crosses a boundary.
  const lines: string[] = [];
  const baseIndent = input.baseIndent ?? '';
  const closesSection = input.closesSection ?? true;
  const sectionIndent = input.sectionIndent ?? '   ';

  // 🔴 no meters ⇒ no section at all, header included. a `├─ reviews` connector with no
  //    rows beneath it is a promise the tree does not keep: the driver reads a branch that
  //    announces reviewer rows and delivers none, with no way to tell whether the
  //    reviewers are absent or the render dropped them
  //    (rule.forbid.snapshot-visual-blemishes). reachable from the exhausted-status drive
  //    halt, where the stone declares no guard at all so the meter set is legitimately
  //    empty.
  //
  // 🟡 the guard is HERE rather than at each caller because this operation is the single
  //    render source every call site shares, and a per-caller guard is the duplication
  //    `rule.forbid.duplicate-format-tree-operations` forbids.
  if (input.meters.length === 0) return [];

  if (input.includeHeader !== false) {
    const headerPrefix = input.headerPrefix ?? '├─';
    const headerText = input.headerText ?? 'reviews';
    const separator = headerPrefix ? ' ' : '';
    lines.push(`${baseIndent}${headerPrefix}${separator}${headerText}`);
  }

  // create lookup of review inputs by slug
  // .note = slugs are guaranteed unique at parse time via standardizePeerReviewSlugs
  // .note = built in one constructor call from the entry list — no in-place `.set`, so no
  //         mutation to examine
  const reviewBySlug = new Map<string, RouteFormatTreeGuardReviewRecord>(
    (input.reviews ?? []).map((review) => [
      asReviewRecordSlug({ review }),
      review,
    ]),
  );

  // convert each meter to ReviewerTreeState and format via shared formatter
  for (let m = 0; m < input.meters.length; m++) {
    const meter = input.meters[m]!;
    const isLast = closesSection && m === input.meters.length - 1;
    const review = reviewBySlug.get(meter.slug);

    // convert meter + review to ReviewerTreeState
    // .note = use the declared index from the meter, not array position —
    //         a level-sorted array places late additions at lower positions than
    //         their declared slots, so m + 1 diverges from the artifact filename
    //         (r008) and the 🦉 live tree (r8). see GuardPeerMeterStatus.index.
    const state = asReviewerTreeStateFromMeter({
      meter,
      review,
      index: meter.index,
    });

    // format via shared formatter
    const reviewerLines = formatGuardReviewerTree({
      reviewer: state,
      isLast,
      baseIndent: `${baseIndent}${sectionIndent} `,
      density: input.density,
    });
    lines.push(...reviewerLines);
  }

  return lines;
};

/**
 * .what = the identity fields every `ReviewerTreeState` carries, read from a persisted meter
 * .why = the meter-sourced twin of `asReviewerTreeIdentity` (genContextCliEmit), which reads a
 *        live event. the two source shapes differ — a meter carries `overruled` and
 *        `skippedByDispute`, an event carries neither — so each adapter owns one identity read,
 *        and every branch below spreads it rather than spells it out
 *        (rule.forbid.duplicate-format-tree-operations)
 * .note = `index` is the declared slot, passed by the caller (see GuardPeerMeterStatus.index)
 */
const asReviewerTreeIdentityFromMeter = (input: {
  meter: GuardPeerMeterStatus;
  index: number;
}): Omit<ReviewerTreeState, 'state'> => ({
  index: input.index,
  slug: input.meter.slug,
  level: input.meter.level,
  rounds: input.meter.rounds,
  budget: input.meter.budget,
  overruled: input.meter.overruled,
  skippedByDispute: input.meter.skippedByDispute,
});

/**
 * .what = converts meter + review to ReviewerTreeState
 * .why = bridges final result shape to shared formatter input
 */
const asReviewerTreeStateFromMeter = (input: {
  meter: GuardPeerMeterStatus;
  review?: RouteFormatTreeGuardReviewRecord;
  index: number;
}): ReviewerTreeState => {
  const { meter, review, index } = input;
  const identity = asReviewerTreeIdentityFromMeter({ meter, index });

  // awaits state
  if (meter.awaits) {
    return {
      ...identity,
      state: { type: 'awaits', level: meter.awaits.level },
    };
  }

  // queued state
  if (meter.verdict === 'queued') {
    return { ...identity, state: { type: 'queued' } };
  }

  // malfunction state
  if (meter.verdict === 'malfunction') {
    const path = review?.artifact.path ?? meter.path ?? '';
    return { ...identity, state: { type: 'malfunction', path } };
  }

  // constraint state (a genuine constraint verdict — exit 2, no blockers — renders its own line,
  // never a finished verdict). this branch also narrows the residual verdict to the finished set
  // below, so the finished branch needs no `as` cast (rule.forbid.as-cast).
  if (meter.verdict === 'constraint') {
    const constraintPath = review?.artifact.path ?? meter.path ?? '';
    return {
      ...identity,
      state: { type: 'constraint', path: constraintPath },
    };
  }

  // finished states (approved, rejected, exhausted)
  // prefer review artifact values; fallback to meter values (always populated)
  const blockers = review?.artifact.blockers ?? meter.blockers;
  const nitpicks = review?.artifact.nitpicks ?? meter.nitpicks;
  const path = review?.artifact.path ?? meter.path ?? '';
  const cached = review?.cached ? true : false;
  // use durationSec from review (fresh: from event, cached: from artifact stdout)
  const durationSec = review?.durationSec ?? null;
  // source the tallier from the artifact: the PIN its footer recorded, so the tree names
  // the model that ran. null for a verbatim read, a pre-fallback record, or the meter-only
  // fallback path — the marker shows only where a sub-brain tallied
  const talliedBy =
    review?.artifact.tallier === 'probabilistic'
      ? review.artifact.talliedBy
      : null;

  return {
    ...identity,
    state: {
      type: 'finished',
      verdict: meter.verdict,
      durationSec,
      // 🔴 `disputed` reads from the METER, never a fresh artifact — a dispute is declared
      //    against a GIVEN, and `meter.disputed` already keys to the slug's latest one (S03's
      //    lapse). a fresh round's artifact carries no stance corpus of its own to fold.
      blockers: { disputed: meter.disputed.blockers, reported: blockers },
      nitpicks: { disputed: meter.disputed.nitpicks, reported: nitpicks },
      path,
      cached,
      talliedBy,
    },
  };
};

/**
 * .what = formats guard results as a tree string with box-draw characters
 * .why = enables human-readable cli output for guard execution results
 */
export const formatGuardTree = (input: {
  stone: string;
  passage: 'allowed' | 'overruled' | 'blocked' | 'malfunction';
  note: string | null;
  reason: string | null;
  guard: {
    artifactFiles: string[];
    reviews: Array<{
      index: number;
      cmd: string;
      cached: { hit: true; on: string[] } | false;
      durationSec: number | null;
      blockers: number;
      nitpicks: number;
      tallier: 'deterministic' | 'probabilistic' | null;
      /** the pinned brain that tallied, as the footer recorded it — null where none did */
      talliedBy: string | null;
      path: string;
      exitClass: 'passed' | 'constraint' | 'malfunction';
      /** peer info if available: slug, level, rounds/budget */
      peer?: {
        slug: string;
        level: number;
        rounds: number;
        budget: number;
      };
    }>;
    judges: Array<{
      index: number;
      cmd: string;
      cached: { hit: true; on: string[] } | false;
      durationSec: number | null;
      passed: boolean;
      reason: string | null;
      path: string;
      /** the human overruled this judge (a malfunction on the judge rung) — render forgiven */
      overruled?: boolean;
    }>;
    peerMeters?: GuardPeerMeterStatus[];
    /**
     * the lever the refused reviewers' .given named — whether one was an overflow, and the
     * `--partition` values it proposed — read by the caller that opened the .given; absent
     * where none did
     * .why = a constraint halt offers a partition only to an overflow, and pastes the
     *        partitions the refusal computed, never a template
     */
    constraintLever?: { overflowed: boolean; partitions: string[] };
  } | null;
  /**
   * .what = whether guard is the last item in the tree
   * .why = determines box-draw connector (└─ vs ├─) and inner indent
   */
  isLast?: boolean;
}): string => {
  // a malfunction reason carries its header and one line per broken part; the `reason =` line
  // and the remedy groups read the header, the clear block reads the whole
  const reasonHead = asGuardReasonHead({
    passage: input.passage,
    reason: input.reason,
  });

  // .note = deliberate local line-builder, scoped to this formatter — the escape hatch in
  //         rule.require.immutable-vars permits a scoped emit builder; no array crosses a boundary.
  const lines: string[] = [];

  lines.push(`🗿 route.stone.set`);
  lines.push(`   ├─ stone = ${input.stone}`);

  // format passage line with optional note
  const passageLabel = input.note
    ? `${input.passage} (${input.note})`
    : input.passage;

  // if no guard, emit passage as the last line
  if (!input.guard) {
    if (
      (input.passage === 'blocked' || input.passage === 'malfunction') &&
      reasonHead
    ) {
      lines.push(`   ├─ passage = ${passageLabel}`);

      // detect cases that append an options block (reason then needs ├─, not └─)
      const remedyGroups = computeBlockRemedyGroups({
        stone: input.stone,
        passage: input.passage,
        reason: reasonHead,
        // no guard data, so no .given was read
        lever: null,
      });
      const hasOptions = remedyGroups.length > 0;
      // 🔴 decode a concession marker to its human line, and surface the urgent warn — via
      //    the ONE shared transformer every reason surface calls
      //    (rule.require.single-source-of-truth-for-render). before this, both guard-tree
      //    renders showed the raw marker (r011 blocker.1). the warn NESTS under reason —
      //    it explains why that reason is a human wait, so it is reason's child, never a
      //    peer of it. reason's own connector depends on whether a block follows it — the
      //    malfunction clear block or the options.
      const { reasonText, warnText } = asConcessionReasonDisplay({
        reason: reasonHead,
      });
      const isReasonFollowed = hasOptions || input.passage === 'malfunction';
      const reasonConnector = isReasonFollowed ? '├─' : '└─';
      lines.push(`   ${reasonConnector} reason = ${reasonText}`);
      if (warnText) {
        const warnPrefix = isReasonFollowed ? '│  ' : '   ';
        lines.push(`   ${warnPrefix}└─ 🟡 ${warnText}`);
      }

      // a malfunction stays the driver's to clear, so its levers lead the human's options —
      // a MIXED halt (a lane broke as another spent) included: the exhaustion adds remedies,
      // it never retires the malfunction's own (r014 nitpick.3, i014)
      if (input.passage === 'malfunction')
        lines.push(
          ...formatGuardMalfunctionClearLines({
            stone: input.stone,
            reason: input.reason,
            indent: '   ',
            branch: hasOptions ? '├─' : '└─',
          }),
        );

      if (hasOptions) {
        // options is the LAST block here (no guard follows) → children indent at 6 spaces
        lines.push(`   └─ options`);
        lines.push(
          ...formatBlockRemedyGroups({
            groups: remedyGroups,
            baseIndent: '      ',
          }),
        );
      }
    } else {
      lines.push(`   └─ passage = ${passageLabel}`);
    }
    return lines.join('\n');
  }

  // emit passage line (not last — guard section follows)
  lines.push(`   ├─ passage = ${passageLabel}`);

  // emit reason if blocked or malfunction
  if (
    (input.passage === 'blocked' || input.passage === 'malfunction') &&
    reasonHead
  ) {
    // 🔴 decode a concession marker to its human line + urgent warn via the ONE shared
    //    transformer (rule.require.single-source-of-truth-for-render). a guard section always
    //    follows reason here, so reason takes ├─. the warn NESTS under reason — it explains
    //    why that reason is a human wait, so it is reason's child, never a peer of it.
    //    before this the raw marker shipped (r011 blocker.1).
    const { reasonText, warnText } = asConcessionReasonDisplay({
      reason: reasonHead,
    });
    // a judge reason's shed axes nest under it too, one branch each, beside the warn
    // .note = reasonText is null only for a null input, and reasonHead is set here
    const { head: reasonTextHead, shed: reasonShed } = asJudgeReasonBranches({
      reason: reasonText ?? reasonHead,
    });
    const reasonChildren = [
      ...reasonShed,
      ...(warnText ? [`🟡 ${warnText}`] : []),
    ];
    lines.push(`   ├─ reason = ${reasonTextHead}`);
    reasonChildren.forEach((child, index) =>
      lines.push(
        `   │  ${index === reasonChildren.length - 1 ? '└─' : '├─'} ${child}`,
      ),
    );

    // add the remedy options block — one additive list across every gate that fired this
    // pass (overrule for a malfunction/constraint, budget + approve for an exhaustion), so a
    // mixed halt names every remedy at once. a guard section follows → children indent at "│  ".
    // .why = a broken reviewer must not permablock the driver; the human can overrule it, top
    //        up budget, or fix the reviewer — and when several gates concur, every remedy rides
    //        in one block, so no second unwarned block hits the human on re-arrive.
    const remedyGroups = computeBlockRemedyGroups({
      stone: input.stone,
      passage: input.passage,
      reason: reasonHead,
      lever: input.guard?.constraintLever ?? null,
    });

    // a malfunction stays the driver's to clear, so its levers lead the human's options — the
    // same lever list the route.drive replay renders (rule.forbid.duplicate-format-tree-operations).
    // a MIXED halt keeps them too — the exhaustion adds remedies, never retires these (r014 n3, i014)
    if (input.passage === 'malfunction')
      lines.push(
        ...formatGuardMalfunctionClearLines({
          stone: input.stone,
          reason: input.reason,
          indent: '   ',
          branch: '├─',
        }),
      );

    if (remedyGroups.length > 0) {
      lines.push(`   ├─ options`);
      lines.push(
        ...formatBlockRemedyGroups({
          groups: remedyGroups,
          baseIndent: '   │  ',
        }),
      );
    }
  }

  // guard section
  const hasReviews = input.guard.reviews.length > 0;
  const hasJudges = input.guard.judges.length > 0;
  const hasPeerMeters =
    input.guard.peerMeters && input.guard.peerMeters.length > 0;

  // isLast determines connector and inner indent
  const guardIsLast = input.isLast ?? true;
  const guardConnector = guardIsLast ? '└─' : '├─';
  const guardIndent = guardIsLast ? '      ' : '   │  ';

  lines.push(`   ${guardConnector} guard`);

  // determine which sub-sections are last for correct box-draw
  // note: peerMeters are integrated into reviews section, not separate
  // the reviews section shows if any peer reviewer (meter) or ran review is present
  const sections: Array<{
    type: 'artifacts' | 'reviews' | 'judges';
  }> = [
    { type: 'artifacts' },
    ...(hasReviews || hasPeerMeters ? [{ type: 'reviews' as const }] : []),
    ...(hasJudges ? [{ type: 'judges' as const }] : []),
  ];

  for (let s = 0; s < sections.length; s++) {
    const section = sections[s]!;
    const isSectionLast = s === sections.length - 1;
    const sectionPrefix = isSectionLast ? '└─' : '├─';
    const sectionIndent = isSectionLast ? '   ' : '│  ';

    if (section.type === 'artifacts') {
      lines.push(`${guardIndent}${sectionPrefix} artifacts`);
      for (let a = 0; a < input.guard.artifactFiles.length; a++) {
        const isArtifactLast = a === input.guard.artifactFiles.length - 1;
        const artPrefix = isArtifactLast ? '└─' : '├─';
        lines.push(
          `${guardIndent}${sectionIndent} ${artPrefix} ${input.guard.artifactFiles[a]}`,
        );
      }
    }

    if (section.type === 'reviews') {
      // transform flat reviews to RouteFormatTreeGuardReviewRecord format
      const reviewInputs: RouteFormatTreeGuardReviewRecord[] =
        input.guard.reviews.map((r) => ({
          artifact: {
            index: r.index,
            path: r.path,
            blockers: r.blockers,
            nitpicks: r.nitpicks,
            tallier: r.tallier,
            talliedBy: r.talliedBy,
            exitClass: r.exitClass,
          },
          cmd: r.cmd,
          cached: r.cached,
          durationSec: r.durationSec,
          peer: r.peer,
        }));

      // use peerMeters as source of truth for ALL reviewers (sorted by level)
      // when peerMeters not provided, derive from reviews with defaults
      const meters =
        input.guard.peerMeters ?? deriveMetersFromReviews(reviewInputs);

      const reviewLines = formatReviewsMeterLines({
        meters,
        reviews: reviewInputs,
        baseIndent: guardIndent,
        sectionIndent,
        includeHeader: true,
        headerPrefix: sectionPrefix,
      });
      lines.push(...reviewLines);
    }

    if (section.type === 'judges') {
      lines.push(`${guardIndent}${sectionPrefix} judges`);
      for (let j = 0; j < input.guard.judges.length; j++) {
        const judge = input.guard.judges[j]!;
        const isJudgeLast = j === input.guard.judges.length - 1;
        const judgePrefix = isJudgeLast ? '└─' : '├─';
        const judgeIndent = isJudgeLast ? '   ' : '│  ';

        lines.push(
          `${guardIndent}${sectionIndent} ${judgePrefix} j${judge.index}: ${judge.cmd}`,
        );

        if (judge.cached) {
          // show what artifacts the cache was based on
          lines.push(
            `${guardIndent}${sectionIndent} ${judgeIndent} └─ · cached`,
          );
          for (let c = 0; c < judge.cached.on.length; c++) {
            const isCachedOnLast = c === judge.cached.on.length - 1;
            const cachedOnPrefix = isCachedOnLast ? '└─' : '├─';
            lines.push(
              `${guardIndent}${sectionIndent} ${judgeIndent}    ${cachedOnPrefix} on ${judge.cached.on[c]}`,
            );
          }
        } else {
          // each detail is one leaf; a reason's shed axes nest beneath it as branches of their own
          const detailLines: { text: string; children: string[] }[] = [];
          const dur =
            judge.durationSec !== null
              ? `${judge.durationSec.toFixed(1)}s`
              : '0.0s';
          const mark = judge.passed ? '✓' : '✗';
          detailLines.push({ text: `finished ${dur} ${mark}`, children: [] });
          // a human overrule of the judge rung forgives a malfunctioned judge — read it as
          // forgiven, not a bare "✗ blocked" that would contradict the top-line `passage =
          // overruled` (the judge-tier twin of the peer-level overrule display; the exact
          // self-contradiction the earlier peer-level fix removed)
          if (judge.overruled) {
            detailLines.push({ text: OVERRULED_NARRATIVE, children: [] });
          } else if (!judge.passed && judge.reason) {
            const { head, shed } = asJudgeReasonBranches({
              reason: judge.reason,
            });
            detailLines.push({ text: `reason: ${head}`, children: shed });
          }

          for (let d = 0; d < detailLines.length; d++) {
            const isDetailLast = d === detailLines.length - 1;
            const detailPrefix = isDetailLast ? '└─' : '├─';
            const detailIndent = isDetailLast ? '   ' : '│  ';
            const detail = detailLines[d]!;
            lines.push(
              `${guardIndent}${sectionIndent} ${judgeIndent} ${detailPrefix} ${detail.text}`,
            );
            for (let k = 0; k < detail.children.length; k++) {
              const childPrefix =
                k === detail.children.length - 1 ? '└─' : '├─';
              lines.push(
                `${guardIndent}${sectionIndent} ${judgeIndent} ${detailIndent}${childPrefix} ${detail.children[k]}`,
              );
            }
          }
        }
      }
    }
  }

  return lines.join('\n');
};
