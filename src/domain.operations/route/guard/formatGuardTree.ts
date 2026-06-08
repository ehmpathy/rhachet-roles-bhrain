import type { RouteStoneGuardReviewPeerArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

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
    'index' | 'path' | 'blockers' | 'nitpicks'
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
    // derive verdict from rounds, budget, and blockers
    const verdict = computeReviewPeerVerdict({
      rounds,
      budget,
      blockers: review.artifact.blockers,
    });
    return { slug, level, rounds, budget, verdict, awaits: false };
  });
};

/**
 * .what = formats peer reviewer meters as tree lines
 * .why = shared format for reviews section in guard output and route.drive status
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

  for (let m = 0; m < input.meters.length; m++) {
    const meter = input.meters[m]!;
    const isLast = m === input.meters.length - 1;
    const prefix = isLast ? '└─' : '├─';
    const indent = isLast ? '   ' : '│  ';

    // find review artifact for this reviewer (if ran)
    const review = reviewBySlug.get(meter.slug);

    // format header: r${index}: slug (l${level}, ${rounds}/${budget}, ${verdict})
    const rNum = m + 1;
    const displayVerdict = meter.awaits ? 'awaits' : meter.verdict;
    const displayBudget = meter.budget === Infinity ? '∞' : meter.budget;
    const header = `r${rNum}: ${meter.slug} (l${meter.level}, ${meter.rounds}/${displayBudget}, ${displayVerdict})`;
    lines.push(`${baseIndent}${sectionIndent} ${prefix} ${header}`);

    // show details based on state
    if (meter.awaits) {
      lines.push(
        `${baseIndent}${sectionIndent} ${indent} └─ awaits l${meter.awaits.level}`,
      );
    } else if (meter.verdict === 'queued') {
      lines.push(`${baseIndent}${sectionIndent} ${indent} └─ awaits arrival`);
    } else if (meter.verdict === 'exhausted') {
      if (review) {
        lines.push(`${baseIndent}${sectionIndent} ${indent} ├─ exhausted`);
        lines.push(
          `${baseIndent}${sectionIndent} ${indent} └─ review: ${review.artifact.path}`,
        );
      } else {
        lines.push(`${baseIndent}${sectionIndent} ${indent} └─ exhausted`);
      }
    } else if (meter.verdict === 'rejected' || meter.verdict === 'approved') {
      if (review) {
        if (review.cached) {
          lines.push(`${baseIndent}${sectionIndent} ${indent} ├─ cached ✓`);
          lines.push(
            `${baseIndent}${sectionIndent} ${indent} └─ review: ${review.artifact.path}`,
          );
        } else {
          const detailLines: string[] = [];
          const dur =
            review.durationSec !== null
              ? `${review.durationSec.toFixed(1)}s`
              : '0.0s';
          const checkmark = meter.verdict === 'approved' ? ' ✓' : '';
          detailLines.push(`${meter.verdict} ${dur}${checkmark}`);
          detailLines.push(`review: ${review.artifact.path}`);
          if (review.artifact.blockers > 0) {
            const label =
              review.artifact.blockers === 1 ? 'blocker' : 'blockers';
            detailLines.push(`${review.artifact.blockers} ${label} 🔴`);
          }
          if (review.artifact.nitpicks > 0) {
            const label =
              review.artifact.nitpicks === 1 ? 'nitpick' : 'nitpicks';
            detailLines.push(`${review.artifact.nitpicks} ${label} 🟠`);
          }

          for (let d = 0; d < detailLines.length; d++) {
            const isDetailLast = d === detailLines.length - 1;
            const detailPrefix = isDetailLast ? '└─' : '├─';
            lines.push(
              `${baseIndent}${sectionIndent} ${indent} ${detailPrefix} ${detailLines[d]}`,
            );
          }
        }
      } else {
        lines.push(
          `${baseIndent}${sectionIndent} ${indent} └─ ${meter.verdict}`,
        );
      }
    } else {
      lines.push(`${baseIndent}${sectionIndent} ${indent} └─ ${meter.verdict}`);
    }
  }

  return lines;
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
