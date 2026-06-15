import type { ReviewPeerVerdict } from './reviewPeerMeter/computeReviewPeerVerdict';

/**
 * .what = reviewer state for tree format
 * .why = single shape for both inflight progress and final result contexts
 */
export interface ReviewerTreeState {
  /** reviewer index (1-based for display) */
  index: number;
  /** reviewer slug (e.g., "self/reflect") */
  slug: string;
  /** review level (1, 2, 3...) */
  level: number;
  /** rounds used so far */
  rounds: number;
  /** budget limit (Infinity for unlimited) */
  budget: number;
  /** current state */
  state:
    | { type: 'inflight'; durationSec: number }
    | { type: 'awaits'; level: number }
    | { type: 'queued' }
    | {
        type: 'finished';
        verdict: 'approved' | 'rejected' | 'exhausted';
        durationSec: number | null;
        blockers: number;
        nitpicks: number;
        path: string;
        cached: boolean;
      }
    | {
        type: 'malfunction';
        path: string;
      }
    | {
        type: 'constraint';
        path: string;
      };
}

/**
 * .what = formats a single reviewer as tree lines
 * .why = shared format for inflight progress and final result contexts
 *
 * emits consistent 4-line tree:
 *   r1: self/reflect (l1, 1/∞)
 *       ├─ approved 8.2s
 *       ├─ ✔️ 0 blockers
 *       ├─ 🟠 2 nitpicks
 *       └─ review: .route/...
 */
export const formatGuardReviewerTree = (input: {
  reviewer: ReviewerTreeState;
  isLast: boolean;
  /** base indent for all lines */
  baseIndent?: string;
}): string[] => {
  const lines: string[] = [];
  const baseIndent = input.baseIndent ?? '';
  const { reviewer, isLast } = input;

  // format header: r${index}: slug (l${level}, ${rounds}/${budget})
  const prefix = isLast ? '└─' : '├─';
  const indent = isLast ? '   ' : '│  ';
  const displayBudget = reviewer.budget === Infinity ? '∞' : reviewer.budget;
  const header = `r${reviewer.index}: ${reviewer.slug} (l${reviewer.level}, ${reviewer.rounds}/${displayBudget})`;
  lines.push(`${baseIndent}${prefix} ${header}`);

  // format state-specific content
  const state = reviewer.state;

  if (state.type === 'inflight') {
    const dur = state.durationSec.toFixed(1);
    lines.push(`${baseIndent}${indent} └─ ⠋ inflight ${dur}s`);
    return lines;
  }

  if (state.type === 'awaits') {
    lines.push(`${baseIndent}${indent} └─ awaits l${state.level} terminal`);
    return lines;
  }

  if (state.type === 'queued') {
    lines.push(`${baseIndent}${indent} └─ awaits arrival`);
    return lines;
  }

  if (state.type === 'malfunction') {
    lines.push(`${baseIndent}${indent} ├─ 💥 malfunction`);
    lines.push(`${baseIndent}${indent} └─ review: ${state.path}`);
    return lines;
  }

  if (state.type === 'constraint') {
    lines.push(`${baseIndent}${indent} ├─ ✋ constraint`);
    lines.push(`${baseIndent}${indent} └─ review: ${state.path}`);
    return lines;
  }

  // finished state: approved, rejected, or exhausted
  if (state.type === 'finished') {
    const detailLines: string[] = [];

    // status line: verdict [duration] OR verdict, cached
    if (state.cached) {
      detailLines.push(`${state.verdict}, cached`);
    } else {
      const dur =
        state.durationSec !== null ? ` ${state.durationSec.toFixed(1)}s` : '';
      detailLines.push(`${state.verdict}${dur}`);
    }

    // blockers line: always show
    const blockersLabel = state.blockers === 1 ? 'blocker' : 'blockers';
    if (state.blockers > 0) {
      detailLines.push(`${state.blockers} ${blockersLabel} 🔴`);
    } else {
      detailLines.push(`0 ${blockersLabel} ✓`);
    }

    // nitpicks line: always show
    const nitpicksLabel = state.nitpicks === 1 ? 'nitpick' : 'nitpicks';
    if (state.nitpicks > 0) {
      detailLines.push(`${state.nitpicks} ${nitpicksLabel} 🟠`);
    } else {
      detailLines.push(`0 ${nitpicksLabel} ✓`);
    }

    // path line: always show
    detailLines.push(`review: ${state.path}`);

    // emit detail lines with proper tree characters
    for (let d = 0; d < detailLines.length; d++) {
      const isDetailLast = d === detailLines.length - 1;
      const detailPrefix = isDetailLast ? '└─' : '├─';
      lines.push(`${baseIndent}${indent} ${detailPrefix} ${detailLines[d]}`);
    }

    return lines;
  }

  return lines;
};

/**
 * .what = computes per-reviewer verdict with judge thresholds
 * .why = same thresholds as guard's judge, applied to each reviewer
 */
export const computeReviewerVerdict = (input: {
  blockers: number;
  nitpicks: number;
  rounds: number;
  budget: number;
  allowBlockers: number;
  allowNitpicks: number;
}): ReviewPeerVerdict => {
  // check if budget exhausted
  if (input.rounds >= input.budget && input.budget !== Infinity) {
    return 'exhausted';
  }

  // check thresholds (same logic as guard's reviewed? judge)
  const passesBlockers = input.blockers <= input.allowBlockers;
  const passesNitpicks = input.nitpicks <= input.allowNitpicks;

  if (passesBlockers && passesNitpicks) {
    return 'approved';
  }

  return 'rejected';
};
