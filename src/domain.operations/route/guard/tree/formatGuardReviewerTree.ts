import { asMeterCountDisplay } from '../asMeterCountDisplay';
import {
  getRouteGuardReviewPeerPathTaken,
  isRouteGuardReviewPeerGivenPath,
} from '../review/peer/getRouteGuardReviewPeerPathTaken';
import { TALLIED_FOOTER_PREFIX } from '../review/TALLIED_FOOTER_PREFIX';

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
 * .what = the one detail line for a concern count — reused for blockers AND nitpicks, so the
 *         two render identically but for their noun and glyph
 * .why = a raw count rendered alone reads as "the road still holds here", even at the exact
 *        moment a dispute above it already sheds it — a reader had to hold the disputed
 *        narrative line and this one in mind and do the subtraction themselves. the arithmetic
 *        now renders inline, only where a dispute has actually shed something — the common
 *        case (no dispute) is byte-identical to the extant render.
 */
const asConcernCountLine = (input: {
  count: { disputed: number; reported: number };
  noun: string;
  glyph: string;
}): string => {
  const { disputed, reported } = input.count;
  const plural = reported === 1 ? input.noun : `${input.noun}s`;

  if (disputed === 0)
    return reported > 0
      ? `${reported} ${plural} ${input.glyph}`
      : `0 ${plural} ✓`;

  const tallied = Math.max(0, reported - disputed);
  return `${reported} ${plural}, ${disputed} disputed → ${tallied} tallied ${tallied > 0 ? input.glyph : '✓'}`;
};

/**
 * .what = the one reassurance line every TERMINAL-for-unlock verdict carries
 * .why = single source of truth so the four terminal verdicts (exhausted, malfunction,
 *        constraint, and any future kind) stay in lockstep — the asymmetry this narrative
 *        was added to kill must not recur through a copy that one branch forgets to update.
 *        speaks only to the LADDER (higher levels unlock and run); passage may still block.
 */
const TERMINAL_UNLOCK_NARRATIVE = 'terminal — does not block higher levels';

/**
 * .what = the one forgiven-marker line an overruled reviewer carries, next to its raw verdict
 * .why = an overrule is a separate forgiveness flag, not a verdict — the raw verdict stays
 *        'rejected'/'malfunction'. without this line the reviewer reads like an un-forgiven
 *        rejection, the exact confusion the overrule-display fix removes. the `✓ overruled`
 *        glyph matches the overrule confirmation emit (formatRouteStoneEmit).
 */
export const OVERRULED_NARRATIVE = 'overruled ✓ — forgiven by human';

/**
 * .what = the one line a lane carries when a DISPUTE took it out of this generation's round
 * .why = the skip is otherwise invisible. the lane's cached artifact is re-emitted verbatim, so
 *        its verdict, counts, and `given:` all render exactly as a lane that ran — and a driver
 *        reads a stale rejection as a fresh one. `rule.require.status-feedback`: a mutation that
 *        does not report what changed is a blocker, and a lane that fell silent is a change.
 *
 * 🔴 it says `disputed`, never `exhausted`. the two look identical on the meter — a lane that did
 *    not run — and differ in every respect that matters: an exhaustion is the METER's verdict and
 *    a top-up reverses it; a dispute is the DRIVER's and no budget touches it (`case=4`, *"a
 *    distinct word"*). ⇒ to share a word here would sell a top-up that buys this lane naught.
 *
 * .note = the 🌙 is NOT a new claim. the glyph register already holds it for *"skipped — a review
 *         that never ran"* (`catalog.of=glyph.axis=halt`), which is this concept exactly — the
 *         same sense `exhausted` borrows it for at `:200`. one glyph, one concept; the WORD is
 *         what case=4 requires be distinct.
 */
export const DISPUTED_NARRATIVE =
  'disputed 🌙 — skipped this generation, no round spent';

/**
 * .what = the detail body a malfunction or constraint reviewer carries under its header
 * .why = the two states share every line but the leading state word; one body keeps them in
 *        lockstep (rule.forbid.duplicate-format-tree-operations)
 */
const asTerminalBrokenDetailLines = (input: {
  stateWord: string;
  reviewer: { skippedByDispute: boolean; overruled: boolean };
  path: string;
}): string[] => {
  const takenLine = asTakenDetailLine(input.path);
  return [
    input.stateWord,
    ...(input.reviewer.skippedByDispute ? [DISPUTED_NARRATIVE] : []),
    ...(input.reviewer.overruled ? [OVERRULED_NARRATIVE] : []),
    TERMINAL_UNLOCK_NARRATIVE,
    `given: ${input.path}`,
    ...(takenLine ? [takenLine] : []),
  ];
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
  /**
   * whether the human waved this reviewer's level through (overrule).
   * .why = an overrule forgives a level's raw verdict but leaves it intact — an overruled
   *        reviewer's verdict stays 'rejected'/'malfunction'. this flag adds the one forgiven
   *        marker line so the tree reads "rejected … but overruled ✓" instead of a bare,
   *        un-forgiven rejection. matches the `✓ overruled` glyph of the overrule confirmation.
   */
  overruled: boolean;
  /**
   * whether a DISPUTE took this lane out of this generation's round.
   *
   * .why = a flag beside `overruled`, never a seventh `ReviewPeerVerdict` — and the parallel is
   *        exact rather than convenient. both are DECLARED (a human overrules, a driver disputes)
   *        where every verdict is COMPUTED from counts and budget; both leave the raw verdict
   *        intact; and `case=4` `[t3]` has them compose — a forgive does not undo a skip, so a
   *        lane can carry both flags at once. a union member could not express that pair.
   *
   * 🔴 it means SKIPPED, never merely "has a dispute on record". a lane whose residual tally still
   *    clears the threshold RUNS with its disputes standing, and to render it as quiet would claim
   *    a skip that never happened (`runStoneGuardReviews:498-501` — the `holdsRoad` fork).
   */
  skippedByDispute: boolean;
  /** current state */
  state:
    | { type: 'inflight'; durationSec: number }
    | { type: 'awaits'; level: number }
    | { type: 'queued' }
    | {
        type: 'finished';
        verdict: 'approved' | 'rejected' | 'exhausted';
        durationSec: number | null;
        /**
         * a TREESTRUCTURED count — `disputed` beside `reported`, never a flat
         * `blockers` + `disputedBlockers` pair.
         *
         * .why = a flat pair reads as two unrelated numbers; a driver must already know
         *        "disputedBlockers is a SUBSET of blockers" to make sense of them side by
         *        side. nesting states the relation in the shape itself, and it makes the
         *        symmetry with `nitpicks` below visible at a glance — same two children,
         *        same order, on both. `reported` is the raw count this reviewer raised;
         *        `disputed` is how much of it this lane's own disputes have shed. defaults
         *        to `{ disputed: 0, reported: N }` at every producer with no stance corpus
         *        (review.by, a live-progress event, a derived-from-review fallback).
         */
        blockers: { disputed: number; reported: number };
        nitpicks: { disputed: number; reported: number };
        path: string;
        cached: boolean;
        /**
         * the PINNED brain that tallied the prose — drives the `tallied by reviewer@$brain`
         * branch: a slug shows the branch, null shows none (counts read verbatim). the
         * branch's presence IS the observability signal, and the slug is the pin the given's
         * footer recorded — never the versionless default, which moves when the pin moves
         */
        talliedBy: string | null;
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
 * .what = a reviewer's head — `r${index}: ${slug}`, plus the `(l${level}, ${rounds}/${budget})`
 *         meter suffix unless the caller hides it
 * .why = both densities lead with this head, so one render keeps the meter suffix from drift
 *        between the full and the compact row (rule.forbid.duplicate-format-tree-operations)
 */
const asReviewerHead = (input: {
  reviewer: ReviewerTreeState;
  hideMeter: boolean | undefined;
}): string => {
  const { reviewer } = input;
  const meterSuffix = input.hideMeter
    ? ''
    : ` (l${reviewer.level}, ${reviewer.rounds}/${asMeterCountDisplay(reviewer.budget)})`;
  return `r${reviewer.index}: ${reviewer.slug}${meterSuffix}`;
};

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
  /**
   * when true, the header omits the `(l${level}, ${rounds}/${budget})` meter suffix — so the
   * header reads just `r${index}: ${slug}`.
   * .why = a route peer reviewer has a level + a per-level budget, so the meter carries real
   *        weight. a review.by rubric has NEITHER (no route, no level, no budget), so the meter
   *        would be meaningless noise there. this flag lets review.by reuse this exact formatter
   *        (so its rows stay byte-conformed with peer reviews) yet omit the one field that does
   *        not apply. defaults to false, so every extant guard call is unchanged.
   */
  hideMeter?: boolean;
  /**
   * `full` (the default) renders the extant detail block — verdict, narratives, both counts,
   * tallier, given, taken. `compact` folds the verdict and both counts onto the header line,
   * and keeps one detail line: the `given:` path.
   *
   * .why = a summary surface (route.drive's latest-round block) lists every lane at once, where
   *        the full block costs six lines a lane and the round on a real stone holds a score of
   *        lanes. the compact row is the SAME state render, folded — so a verdict word, a count
   *        glyph, or a dispute marker cannot drift between the two surfaces
   *        (rule.forbid.duplicate-format-tree-operations)
   */
  density?: 'full' | 'compact';
}): string[] => {
  // compact density: one header line that carries the state, plus the given path beneath it
  if (input.density === 'compact') return formatGuardReviewerTreeCompact(input);

  // .note = deliberate local line-builder. this formatter branches per reviewer-state
  //         (inflight/awaits/queued/malfunction/constraint/finished), each with an early return, and
  //         the shared detail block is now built purely via formatDetailLines (returned + spread).
  //         the residual header push is a scoped local mutation the escape hatch in
  //         rule.require.immutable-vars permits for a line-builder; no array crosses a call boundary.
  const lines: string[] = [];
  const baseIndent = input.baseIndent ?? '';
  const { reviewer, isLast } = input;

  // format header: r${index}: slug (l${level}, ${rounds}/${budget}) — meter suffix optional
  const prefix = isLast ? '└─' : '├─';
  const indent = isLast ? '   ' : '│  ';
  const header = asReviewerHead({ reviewer, hideMeter: input.hideMeter });
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

  // terminal narrative: malfunction (the reviewer broke) and constraint (needs a fix or an
  // overrule) are TERMINAL-for-unlock (isReviewPeerVerdictTerminal), so like exhausted they
  // never hold the ladder — higher levels unlock and run. they DO block passage, but a driver
  // must not misread them as "the whole ladder is halted here". same reassurance line as
  // exhausted, for the same invariant. (D5)
  // .note = one shared detail body, keyed by its first state word alone, so a member added
  //         to it lands on both states at once (rule.forbid.duplicate-format-tree-operations)
  if (state.type === 'malfunction' || state.type === 'constraint')
    return [
      ...lines,
      ...formatDetailLines({
        baseIndent,
        indent,
        detailLines: asTerminalBrokenDetailLines({
          stateWord:
            state.type === 'malfunction' ? 'malfunction 💥' : 'constraint ✋',
          reviewer,
          path: state.path,
        }),
      }),
    ];

  // finished state: approved, rejected, or exhausted
  if (state.type === 'finished') {
    // .note = deliberate local line-builder, scoped to this branch — born here, grown by the
    //         commented pushes below (each one a conditional line with its own why), and only
    //         spread into the returned array. no array crosses a call boundary
    const detailLines: string[] = [];

    // verdict glyph: exhausted carries the 🌙 marker — an earned exhaustion, the level
    // spent its whole budget on genuine convergence effort and yields (see the driver
    // brief rule.always.converge-to-terminal). only exhausted gets a glyph here.
    const verdictGlyph = state.verdict === 'exhausted' ? ' 🌙' : '';

    // status line: verdict [duration] OR verdict, cached
    // 🔴 a disputed lane's verdict is its PRIOR one, re-emitted from cache — so the glance line
    //    names the dispute inline (r9 n3). without it a glide reads `rejected, cached` above
    //    `disputed 🌙 — skipped` as one lane that is both rejected AND disputed; the tail ties
    //    the two, so the reconciliation no longer waits on the narrative line beneath it.
    if (state.cached) {
      const disputeTail = reviewer.skippedByDispute
        ? ' — set aside by dispute'
        : '';
      detailLines.push(`${state.verdict}${verdictGlyph}, cached${disputeTail}`);
    } else {
      const dur =
        state.durationSec !== null ? ` ${state.durationSec.toFixed(1)}s` : '';
      detailLines.push(`${state.verdict}${verdictGlyph}${dur}`);
    }

    // quiet marker: a dispute took this lane out of the round, so the verdict above it is the
    // lane's PRIOR one, re-emitted from cache. it sits above the overrule line because it
    // explains why the verdict is STALE — and a reader must hold that before the forgiveness of
    // that verdict can mean aught.
    if (reviewer.skippedByDispute) detailLines.push(DISPUTED_NARRATIVE);

    // forgiven marker: the human overruled this level, so its raw verdict (often 'rejected') is
    // forgiven. the line sits right under the verdict so a reader never mistakes an overruled
    // level for a live rejection — the exact misread the overrule-display fix removes.
    if (reviewer.overruled) detailLines.push(OVERRULED_NARRATIVE);

    // exhaustion narrative: exhausted is TERMINAL, so it never blocks higher levels — they
    // unlock and run. a driver must never read `exhausted` as "you are blocked here"; this
    // line states plainly the level is done and does not hold the ladder. (D5)
    // .why = kills the "oh, it is all halted" misread at the exact spot it occurs. phrased
    //        to hold at ANY level: at a lower level the higher one runs (shown below in the
    //        tree); at the highest level there is no higher level to block, so it is still
    //        true. the cross-level "next level has engaged" callout — which names WHICH level
    //        is live + the re-drive command — is the aggregate `the path continues` footer,
    //        rendered once beneath the reviewers by formatGuardReviewLadderFooter.
    if (state.verdict === 'exhausted') {
      detailLines.push(TERMINAL_UNLOCK_NARRATIVE);
    }

    // blockers + nitpicks lines: one shared render, called twice — the symmetry between the
    // two counts is now visible in the CALL SITE, not just in the shape each one carries
    detailLines.push(
      asConcernCountLine({
        count: state.blockers,
        noun: 'blocker',
        glyph: '🔴',
      }),
    );
    detailLines.push(
      asConcernCountLine({
        count: state.nitpicks,
        noun: 'nitpick',
        glyph: '🟠',
      }),
    );

    // tallied-by line: ONLY when a sub-brain tallied the prose (probabilistic fallback).
    // .why = the deterministic path shows no branch (the silent common case), so the branch's
    //        presence is the whole signal — a human sees exactly when a count came from the
    //        fallback, and which PINNED brain tallied it. see rule.forbid.surprises.
    if (state.talliedBy !== null) {
      detailLines.push(`${TALLIED_FOOTER_PREFIX}${state.talliedBy}`);
    }

    // path line: always show
    detailLines.push(`given: ${state.path}`);

    // paired taken line: show the driver's response path next to the given (peer only)
    const takenLine = asTakenDetailLine(state.path);
    if (takenLine) detailLines.push(takenLine);

    // format detail lines with proper tree characters
    return [
      ...lines,
      ...formatDetailLines({ baseIndent, indent, detailLines }),
    ];
  }

  return lines;
};

/**
 * .what = the one-phrase state a compact row carries on its header
 * .why = the compact twin of the full detail block's first lines. each word and glyph is read
 *        from the same constants and the same count render the full block uses, so the two
 *        densities cannot name one state two ways
 */
const asReviewerStateSummary = (input: {
  reviewer: ReviewerTreeState;
}): string => {
  const { reviewer } = input;
  const state = reviewer.state;

  // the states that carry no counts name themselves in the words the full block uses
  if (state.type === 'inflight')
    return `⠋ inflight ${state.durationSec.toFixed(1)}s`;
  if (state.type === 'awaits') return `awaits l${state.level} terminal`;
  if (state.type === 'queued') return 'awaits arrival';

  // the declared markers ride at the tail, in the order the full block stacks them
  const markers = [
    ...(reviewer.skippedByDispute ? ['disputed 🌙'] : []),
    ...(reviewer.overruled ? ['overruled ✓'] : []),
  ];

  // a broken lane is named by its state word alone; it carries no tally by contract
  if (state.type === 'malfunction' || state.type === 'constraint')
    return [
      state.type === 'malfunction' ? 'malfunction 💥' : 'constraint ✋',
      ...markers,
    ].join(', ');

  // a finished lane: its verdict, then both counts through the one count render
  const verdictGlyph = state.verdict === 'exhausted' ? ' 🌙' : '';
  return [
    `${state.verdict}${verdictGlyph}${state.cached ? ', cached' : ''}`,
    asConcernCountLine({ count: state.blockers, noun: 'blocker', glyph: '🔴' }),
    asConcernCountLine({ count: state.nitpicks, noun: 'nitpick', glyph: '🟠' }),
    ...markers,
  ].join(', ');
};

/**
 * .what = the compact density of formatGuardReviewerTree — the state on the header, the given
 *         path as its one child
 * .why = see the `density` input. kept beside the full render so a change to either is read
 *        against the other
 */
const formatGuardReviewerTreeCompact = (input: {
  reviewer: ReviewerTreeState;
  isLast: boolean;
  baseIndent?: string;
  hideMeter?: boolean;
}): string[] => {
  const baseIndent = input.baseIndent ?? '';
  const { reviewer } = input;

  // header: r${index}: slug (meter) — state
  const prefix = input.isLast ? '└─' : '├─';
  const indent = input.isLast ? '   ' : '│  ';
  const summary = asReviewerStateSummary({ reviewer });
  const header = `${baseIndent}${prefix} ${asReviewerHead({ reviewer, hideMeter: input.hideMeter })} — ${summary}`;

  // the given path, where the lane spoke
  const state = reviewer.state;
  const path =
    state.type === 'finished' ||
    state.type === 'malfunction' ||
    state.type === 'constraint'
      ? state.path
      : '';
  if (!path) return [header];
  return [
    header,
    ...formatDetailLines({
      baseIndent,
      indent,
      detailLines: [`given: ${path}`],
    }),
  ];
};

/**
 * .what = formats detail lines under a reviewer header with tree characters
 * .why = shared formatter so finished/malfunction/constraint states render identically. returns
 *        the lines (does not mutate a caller's array) so callers compose via spread — no shared
 *        mutable state across branches (rule.require.immutable-vars).
 */
const formatDetailLines = (input: {
  baseIndent: string;
  indent: string;
  detailLines: string[];
}): string[] =>
  input.detailLines.map((detail, d) => {
    const isDetailLast = d === input.detailLines.length - 1;
    const detailPrefix = isDetailLast ? '└─' : '├─';
    return `${input.baseIndent}${input.indent} ${detailPrefix} ${detail}`;
  });
