import type { IsoTimeStamp } from 'iso-time';

import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asConcessionReasonDisplay } from './guard/review/peer/asConcessionReasonDisplay';
import { asRungLabel } from './guard/review/peer/meter/asRungLabel';
import { getReviewPeerLadderStatus } from './guard/review/peer/meter/getReviewPeerLadderStatus';
import { getSelfReviewArticulationPath } from './guard/review/self/getSelfReviewArticulationPath';
import {
  computeBlockRemedyGroups,
  formatBlockRemedyGroups,
} from './guard/tree/formatBlockRemedyGroups';
import { formatGuardReviewLadderFooter } from './guard/tree/formatGuardReviewLadderFooter';
import {
  formatGuardTree,
  type GuardPeerMeterStatus,
} from './guard/tree/formatGuardTree';
import { formatHashbarRetired } from './guard/tree/formatHashbarRetired';
import { formatLetsReflect } from './guard/tree/formatLetsReflect';
import { formatNoAskOnRecord } from './guard/tree/formatNoAskOnRecord';
import { formatPatienceFriend } from './guard/tree/formatPatienceFriend';
import { formatSelfReviewGuide } from './guard/tree/formatSelfReviewGuide';
import { formatStaleArticulation } from './guard/tree/formatStaleArticulation';
import { formatWhatHaveYouSeen } from './guard/tree/formatWhatHaveYouSeen';
import { formatWhatsTheRush } from './guard/tree/formatWhatsTheRush';
import { formatWrongPath } from './guard/tree/formatWrongPath';

/**
 * .what = formats route stone operation output with good vibes
 * .why = provides consistent, readable cli output for the driver role
 */

const HEADER_GET = '🦉 and then?';
const HEADER_SET = `🦉 the way speaks for itself`;
const HEADER_DEL = `🦉 hoo needs 'em`;
const HEADER_ADD = `🦉 another stone on the path`;

/**
 * .what = reminder to continue the route after passage
 * .why = guides driver to next step without confusion
 */
const REMINDER_LINES = [
  '   │',
  '   └─ the way continues, run',
  '      └─ rhx route.drive',
];

type FormatInput =
  | {
      operation: 'route.stone.get';
      query: string;
      stones: { name: string; path: string }[];
      complete?: boolean;
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'approved';
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'overruled';
      /** the rung scoped to — a peer level, or JUDGE_LEVEL for the judge rung */
      level: number;
      /** the level that becomes ready once this level is overruled (if any) */
      readyLevel?: number | null;
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'forced';
      details: string;
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'rewound';
      cascade: Array<{
        stone: string;
        /**
         * 🔴 .what = what the rewind CLEARED. the word carries the whole claim: the triggers
         *            among these counts are ARCHIVED, never removed, so `deleted` reported an
         *            archive as a deletion and told a route author their ask was gone
         */
        cleared: string;
        yield: 'archived' | 'preserved' | 'absent';
        passage: string;
      }>;
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'blocked';
      reason: string;
      guidance: string;
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'promised';
      slug: string;
      route: string;
      progress: { index: number; total: number };
      nextReview?: {
        reviewSelf: RouteStoneGuardReviewSelf;
        index: number;
        total: number;
      };
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      /**
       * .note = ORDER IS THE CONTRACT. a path verdict outranks the haste cue, because a
       *         driver told to slow down when their file sits at the wrong path learns the
       *         wrong lesson and pays a round trip for the right one.
       * .note = `challenge:unasked` outranks even a path verdict. with no ask on record the
       *         driver's one move is the same whatever the path says — re-ask — and the ask's
       *         own emit then hands them the owed path.
       * .note = `challenge:first` is retired. its trigger — `attempts === 0` — is no longer
       *         a verdict on its own; it is one conjunct of the haste cue, which
       *         `challenge:rushed` names in full.
       */
      action:
        | 'challenge:unasked'
        | 'challenge:mismatch'
        | 'challenge:absent'
        | 'challenge:stale'
        | 'challenge:rushed';
      slug: string;
      route: string;
      articulationPath?: string;
      /** the path the driver declared via --into; present iff the verdict is a mismatch */
      declaredPath?: string;
      /** the artifact's mtime and the ask's mtime; present iff the verdict is stale */
      articulationMtime?: IsoTimeStamp;
      askedAt?: IsoTimeStamp;
      selfReview?: {
        reviewSelf: RouteStoneGuardReviewSelf;
        index: number;
        total: number;
      };
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'passed';
      passage: 'allowed' | 'overruled' | 'blocked' | 'malfunction';
      note?: string;
      reason?: string;
      slug?: string;
      route?: string;
      /**
       * .note = `selfReview` carries its OWN route, and it is required.
       *         the emit's outer `route` is optional, so a call site that set `selfReview`
       *         and omitted it printed `/review/self/…` — a path the guard does not read —
       *         while the guard checked `$route/review/self/…`. the type now refuses such a
       *         call site outright, rather than a silent fallback to an empty segment.
       */
      selfReview?: {
        reviewSelf: RouteStoneGuardReviewSelf;
        route: string;
        index: number;
        total: number;
      };
      /**
       * .what = every review.self on this stone that still sets the retired `hashbar:` key
       * .why = the key is ACCEPTED and read only to say so. a throw would halt a route on a
       *        key that was correct when it was written; silence would let the author carry
       *        a dead key into the next guard they author. one notice does neither.
       * .note = absent or empty renders no lines, so a route that never set it pays naught
       */
      hashbarFound?: { stone: string; slug: string }[];
      guard?: {
        artifactFiles: string[];
        reviews: Array<{
          index: number;
          cmd: string;
          cached: { hit: true; on: string[] } | false;
          durationSec: number | null;
          blockers: number;
          nitpicks: number;
          tallier: 'deterministic' | 'probabilistic' | null;
          path: string;
          exitClass: 'passed' | 'constraint' | 'malfunction';
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
      };
    }
  | {
      operation: 'route.stone.del';
      mode: 'plan' | 'apply';
      patterns: { glob: string; raw: string }[];
      route: string;
      stones: {
        name: string;
        status: 'delete' | 'retain' | 'deleted' | 'retained';
        reason: string | null;
      }[];
      countDelete: number;
      countRetain: number;
    }
  | {
      operation: 'route.stone.add';
      mode: 'plan' | 'apply';
      stone: string;
      route: string;
      source: string;
      content: string;
      path: string;
    };

/**
 * .what = formats operation output as tree structure
 * .why = enables human-readable cli feedback
 */
export const formatRouteStoneEmit = (input: FormatInput): string => {
  if (input.operation === 'route.stone.del') return formatDel(input);
  if (input.operation === 'route.stone.add') return formatAdd(input);

  const header =
    input.operation === 'route.stone.get' ? HEADER_GET : HEADER_SET;
  // .note = deliberate local line-builder. this emit fans out across ~15 heterogeneous branches
  //         (each operation/action/passage shape appends its own lines, several via nested forEach
  //         with early returns). a functional pipeline over such heterogeneous branches would be
  //         less legible and risk drift in the human-visible snapshots, so the mutation is kept but
  //         confined to this one function scope — the escape hatch rule.require.immutable-vars
  //         permits for a scoped line-builder.
  const lines: string[] = [header, ''];

  if (input.operation === 'route.stone.get') {
    lines.push(`🗿 ${input.operation}`);
    lines.push(`   ├─ query = ${input.query}`);

    if (input.complete) {
      lines.push(`   └─ status = all stones passed`);
    } else if (input.stones.length === 1) {
      const stone = input.stones[0]!;
      lines.push(`   └─ stone = ${stone.name} (${stone.path})`);
    } else {
      input.stones.forEach((stone, i) => {
        const isLast = i === input.stones.length - 1;
        lines.push(
          `   ${isLast ? '└─' : '├─'} stone = ${stone.name} (${stone.path})`,
        );
      });
    }
  }

  if (input.operation === 'route.stone.set') {
    // delegate to formatGuardTree for full guard tree output
    if (input.action === 'passed' && input.guard) {
      const tree = formatGuardTree({
        stone: input.stone,
        passage: input.passage,
        note: input.note ?? null,
        reason: input.reason ?? null,
        guard: input.guard,
        isLast: input.passage !== 'allowed' && input.passage !== 'overruled',
      });
      if (input.passage === 'allowed' || input.passage === 'overruled') {
        return [header, '', tree, ...REMINDER_LINES].join('\n');
      }
      // append the "path continues" footer at an upward unlock transition — a lower level
      // is terminal (INCLUDING by exhaustion) while a HIGHER level is now the live gate. the
      // footer self-gates on status.unlockTransition, so it stays silent for an all-terminal
      // halt (the halt's own options block guides instead) or a regression state
      // (rule.require.single-source-of-truth-for-render — derived from the same peerMeters).
      const ladderStatus = input.guard.peerMeters
        ? getReviewPeerLadderStatus({ peerMeters: input.guard.peerMeters })
        : null;
      const ladderFooter = ladderStatus
        ? formatGuardReviewLadderFooter({
            stone: input.stone,
            status: ladderStatus,
          })
        : [];
      return [
        header,
        '',
        tree,
        ...(ladderFooter.length > 0 ? ['', ...ladderFooter] : []),
      ].join('\n');
    }

    // handle review.self blocked case
    if (input.action === 'passed' && input.selfReview) {
      lines.push(`🗿 ${input.operation}`);
      lines.push(`   ├─ stone = ${input.stone}`);
      lines.push(
        `   └─ passage = blocked (${input.note ?? 'review.self required'})`,
      );
      lines.push('');
      lines.push(
        formatLetsReflect({
          stone: input.stone,
          slug: input.slug ?? input.selfReview.reviewSelf.slug,
          route: input.selfReview.route,
          reviewSelf: input.selfReview.reviewSelf,
          index: input.selfReview.index,
          total: input.selfReview.total,
        }),
      );

      // 🔴 .note = this emit names ONE review, deliberately. it carried a roster of every
      //    other unpromised slug until the fork was withdrawn, and the roster was the only
      //    surface that could name them — the route is sealed, so a driver cannot read the
      //    `.guard` file. ⇒ with no roster, slug N+1 is reachable only once slug N is
      //    promised, and THAT is the serial contract, enforced by construction rather than
      //    by a refusal branch.
      // 🟡 .why it was withdrawn = the roster invited a fork it could not serve. a forked
      //    lane got a slug and a path and no GUIDE — the guide renders at two call sites
      //    only, each for the one slug in hand, and there is no read-only retrieval command.
      //    so the lane's only move was to promise blind to provoke `challenge:absent`, which
      //    `rule.always.bear-every-self-review` forbids and which burns the attempt the haste
      //    cue reads. ⇒ an invitation no mechanism can serve is worse than no invitation
      // the retirement notice rides the ask, never a verdict.
      // .why = this is where a route author first meets the stone, so it reaches them once
      //        per stone rather than once per promise. it renders no lines when the key is
      //        absent, which is every guard in this repo
      const retirement = formatHashbarRetired({
        found: input.hashbarFound ?? [],
      });
      if (retirement.length > 0) lines.push('', ...retirement);

      return lines.join('\n');
    }

    // handle the precondition verdict — a promise arrived with no ask on record.
    // 🔴 it sits OUTSIDE the four-verdict guard below on purpose: that guard's shared tail is
    //    `formatSelfReviewGuide`, which names the owed path and the promise command — and a
    //    driver with no ask must not promise again, they must ask. so this verdict carries its
    //    own next step (`--as passed`) and takes no guide at all
    if (input.action === 'challenge:unasked')
      return [
        ...lines,
        ...formatNoAskOnRecord({ stone: input.stone, slug: input.slug }),
      ].join('\n');

    // handle the path verdict — the declared path is not the owed path.
    // .note = both operands are in hand here, so the emit renders a diff rather than an
    //         `absent` that names only where the guard looked
    // ⚠️ .note = these branches dispatch EXCLUSIVELY on `input.action`, so their order below
    //            is cosmetic and enforces no invariant. D5 — the path verdicts rank above the
    //            haste cue — is held solely by `getSelfReviewChallengeDecision`, which is the
    //            one operation that picks an action. do not read this sequence as a guarantee.
    // 🔴 the four verdicts are gathered under ONE guard, so the two things every one of
    //    them shares are derived once rather than four times. the union narrows here, and
    //    each inner test narrows again to its own operands
    if (
      input.action === 'challenge:mismatch' ||
      input.action === 'challenge:stale' ||
      input.action === 'challenge:absent' ||
      input.action === 'challenge:rushed'
    ) {
      // the path the guard checks. three verdicts derived this fallback verbatim, and the
      // OTHER member of this same path (the `rN` ordinal) was derived at three call sites
      // that disagreed — measured first-party this round. one derivation, one answer
      const owedPath =
        input.articulationPath ??
        getSelfReviewArticulationPath({
          route: input.route,
          stone: input.stone,
          slug: input.slug,
        });

      /**
       * .what = one challenge emit — the verdict's own lines, then the shared guide
       * .why = every self-review verdict ends the same way: the confrontation, a blank,
       *        and the guide that names the path and the command. four copies of that tail
       *        let a fifth verdict ship with no guide, and no test would name the omission
       *        (`rule.forbid.duplicate-format-tree-operations`)
       */
      const asChallengeEmit = (verdict: string[]): string =>
        [...lines, ...verdict, '', ...formatSelfReviewGuide(input)].join('\n');

      if (input.action === 'challenge:mismatch')
        return asChallengeEmit(
          formatWrongPath({ owed: owedPath, declared: input.declaredPath }),
        );

      // handle the freshness verdict — the file predates the ask
      if (input.action === 'challenge:stale')
        return asChallengeEmit(
          formatStaleArticulation({
            articulationPath: owedPath,
            articulationMtime: input.articulationMtime,
            askedAt: input.askedAt,
          }),
        );

      // handle the absence verdict — no file at the owed path
      if (input.action === 'challenge:absent')
        return asChallengeEmit([
          formatWhatHaveYouSeen({ articulationPath: owedPath }),
        ]);

      // handle the haste cue — LAST, and only after every path verdict has passed.
      // .note = this is the ONLY branch that renders a haste message. a path verdict
      //         renders its own confrontation and never this one, so a driver whose file
      //         sits at the wrong path is never told to slow down (the D5 invariant)
      return asChallengeEmit([
        formatWhatsTheRush(),
        '',
        formatPatienceFriend({
          stone: input.stone,
          slug: input.slug,
          route: input.route,
        }),
      ]);
    }

    // handle blocked case (agent tried to approve)
    if (input.action === 'blocked') {
      lines.push(`🗿 ${input.operation}`);
      lines.push(`   ├─ stone = ${input.stone}`);
      lines.push(`   ├─ ✗ ${input.reason}`);
      lines.push(`   │`);
      const guidanceLines = input.guidance.split('\n');
      guidanceLines.forEach((line, i) => {
        // .note = empty guidance lines emit a bare blank line (no prefix), so
        //         no whitespace tail leaks into the snapshot
        if (line === '') {
          lines.push('');
          return;
        }
        const prefix = i === 0 ? '   └─ ' : '      ';
        lines.push(`${prefix}${line}`);
      });
      return lines.join('\n');
    }

    lines.push(`🗿 ${input.operation}`);

    if (input.action === 'approved') {
      lines.push(`   ├─ stone = ${input.stone}`);
      lines.push(`   └─ ✓ approved`);
    } else if (input.action === 'overruled') {
      lines.push(`   ├─ stone = ${input.stone}`);
      lines.push(`   └─ ✓ overruled`);
      // name the rung scoped to, so the human sees what was waved through;
      // and the level that becomes ready to run as a result (if any). the judge is the top
      // rung (JUDGE_LEVEL) — asRungLabel renders it as "judge" rather than its sentinel number,
      // for BOTH the overruled rung and the ready rung (a ready judge must read "judge, ready",
      // never its raw sentinel — the two labels stay in lockstep via one transformer).
      const hasReady =
        input.readyLevel !== undefined && input.readyLevel !== null;
      const overruledConnector = hasReady ? '├─' : '└─';
      lines.push(
        `      ${overruledConnector} ${asRungLabel(input.level)}, overruled`,
      );
      if (hasReady) {
        lines.push(`      └─ ${asRungLabel(input.readyLevel!)}, ready`);
      }
    } else if (input.action === 'forced') {
      lines.push(`   ├─ stone = ${input.stone}`);
      lines.push(`   └─ ✓ forced`);
      const detailLines = input.details.split('\n');
      detailLines.forEach((line, i) => {
        const prefix = i === detailLines.length - 1 ? '      └─ ' : '      ├─ ';
        lines.push(`${prefix}${line}`);
      });
    } else if (input.action === 'rewound') {
      // format cascade with cleared counts and yield outcomes.
      // 🔴 the label is `cleared`, never `deleted`: the triggers inside these counts are
      //    ARCHIVED under `.archive/`, so `deleted` told a route author their ask was gone
      lines.push(`   ├─ stone = ${input.stone}`);
      lines.push(`   ├─ cascade`);
      input.cascade.forEach((c, i) => {
        const isLast = i === input.cascade.length - 1;
        const connector = isLast ? '└─' : '├─';
        const yieldPart = c.yield === 'archived' ? ', 1 yield' : '';
        lines.push(`   │  ${connector} ${c.stone}`);
        lines.push(
          `   │  ${isLast ? ' ' : '│'}  ├─ cleared: ${c.cleared}${yieldPart}`,
        );
        lines.push(`   │  ${isLast ? ' ' : '│'}  └─ passage: ${c.passage}`);
      });
      lines.push(`   └─ done`);
      return lines.join('\n');
    } else if (input.action === 'promised') {
      lines.push(`   ├─ stone = ${input.stone}`);
      // show progress per vision: "passage = progressed (review.self N/M promised)"
      lines.push(
        `   └─ passage = progressed (review.self ${input.progress.index}/${input.progress.total} promised)`,
      );

      // if there's a next review, show lets reflect section
      if (input.nextReview) {
        lines.push('');
        lines.push(
          formatLetsReflect({
            stone: input.stone,
            slug: input.nextReview.reviewSelf.slug,
            route: input.route,
            reviewSelf: input.nextReview.reviewSelf,
            index: input.nextReview.index,
            total: input.nextReview.total,
          }),
        );
      }

      return lines.join('\n');
    } else if (input.action === 'passed') {
      // format passage with optional note inline (passed without guard or selfReview)
      const passageValue = input.note
        ? `${input.passage} (${input.note})`
        : input.passage;

      // branch: blocked or malfunction with reason
      if (
        (input.passage === 'blocked' || input.passage === 'malfunction') &&
        input.reason
      ) {
        lines.push(`   ├─ stone = ${input.stone}`);
        lines.push(`   ├─ passage = ${passageValue}`);

        // detect budget exhaustion to add options hint
        const isBudgetExhausted = input.reason.includes('budget exhausted');
        const reasonConnector = isBudgetExhausted ? '├─' : '└─';

        // 🔴 a CONCESSION exhaustion carries a parseable marker in its reason, meant to be
        //    decoded rather than shown raw. this surface is the direct, synchronous CLI
        //    response to `--as passed` — the FIRST surface a driver meets — so a raw marker
        //    here is the one place the urgent warn most needs to land and, before this, did
        //    not (r011 blocker.1). the decode is ONE shared transformer every surface calls
        //    (rule.require.single-source-of-truth-for-render).
        const { reasonText, warnText } = asConcessionReasonDisplay({
          reason: input.reason,
        });
        lines.push(`   ${reasonConnector} reason = ${reasonText}`);
        // 🟡 the urgent warn names what the grade earns — more budget, for this stone
        //    (define.invariant.review.peer.budget.urgent-earns-budget). it must reach EVERY
        //    halt a driver sees, and this synchronous emit is the primary one.
        // 🔴 it states the EARNING and never the owner, because the two surfaces that render
        //    it disagree on who spends: the exhaustion gate's options block says `yours to
        //    spend` (the urgent grade is the driver's own warrant), while the judge halt says
        //    `ask your human` (`…judge.urgent-guides-the-budget-ask`). a warn that picked one
        //    owner would contradict whichever block it sat above — and it sits above both.
        // 🔴 nested under `reason`, never a peer of it — the warn explains WHY that reason
        //    is a human wait, so it is the reason's child, not a second top-level fact.
        //    `warnText` is only ever set for an urgent concession, which always carries the
        //    `budget exhausted` marker, so `reasonConnector` is always `├─` here — the `│`
        //    continuation below is the one this nest relies on.
        if (warnText) lines.push(`   │  └─ 🟡 ${warnText}`);

        if (isBudgetExhausted) {
          // add options as separate block with did you know header
          lines.push('');
          lines.push('✨ did you know?');
          // 🔴 the labels, the commands, the `budget exhausted:` parse and the single-slug
          //    `--peer` rule all come from ONE shared operation now. this surface used to
          //    carry its own copy of each, under a comment that promised it stayed "in
          //    lockstep" with formatGuardTree — a manual-discipline contract, which is what
          //    `rule.forbid.duplicate-format-tree-operations` forbids outright (r1 blocker.1,
          //    i016). the shared builder makes the lockstep structural rather than promised.
          lines.push(
            ...formatBlockRemedyGroups({
              groups: computeBlockRemedyGroups({
                stone: input.stone,
                passage: input.passage,
                reason: input.reason,
              }),
              baseIndent: '   ',
            }),
          );
        }
      }

      // branch: allowed or no reason
      if (
        !(
          (input.passage === 'blocked' || input.passage === 'malfunction') &&
          input.reason
        )
      ) {
        lines.push(`   ├─ stone = ${input.stone}`);
        const passageConnector = input.passage === 'allowed' ? '├─' : '└─';
        lines.push(`   ${passageConnector} passage = ${passageValue}`);
        if (input.passage === 'allowed') {
          lines.push(...REMINDER_LINES);
        }
      }
    }
  }

  return lines.join('\n');
};

/**
 * .what = formats del variant as treestruct with header
 * .why = enables scannable plan/apply output for stone deletion
 */
const formatDel = (input: {
  mode: 'plan' | 'apply';
  patterns: { glob: string; raw: string }[];
  route: string;
  stones: {
    name: string;
    status: 'delete' | 'retain' | 'deleted' | 'retained';
    reason: string | null;
  }[];
  countDelete: number;
  countRetain: number;
}): string => {
  // .note = deliberate local line-builder, confined to this scope (see formatRouteStoneEmit) —
  //         the escape hatch rule.require.immutable-vars permits for a scoped emit builder.
  const lines: string[] = [HEADER_DEL, ''];

  // operation line
  lines.push(`🗿 route.stone.del --mode ${input.mode}`);

  // pattern(s) section: single line for 1 pattern, branch for multiple
  if (input.patterns.length === 1) {
    const p = input.patterns[0]!;
    const patternSuffix = p.glob !== p.raw ? ` (from "${p.raw}")` : '';
    lines.push(`   ├─ pattern = ${p.glob}${patternSuffix}`);
  } else {
    lines.push(`   ├─ patterns`);
    input.patterns.forEach((p, i) => {
      const isLast = i === input.patterns.length - 1;
      const connector = isLast ? '└─' : '├─';
      const patternSuffix = p.glob !== p.raw ? ` (from "${p.raw}")` : '';
      lines.push(`   │  ${connector} ${p.glob}${patternSuffix}`);
    });
  }

  // route line
  lines.push(`   ├─ route   = ${input.route}`);

  // stones branch
  lines.push(`   ├─ stones`);
  input.stones.forEach((stone, i) => {
    const isLast = i === input.stones.length - 1;
    const icon =
      stone.status === 'delete' || stone.status === 'deleted' ? '✓' : '⊘';
    const reasonSuffix = stone.reason ? `, ${stone.reason}` : '';
    const connector = isLast ? '└─' : '├─';
    lines.push(
      `   │  ${connector} ${icon} ${stone.name} (${stone.status}${reasonSuffix})`,
    );
  });

  // summary counts
  const deleteLabel = input.mode === 'plan' ? 'delete' : 'deleted';
  const retainLabel = input.mode === 'plan' ? 'retain' : 'retained';

  if (input.countRetain > 0) {
    lines.push(`   ├─ ${deleteLabel} = ${input.countDelete}`);
    lines.push(`   └─ ${retainLabel} = ${input.countRetain} (artifact found)`);
  } else {
    lines.push(`   └─ ${deleteLabel} = ${input.countDelete}`);
  }

  // plan mode hint
  if (input.mode === 'plan') {
    lines.push('');
    lines.push('rerun with --mode apply to execute');
  }

  return lines.join('\n');
};

/**
 * .what = formats add variant as treestruct with header
 * .why = enables scannable plan/apply output for stone creation
 */
const formatAdd = (input: {
  mode: 'plan' | 'apply';
  stone: string;
  route: string;
  source: string;
  content: string;
  path: string;
}): string => {
  // .note = deliberate local line-builder, confined to this scope (see formatRouteStoneEmit) —
  //         the escape hatch rule.require.immutable-vars permits for a scoped emit builder.
  const lines: string[] = [HEADER_ADD, ''];

  // operation line
  lines.push(`🗿 route.stone.add --mode ${input.mode}`);
  lines.push(`   ├─ stone  = ${input.stone}`);
  lines.push(`   ├─ route  = ${input.route}`);

  if (input.mode === 'plan') {
    lines.push(`   ├─ source = ${input.source}`);
    lines.push(`   ├─ preview`);
    lines.push(`   │  ├─`);
    lines.push(`   │  │`);

    // indent content lines (trim end newlines to avoid double blanks)
    const contentLines = input.content.replace(/\n+$/, '').split('\n');
    contentLines.forEach((line) => {
      lines.push(`   │  │  ${line}`);
    });

    lines.push(`   │  │`);
    lines.push(`   │  └─`);
    lines.push(`   └─ ✋ created = false, rerun with --mode apply to execute`);
  }

  if (input.mode === 'apply') {
    lines.push(`   └─ created = ${input.path}`);
    lines.push(`      └─ the way continues, run \`rhx route.drive\``);
  }

  return lines.join('\n');
};
