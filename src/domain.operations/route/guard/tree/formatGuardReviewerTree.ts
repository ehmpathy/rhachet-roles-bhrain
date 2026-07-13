import { FIXED_FALLBACK_BRAIN } from '../../genReviewBrainSupply';
import { TALLIED_FOOTER_PREFIX } from '../review/getReviewTacticFromContent';
import {
  getRouteGuardReviewPeerPathTaken,
  isRouteGuardReviewPeerGivenPath,
} from '../review/peer/getRouteGuardReviewPeerPathTaken';

/**
 * .what = derives the paired `taken: <path>` detail line for a peer given path
 * .why = each peer reviewer shows BOTH sides of the conversation — the given it
 *        wrote next to the taken the driver must write; self-review paths carry
 *        no given infix, so they get no taken line (returns null)
 */
const asTakenDetailLine = (pathGiven: string): string | null => {
  if (!isRouteGuardReviewPeerGivenPath({ pathGiven })) return null;
  return `taken: ${getRouteGuardReviewPeerPathTaken({ pathGiven })}`;
};

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
        /**
         * which tallier produced the tally — drives the `tallied by reviewer@$brain` branch:
         * 'probabilistic' shows the branch (a sub-brain tallied the prose), 'deterministic'
         * shows none (counts read verbatim). the branch's presence IS the observability signal.
         */
        tallier: 'deterministic' | 'probabilistic';
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
 *       └─ given: .route/...
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
    const detailLines = ['💥 malfunction', `given: ${state.path}`];
    const takenLine = asTakenDetailLine(state.path);
    if (takenLine) detailLines.push(takenLine);
    emitDetailLines({ lines, baseIndent, indent, detailLines });
    return lines;
  }

  if (state.type === 'constraint') {
    const detailLines = ['✋ constraint', `given: ${state.path}`];
    const takenLine = asTakenDetailLine(state.path);
    if (takenLine) detailLines.push(takenLine);
    emitDetailLines({ lines, baseIndent, indent, detailLines });
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

    // tallied-by line: ONLY when a sub-brain tallied the prose (probabilistic fallback).
    // .why = the deterministic path shows no branch (the silent common case), so the branch's
    //        presence is the whole signal — a human sees exactly when a count came from the
    //        fallback, and which brain tallied it. see rule.forbid.surprises.
    if (state.tallier === 'probabilistic') {
      detailLines.push(`${TALLIED_FOOTER_PREFIX}${FIXED_FALLBACK_BRAIN}`);
    }

    // path line: always show
    detailLines.push(`given: ${state.path}`);

    // paired taken line: show the driver's response path next to the given (peer only)
    const takenLine = asTakenDetailLine(state.path);
    if (takenLine) detailLines.push(takenLine);

    // emit detail lines with proper tree characters
    emitDetailLines({ lines, baseIndent, indent, detailLines });

    return lines;
  }

  return lines;
};

/**
 * .what = appends detail lines under a reviewer header with tree characters
 * .why = shared emit so finished/malfunction/constraint states render identically
 */
const emitDetailLines = (input: {
  lines: string[];
  baseIndent: string;
  indent: string;
  detailLines: string[];
}): void => {
  for (let d = 0; d < input.detailLines.length; d++) {
    const isDetailLast = d === input.detailLines.length - 1;
    const detailPrefix = isDetailLast ? '└─' : '├─';
    input.lines.push(
      `${input.baseIndent}${input.indent} ${detailPrefix} ${input.detailLines[d]}`,
    );
  }
};
