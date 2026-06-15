import type { RouteStoneGuardReviewPeerArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import {
  formatGuardReviewerTree,
  type ReviewerTreeState,
} from './formatGuardReviewerTree';
import {
  computeReviewPeerVerdict,
  type ReviewPeerVerdict,
} from './reviewPeerMeter/computeReviewPeerVerdict';

/**
 * .what = peer reviewer meter status for display
 * .why = displays budget/level/verdict in guard output
 */
export interface GuardPeerMeterStatus {
  slug: string;
  level: number;
  rounds: number;
  budget: number;
  verdict: ReviewPeerVerdict;
  awaits: { level: number } | false;
  blockers: number;
  nitpicks: number;
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
    'index' | 'path' | 'blockers' | 'nitpicks' | 'exitClass'
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
 * .what = derives peerMeters from reviews when not explicitly provided
 * .why = all reviews are metered - when explicit meters absent, use defaults
 *
 * .note = uses default thresholds (0, 0) since guard judges not available here
 */
const deriveMetersFromReviews = (
  reviews: RouteFormatTreeGuardReviewRecord[],
): GuardPeerMeterStatus[] => {
  return reviews.map((review) => {
    // use peer info if available, else derive from cmd
    const slug =
      review.peer?.slug ??
      review.cmd.split(/\s+/)[0] ??
      `r${review.artifact.index}`;
    const level = review.peer?.level ?? 1;
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
      slug,
      level,
      rounds,
      budget,
      verdict,
      awaits: false,
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
}): string[] => {
  const lines: string[] = [];
  const baseIndent = input.baseIndent ?? '';
  const sectionIndent = input.sectionIndent ?? '   ';

  if (input.includeHeader !== false) {
    const headerPrefix = input.headerPrefix ?? '├─';
    const headerText = input.headerText ?? 'reviews';
    const separator = headerPrefix ? ' ' : '';
    lines.push(`${baseIndent}${headerPrefix}${separator}${headerText}`);
  }

  // create lookup of review inputs by slug
  const reviewBySlug = new Map<string, RouteFormatTreeGuardReviewRecord>();
  if (input.reviews) {
    for (const review of input.reviews) {
      const slug =
        review.peer?.slug ??
        review.cmd.split(/\s+/)[0] ??
        `r${review.artifact.index}`;
      reviewBySlug.set(slug, review);
    }
  }

  // convert each meter to ReviewerTreeState and format via shared formatter
  for (let m = 0; m < input.meters.length; m++) {
    const meter = input.meters[m]!;
    const isLast = m === input.meters.length - 1;
    const review = reviewBySlug.get(meter.slug);

    // convert meter + review to ReviewerTreeState
    const state = asReviewerTreeStateFromMeter({
      meter,
      review,
      index: m + 1,
    });

    // format via shared formatter
    const reviewerLines = formatGuardReviewerTree({
      reviewer: state,
      isLast,
      baseIndent: `${baseIndent}${sectionIndent} `,
    });
    lines.push(...reviewerLines);
  }

  return lines;
};

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

  // awaits state
  if (meter.awaits) {
    return {
      index,
      slug: meter.slug,
      level: meter.level,
      rounds: meter.rounds,
      budget: meter.budget,
      state: { type: 'awaits', level: meter.awaits.level },
    };
  }

  // queued state
  if (meter.verdict === 'queued') {
    return {
      index,
      slug: meter.slug,
      level: meter.level,
      rounds: meter.rounds,
      budget: meter.budget,
      state: { type: 'queued' },
    };
  }

  // malfunction state
  if (meter.verdict === 'malfunction') {
    const path = review?.artifact.path ?? meter.path ?? '';
    return {
      index,
      slug: meter.slug,
      level: meter.level,
      rounds: meter.rounds,
      budget: meter.budget,
      state: { type: 'malfunction', path },
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

  return {
    index,
    slug: meter.slug,
    level: meter.level,
    rounds: meter.rounds,
    budget: meter.budget,
    state: {
      type: 'finished',
      verdict: meter.verdict as 'approved' | 'rejected' | 'exhausted',
      durationSec,
      blockers,
      nitpicks,
      path,
      cached,
    },
  };
};

/**
 * .what = formats guard results as a tree string with box-draw characters
 * .why = enables human-readable cli output for guard execution results
 */
export const formatGuardTree = (input: {
  stone: string;
  passage: 'allowed' | 'blocked' | 'malfunction';
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
    }>;
    peerMeters?: GuardPeerMeterStatus[];
  } | null;
  /**
   * .what = whether guard is the last item in the tree
   * .why = determines box-draw connector (└─ vs ├─) and inner indent
   */
  isLast?: boolean;
}): string => {
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
      input.reason
    ) {
      lines.push(`   ├─ passage = ${passageLabel}`);

      // detect budget exhaustion to add options hint
      const isBudgetExhausted = input.reason.includes('budget exhausted');
      const reasonConnector = isBudgetExhausted ? '├─' : '└─';
      lines.push(`   ${reasonConnector} reason = ${input.reason}`);

      if (isBudgetExhausted) {
        // extract exhausted peer slugs from reason (format: "budget exhausted: slug1, slug2")
        const exhaustedMatch = input.reason.match(/budget exhausted:\s*(.+)/);
        const exhaustedSlugs = exhaustedMatch
          ? exhaustedMatch[1]!.split(',').map((s) => s.trim())
          : [];
        const peerArg =
          exhaustedSlugs.length === 1
            ? ` --peer ${exhaustedSlugs[0]}`
            : exhaustedSlugs.length > 1
              ? '' // multiple peers: omit --peer to affect all
              : '';

        lines.push(`   └─ options`);
        lines.push(`      ├─ increase budget`);
        lines.push(
          `      │  └─ rhx route.guard.budget --for review --add N${peerArg} --stone ${input.stone}`,
        );
        lines.push(`      └─ approve as-is`);
        lines.push(
          `         └─ rhx route.stone.set --stone ${input.stone} --as approved`,
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
    input.reason
  ) {
    lines.push(`   ├─ reason = ${input.reason}`);

    // add options hint for budget exhaustion case
    if (input.reason.includes('budget exhausted')) {
      // extract exhausted peer slugs from reason (format: "budget exhausted: slug1, slug2")
      const exhaustedMatch = input.reason.match(/budget exhausted:\s*(.+)/);
      const exhaustedSlugs = exhaustedMatch
        ? exhaustedMatch[1]!.split(',').map((s) => s.trim())
        : [];
      const peerArg =
        exhaustedSlugs.length === 1
          ? ` --peer ${exhaustedSlugs[0]}`
          : exhaustedSlugs.length > 1
            ? '' // multiple peers: omit --peer to affect all
            : '';

      lines.push(`   ├─ options`);
      lines.push(`   │  ├─ increase budget`);
      lines.push(
        `   │  │  └─ rhx route.guard.budget --for review --add N${peerArg} --stone ${input.stone}`,
      );
      lines.push(`   │  └─ approve as-is`);
      lines.push(
        `   │     └─ rhx route.stone.set --stone ${input.stone} --as approved`,
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
  const sections: Array<{
    type: 'artifacts' | 'reviews' | 'judges';
  }> = [];
  sections.push({ type: 'artifacts' });
  // show reviews section if we have any peer reviewers (meters) or ran reviews
  if (hasReviews || hasPeerMeters) sections.push({ type: 'reviews' });
  if (hasJudges) sections.push({ type: 'judges' });

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
          const detailLines: string[] = [];
          const dur =
            judge.durationSec !== null
              ? `${judge.durationSec.toFixed(1)}s`
              : '0.0s';
          const mark = judge.passed ? '✓' : '✗';
          detailLines.push(`finished ${dur} ${mark}`);
          if (!judge.passed && judge.reason) {
            detailLines.push(`reason: ${judge.reason}`);
          }

          for (let d = 0; d < detailLines.length; d++) {
            const isDetailLast = d === detailLines.length - 1;
            const detailPrefix = isDetailLast ? '└─' : '├─';
            lines.push(
              `${guardIndent}${sectionIndent} ${judgeIndent} ${detailPrefix} ${detailLines[d]}`,
            );
          }
        }
      }
    }
  }

  return lines.join('\n');
};
