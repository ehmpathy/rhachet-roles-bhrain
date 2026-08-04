import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';
import { getGitRepoRoot } from 'rhachet-artifact-git';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import type { GuardProgressEvent } from '@src/domain.objects/Driver/GuardProgressEvent';
import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import {
  getGuardPeerReviews,
  getGuardSelfReviews,
  getReviewPeerRunCmd,
} from '@src/domain.objects/Driver/RouteStoneGuard';
import type { RouteStoneGuardJudgeArtifact } from '@src/domain.objects/Driver/RouteStoneGuardJudgeArtifact';
import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import type { ContextReviewBrainSupply } from '@src/domain.operations/route/genReviewBrainSupply';

import { computeRouteBouncerCache } from '../bouncer/computeRouteBouncerCache';
import { setRouteBouncerCache } from '../bouncer/setRouteBouncerCache';
import { delStoneGuardBlockerReport } from '../drive/delStoneGuardBlockerReport';
import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { getAllStoneGuardArtifactsByHash } from '../guard/artifact/getAllStoneGuardArtifactsByHash';
import { getMaxStoneGuardIteration } from '../guard/artifact/getMaxStoneGuardIteration';
import { computeStoneReviewInputHash } from '../guard/review/computeStoneReviewInputHash';
import { asRouteGuardReviewPeerSlugList } from '../guard/review/peer/asRouteGuardReviewPeerSlugList';
import { getRouteGuardReviewPeerContemplationStatus } from '../guard/review/peer/getRouteGuardReviewPeerContemplationStatus';
import { getStoneGuardReviewPeerUncontemplatedUnforgiven } from '../guard/review/peer/getStoneGuardReviewPeerUncontemplatedUnforgiven';
import { getAllReviewPeerMeterStatuses } from '../guard/review/peer/meter/getAllReviewPeerMeterStatuses';
import { getExhaustedReviewerSlugs } from '../guard/review/peer/meter/getExhaustedReviewerSlugs';
import { getReviewLevelByIndex } from '../guard/review/peer/meter/getReviewLevelByIndex';
import { isEveryReviewLevelTerminal } from '../guard/review/peer/meter/isEveryReviewLevelTerminal';
import { isLevelOverruled } from '../guard/review/peer/meter/isLevelOverruled';
import { JUDGE_LEVEL } from '../guard/review/peer/meter/JUDGE_LEVEL';
import { runStoneGuardReviews } from '../guard/review/runStoneGuardReviews';
import { getStonePromises } from '../guard/review/self/getStonePromises';
import { setSelfReviewTriggeredReport } from '../guard/review/self/setSelfReviewTriggeredReport';
import { setStoneGuardStamp } from '../guard/stamp/setStoneGuardStamp';
import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';
import { formatRouteGuardReviewPeerContemplatePrompt } from '../guard/tree/formatRouteGuardReviewPeerContemplatePrompt';
import { getStoneGuardOverruledLevels } from '../judges/getStoneGuardOverruledLevels';
import { runStoneGuardJudges } from '../judges/runStoneGuardJudges';
import { getOnePassageReport } from '../passage/getOnePassageReport';
import { setPassageReport } from '../passage/setPassageReport';
import { findOneStoneByPattern } from './asStoneGlob';
import { delBlockedTriggeredReport } from './blocked/delBlockedTriggeredReport';
import { genStoneGuardBlockedEmit } from './genStoneGuardBlockedEmit';
import { getAllStoneArtifacts } from './getAllStoneArtifacts';
import { getAllStones } from './getAllStones';
import { setStonePassage } from './setStonePassage';

/**
 * .what = renders one artifact (review or judge) as a stderr tree bucket
 * .why = the exhaustion, malfunction, constraint, and failed-judge branches each read an
 *        artifact file and indent it under a `<emoji> <label> N` header, with a one-line
 *        fallback when the file cannot be read. five near-verbatim copies had drifted apart;
 *        one shared transformer single-sources the shape
 *        (rule.require.single-source-of-truth-for-render, rule.prefer.wet-over-dry).
 * .note = fallback = null emits no fallback line (the failed-judge branch, where a judge with
 *         no reason contributes only its header).
 */
const formatArtifactStderrBlock = async (input: {
  emoji: string;
  label: string;
  index: number;
  path: string;
  fallback: string | null;
}): Promise<string[]> => {
  const header = `${input.emoji} ${input.label} ${input.index}`;

  // read the artifact and indent each line under the header
  try {
    const content = await fs.readFile(input.path, 'utf-8');
    return [header, ...content.split('\n').map((line) => `   ${line}`)];
  } catch (error) {
    // graceful fallback for display: file may not exist or be unreadable
    const isExpected =
      error instanceof Error &&
      (error.message.includes('ENOENT') || error.message.includes('EACCES'));
    if (!isExpected) throw error;
    return input.fallback !== null
      ? [header, `   └─ ${input.fallback}`]
      : [header];
  }
};

/**
 * .what = joins per-artifact stderr blocks into one string, a blank line between each block
 * .why = every blocked-passage branch (exhaustion, malfunction, constraint, failed-judges) renders
 *        the same "one block per artifact, blank-line separated" shape. one builder keeps them
 *        identical and expresses the join functionally, so no branch mutates a local array in place
 *        (rule.require.immutable-vars). returns undefined when empty so the caller omits stderr.
 */
const joinArtifactStderrBlocks = (blocks: string[][]): string | undefined =>
  blocks.length === 0
    ? undefined
    : blocks
        .flatMap((block, i) => (i === 0 ? block : ['', ...block]))
        .join('\n');

/**
 * .what = attempts to mark a stone as passed after guard validation
 * .why = enables robots to complete milestones with guard verification
 */
export const setStoneAsPassed = async (
  input: {
    stone: string;
    route: string;
  },
  context: ContextCliEmit & ContextReviewBrainSupply,
): Promise<{
  passed: boolean;
  refs: { reviews: string[]; judges: string[] };
  emit: { stdout: string; stderr?: string } | null;
}> => {
  // find the stone
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findOneStoneByPattern({
    stones,
    pattern: input.stone,
  });
  if (!stoneMatched) {
    throw new BadRequestError('stone not found', { stone: input.stone });
  }

  // lookup git root for path relativization
  // .why = paths in output should be relative to git root (e.g., .behavior/v.../...), not route
  let gitRoot: string;
  try {
    gitRoot = await getGitRepoRoot({ from: input.route });
  } catch {
    gitRoot = process.cwd();
  }

  // check artifact found
  const artifactFiles = await getAllStoneArtifacts({
    stone: stoneMatched,
    route: input.route,
  });
  if (artifactFiles.length === 0) {
    throw new BadRequestError(
      `artifact not found; run route.stone.get --stone ${stoneMatched.name} --say to see instructions`,
      { stone: stoneMatched.name },
    );
  }

  // if no guard, auto-pass
  if (!stoneMatched.guard) {
    await setStonePassage({ stone: stoneMatched, route: input.route });

    // clear blocked triggers for this stone and all earlier stones
    await clearBlockedTriggersUpTo({
      stone: stoneMatched,
      stones,
      route: input.route,
    });

    // update bouncer cache (stone passage may release protected artifacts)
    const bouncerCache = await computeRouteBouncerCache({
      cwd: process.cwd(),
      route: input.route,
    });
    await setRouteBouncerCache({ cache: bouncerCache, route: input.route });

    return {
      passed: true,
      refs: { reviews: [], judges: [] },
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'allowed',
          note: 'unguarded',
        }),
      },
    };
  }

  // on ENTRY to the guard's reviews — BEFORE any review runs — record 'arrived'
  // .why = rule.require.forward-motion-clears-blocker: a --as arrived/passed is forward
  //        motion, so a stale escalation halt must clear AT ONCE, not after the (slow)
  //        peer reviews finish. the latest entry wins, so this in-flight 'arrived'
  //        (disposition push) supersedes a prior blocked at guard entry — the statusline
  //        reads the current phase, not a stale halt, for the whole inflight window.
  await setPassageReport({
    report: new PassageReport({
      stone: stoneMatched.name,
      status: 'arrived',
      reason: 'entered guard reviews',
    }),
    route: input.route,
  });

  // check for review.selfs (must be promised before peer reviews)
  const selfReviews = getGuardSelfReviews(stoneMatched.guard);
  if (selfReviews.length > 0) {
    // compute hash for triggered report
    const promiseHash = await computeStoneReviewInputHash({
      stone: stoneMatched,
      route: input.route,
    });

    // get all promises (hashless — firm checkpoints)
    const promises = await getStonePromises({
      stone: stoneMatched,
      route: input.route,
    });
    const promisedSlugs = new Set(promises.map((p) => p.slug));

    // find first unpromised review.self
    const unpromised = selfReviews.filter((r) => !promisedSlugs.has(r.slug));
    if (unpromised.length > 0) {
      const nextReview = unpromised[0]!;
      const nextIndex = selfReviews.findIndex(
        (r) => r.slug === nextReview.slug,
      );

      // record that self-review was triggered (for time enforcement only)
      // note: sinceOnly prevents .uptil creation, which would trigger rush on first promise
      await setSelfReviewTriggeredReport(
        {
          stone: stoneMatched.name,
          slug: nextReview.slug,
          hash: promiseHash,
          route: input.route,
        },
        { sinceOnly: true },
      );

      // blocked on review.self — persist + return via the shared blocked tail
      // .note = raw emit (no stamp): peer reviews have not run at this point
      return genStoneGuardBlockedEmit({
        stone: stoneMatched.name,
        route: input.route,
        blocker: 'review.self',
        reason: `review.self required: ${nextReview.slug}`,
        refs: { reviews: [], judges: [] },
        emit: {
          stdout: formatRouteStoneEmit({
            operation: 'route.stone.set',
            stone: stoneMatched.name,
            action: 'passed',
            passage: 'blocked',
            note: 'review.self required',
            selfReview: {
              reviewSelf: nextReview,
              index: nextIndex + 1,
              total: selfReviews.length,
            },
          }),
        },
      });
    }
  }

  // if guard has no reviews and no judges, auto-pass (guard only customizes artifact detection)
  const peerReviews = getGuardPeerReviews(stoneMatched.guard);
  if (peerReviews.length === 0 && stoneMatched.guard.judges.length === 0) {
    await setStonePassage({ stone: stoneMatched, route: input.route });

    // clear blocked triggers for this stone and all earlier stones
    await clearBlockedTriggersUpTo({
      stone: stoneMatched,
      stones,
      route: input.route,
    });

    // update bouncer cache (stone passage may release protected artifacts)
    const bouncerCache = await computeRouteBouncerCache({
      cwd: process.cwd(),
      route: input.route,
    });
    await setRouteBouncerCache({ cache: bouncerCache, route: input.route });

    return {
      passed: true,
      refs: { reviews: [], judges: [] },
      emit: {
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'allowed',
          note: 'artifacts only',
        }),
      },
    };
  }

  // if guard has reviews but no judges, that's an error
  if (peerReviews.length > 0 && stoneMatched.guard.judges.length === 0) {
    throw new BadRequestError('guard has reviews but no judges', {
      stone: stoneMatched.name,
      guard: stoneMatched.guard.path,
    });
  }

  // stamp the guard report next to the stone when peer reviews ran
  // .why = persists the latest border-gate result so folks can review it without a guard re-run (per wish)
  // .note = stamps only when peer reviews ran; judges-only guards leave no stamp
  // .note = passes the emit through unchanged so each branch can `return { ..., emit: await stampGuardReport(...) }`
  const stampGuardReport = async (emit: {
    stdout: string;
    stderr?: string;
  }): Promise<{ stdout: string; stderr?: string }> => {
    if (peerReviews.length > 0)
      await setStoneGuardStamp({
        stone: stoneMatched,
        route: input.route,
        emit,
      });
    return emit;
  };

  // compute review input hash for cache lookup
  //
  // hash principle: each component hashes its inputs
  // - reviews hash on artifacts (their input) → this review input hash
  // - judges hash on reviews + approvals (their input) → computed internally by runStoneGuardJudges
  //
  // cascade scenarios:
  // - artifact change → review input hash changes → fresh reviews → judge input hash changes → fresh judge
  // - approval granted → review input hash unchanged → cached reviews → judge input hash changes → fresh judge
  // - review re-run after fix → review content changes → judge input hash changes → fresh judge
  const hash = await computeStoneReviewInputHash({
    stone: stoneMatched,
    route: input.route,
  });

  // check for prior artifacts for cache lookup
  const priorArtifacts = await getAllStoneGuardArtifactsByHash({
    stone: stoneMatched,
    hash,
    route: input.route,
  });

  // determine current iteration across ALL artifacts for this stone (not just per-hash)
  // .note = iteration increments globally so filenames show progression even when hash changes
  const maxPriorIteration = await getMaxStoneGuardIteration({
    stone: stoneMatched,
    route: input.route,
  });
  const iteration = maxPriorIteration + 1;

  // collect progress events for guard tree output
  const events: GuardProgressEvent[] = [];
  const totalReviews = peerReviews.length;
  const totalJudges = stoneMatched.guard.judges.length;
  const totalItems = totalReviews + totalJudges;

  // create context that enriches events with position for branch format
  // .note = forwards getReviewBrain so the guard's fallback tactic can build the sub-brain
  const collectContext: ContextCliEmit & ContextReviewBrainSupply = {
    cliEmit: {
      onGuardProgress: (event) => {
        events.push(event);

        // compute global position across reviews + judges
        const globalIndex =
          event.step.phase === 'review'
            ? event.step.index
            : totalReviews + event.step.index;

        context.cliEmit.onGuardProgress(event, {
          index: globalIndex,
          total: totalItems,
        });
      },
      onGuardHalted: context.cliEmit.onGuardHalted,
    },
    getReviewBrain: context.getReviewBrain,
  };

  // run reviews (reuses prior artifacts internally, only runs incomplete ones)
  const reviewResult =
    peerReviews.length > 0
      ? await runStoneGuardReviews(
          {
            stone: stoneMatched,
            guard: stoneMatched.guard,
            hash,
            iteration,
            route: input.route,
          },
          collectContext,
        )
      : { artifacts: [], exhaustedReviewerSlugs: [] };
  const reviewArtifacts = reviewResult.artifacts;

  // load human overrules FIRST, so the meter statuses below are overrule-aware
  // .why = an overruled level is terminal-for-unlock; the meter tree must not paint a false
  //        `awaits l<overruled> terminal` on the level above it, and each overruled level must
  //        be stamped so the tree + footer render the forgiveness (not the raw rejection).
  const overruledLevels = await getStoneGuardOverruledLevels({
    stone: stoneMatched,
    route: input.route,
  });

  // the judge is the top rung of the guard ladder; a human overrule of it (JUDGE_LEVEL)
  // forgives a failed or malfunctioned judge exactly as an overrule forgives a peer level.
  // this is the passage side of the peer+judge fix — getStoneGuardLevelState surfaces the judge
  // rung so a human CAN overrule it; this honors that overrule at the judge gate.
  const judgeRungForgiven = overruledLevels.has(JUDGE_LEVEL);

  // compute peer meter statuses for guard tree output
  // pass skipped slugs so wasExhausted can be computed correctly
  const peerMeters = await getAllReviewPeerMeterStatuses({
    stone: stoneMatched,
    hash,
    route: input.route,
    exhaustedReviewerSlugs: reviewResult.exhaustedReviewerSlugs,
    overruledLevels,
  });

  // check for peer review exhaustion
  // halt only if a review was SKIPPED due to exhaustion (not if it ran and depleted budget)
  // .why = if review ran at 2/2 and got blockers, should proceed to judge (blocked), not halt
  //        halt only on attempt 3/2 when review can't run because budget already at 2/2
  // note: if stone is already approved, skip this check (human already signed off)
  const approvalPrior = await getOnePassageReport({
    stone: stoneMatched.name,
    status: 'approved',
    route: input.route,
  });
  // .note = overruledLevels is loaded above (before the meter statuses), so an
  //         exhausted-but-overruled level does not halt and the judge forgives its blockers.

  // map review index -> level, to scope error forgiveness per level
  // .why = an overrule at level N forgives that level's malfunction/constraint,
  //        but a higher level's error still surfaces (it was not waved through)
  const peerReviewsForLevel = stoneMatched.guard
    ? getGuardPeerReviews(stoneMatched.guard)
    : [];
  const levelByReviewIndex = getReviewLevelByIndex({
    peerReviews: peerReviewsForLevel,
  });
  // per-index wrapper: map the review index to its level, then read the shared overruled check
  // so "is this level overruled" is decided in one place (rule.require.single-source-of-truth-for-render)
  const isReviewLevelOverruled = (index: number): boolean =>
    isLevelOverruled({
      level: levelByReviewIndex.get(index) ?? 1,
      overruledLevels,
    });
  // get slugs of reviews that were SKIPPED (not ran) due to exhaustion
  // .note = verdict 'exhausted' is only set when wasExhausted = true (see define.invariant.review.peer.exhausted)
  // .note = exhausted reviewers at overruled levels are excluded — they are forgiven
  const skippedSlugs = getExhaustedReviewerSlugs({
    meters: peerMeters,
    overruledLevels,
  });
  // every level terminal — overrule-aware, so an overruled lower level (whose raw verdict stays
  // 'rejected') still counts as terminal. without this, an overruled l1 leaves allTerminal false
  // and SKIPS this exhaustion halt, so an exhausted higher level passes without the human approval
  // the invariant requires (define.invariant.review.peer.passage) — the overrule spills upward to
  // forgive a level the human never waved.
  const allTerminal = isEveryReviewLevelTerminal({
    reviewers: peerMeters.map((m) => ({ level: m.level, verdict: m.verdict })),
    overruledLevels,
  });
  const exhaustionCheck = {
    anySkippedDueToExhaustion: skippedSlugs.length > 0,
    allTerminal,
    skippedSlugs,
  };
  if (
    exhaustionCheck.anySkippedDueToExhaustion &&
    exhaustionCheck.allTerminal &&
    !approvalPrior
  ) {
    // build guard data for output
    const guardData = computeGuardData({
      stone: stoneMatched,
      artifactFiles,
      reviewArtifacts,
      judgeArtifacts: [],
      events,
      route: input.route,
      gitRoot,
      peerMeters,
      judgeRungForgiven,
    });

    // emit tree terminator since no judge will follow
    context.cliEmit.onGuardHalted?.({
      reason: 'peer reviewer budget exhausted',
    });

    // exhausted peer budget → its OWN passage status (not a 'blocked' + blocker)
    // .why = by phase an exhausted peer review looks like ordinary review.peer (a calm
    //        push), but it is truly a human-wait: a halt(exhausted) where a human must
    //        approve or extend. as its own status it maps direct to that halt with no
    //        phase-inference. it is ephemeral — the next --as <status> supersedes it
    //        (latest-entry-wins), so a stale exhausted never lingers.
    // .note = writes the status directly (like malfunction/constraint), not via
    //         genStoneGuardBlockedEmit, which persists a 'blocked' status + blocker.
    const exhaustedReason = `peer reviewer budget exhausted: ${exhaustionCheck.skippedSlugs.join(', ')}`;

    // detect a malfunction/constraint that UNLOCKED and broke in this SAME pass — a higher
    // level that ran the instant the exhausted lower level went terminal.
    // .why = the guard has three gates (malfunction > constraint > exhaustion) that can concur;
    //        a halt that named only the exhaustion (with only budget/approve remedies) would
    //        send a human down a path that hits a SECOND, unwarned block on re-arrive — the
    //        malfunction still stands. so when a concurrent failure exists, ONE halt names every
    //        reason + persists the highest-precedence status, and the render/replay surface
    //        every remedy at once.
    // .note = only REVIEW failures can concur here: judges never ran (the exhaustion halt returns
    //         before them), so a concurrent break is always a higher review level that unlocked.
    //         a review at an overruled level is forgiven (the human waved it through).
    const concurrentMalfunctions = reviewArtifacts.filter(
      (r) => r.exitClass === 'malfunction' && !isReviewLevelOverruled(r.index),
    );
    const concurrentConstraints = reviewArtifacts.filter(
      (r) =>
        r.exitClass === 'constraint' &&
        r.blockers === 0 &&
        !isReviewLevelOverruled(r.index),
    );
    const hasConcurrentMalfunction = concurrentMalfunctions.length > 0;
    const hasConcurrentConstraint = concurrentConstraints.length > 0;

    if (hasConcurrentMalfunction || hasConcurrentConstraint) {
      // precedence: malfunction outranks constraint outranks exhaustion — the highest drives
      // the persisted status + the emit's headline passage kind
      const passage = hasConcurrentMalfunction ? 'malfunction' : 'blocked';

      // name every concurrent reason in precedence order, exhaustion last — the render
      // (additive options) + the replay both key off this ONE combined reason string
      const reasonParts: string[] = [];
      if (hasConcurrentMalfunction)
        reasonParts.push('reviewer or judge malfunctioned');
      if (hasConcurrentConstraint) reasonParts.push('reviewer constraint');
      reasonParts.push(exhaustedReason);
      const combinedReason = reasonParts.join('; ');

      // persist the highest-precedence status + the FULL combined reason, so the onBoot/onStop
      // replay reconstructs every reason + remedy (not the bare malfunction escalation alone)
      await setPassageReport({
        report: new PassageReport({
          stone: stoneMatched.name,
          status: passage === 'malfunction' ? 'malfunction' : 'blocked',
          reason: combinedReason,
        }),
        route: input.route,
      });

      // collect the broken reviewers' detail into a stderr bucket (same shape the standalone
      // malfunction/constraint gates emit)
      const stderrBlocks = await Promise.all(
        [...concurrentMalfunctions, ...concurrentConstraints].map((review) =>
          formatArtifactStderrBlock({
            emoji: '🔎',
            label: 'review',
            index: review.index,
            path: review.path,
            fallback: `${review.exitClass} (exit code ${review.exitCode})`,
          }),
        ),
      );

      return {
        passed: false,
        refs: {
          reviews: reviewArtifacts.map((r) => r.path),
          judges: [],
        },
        emit: await stampGuardReport({
          stdout: formatRouteStoneEmit({
            operation: 'route.stone.set',
            stone: stoneMatched.name,
            action: 'passed',
            passage,
            reason: combinedReason,
            guard: guardData,
          }),
          stderr: joinArtifactStderrBlocks(stderrBlocks),
        }),
      };
    }

    // pure exhaustion (no concurrent failure) → its OWN passage status (not a 'blocked' + blocker)
    // .why = by phase an exhausted peer review looks like ordinary review.peer (a calm
    //        push), but it is truly a human-wait: a halt(exhausted) where a human must
    //        approve or extend. as its own status it maps direct to that halt with no
    //        phase-inference. it is ephemeral — the next --as <status> supersedes it
    //        (latest-entry-wins), so a stale exhausted never lingers.
    // .note = writes the status directly (like malfunction/constraint), not via
    //         genStoneGuardBlockedEmit, which persists a 'blocked' status + blocker.
    await setPassageReport({
      report: new PassageReport({
        stone: stoneMatched.name,
        status: 'exhausted',
        reason: exhaustedReason,
      }),
      route: input.route,
    });

    return {
      passed: false,
      refs: {
        reviews: reviewArtifacts.map((r) => r.path),
        judges: [],
      },
      emit: await stampGuardReport({
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'blocked',
          reason: exhaustedReason,
          guard: guardData,
        }),
      }),
    };
  }

  // run judges (reuses prior artifacts internally, only runs incomplete ones)
  const judgeArtifacts =
    stoneMatched.guard.judges.length > 0
      ? await runStoneGuardJudges(
          {
            stone: stoneMatched,
            guard: stoneMatched.guard,
            hash,
            iteration,
            route: input.route,
          },
          collectContext,
        )
      : [];

  // a judge is forgiven ONLY when the human overruled the judge rung AND that judge malfunctioned.
  // .why = the single per-judge forgiveness rule that the malfunction halt, the passage gate
  //        (allJudgesPassed), the failed-judge tally, and the tree display all read — so none can
  //        drift apart. a rung overrule forgives a broken judge (a malfunction), never a co-judge
  //        that legitimately holds (e.g. approved? still awaits sign-off, its own constraint exit).
  //        that scope is the "one gate, not the corridor" invariant at the judge tier
  //        (define.review.human-forgiveness.md; rule.require.single-source-of-truth-for-render).
  const isJudgeForgivenByRung = (
    judge: RouteStoneGuardJudgeArtifact,
  ): boolean => judgeRungForgiven && judge.exitClass === 'malfunction';

  // check for malfunctions (exit code != 0 and != 2)
  // .note = a malfunction at an overruled level is forgiven (human waved it through)
  const reviewMalfunctions = reviewArtifacts.filter(
    (r) => r.exitClass === 'malfunction' && !isReviewLevelOverruled(r.index),
  );
  const judgeMalfunctions = judgeArtifacts.filter(
    (judge) =>
      judge.exitClass === 'malfunction' && !isJudgeForgivenByRung(judge),
  );
  const hasMalfunction =
    reviewMalfunctions.length > 0 || judgeMalfunctions.length > 0;

  if (hasMalfunction) {
    // record malfunction status in passage.jsonl
    await setPassageReport({
      report: new PassageReport({
        stone: stoneMatched.name,
        status: 'malfunction',
      }),
      route: input.route,
    });

    // build guard data for output
    const guardData = computeGuardData({
      stone: stoneMatched,
      artifactFiles,
      reviewArtifacts,
      judgeArtifacts,
      events,
      route: input.route,
      gitRoot,
      peerMeters,
      judgeRungForgiven,
    });

    // collect malfunction details for stderr — reviews first, then judges
    const reviewStderrBlocks = await Promise.all(
      reviewMalfunctions.map((review) =>
        formatArtifactStderrBlock({
          emoji: '🔎',
          label: 'review',
          index: review.index,
          path: review.path,
          fallback: `malfunction (exit code ${review.exitCode})`,
        }),
      ),
    );
    const judgeStderrBlocks = await Promise.all(
      judgeMalfunctions.map((judge) =>
        formatArtifactStderrBlock({
          emoji: '🪶',
          label: 'judge',
          index: judge.index,
          path: judge.path,
          fallback: `malfunction (exit code ${judge.exitCode})`,
        }),
      ),
    );

    return {
      passed: false,
      refs: {
        reviews: reviewArtifacts.map((r) => r.path),
        judges: judgeArtifacts.map((j) => j.path),
      },
      emit: await stampGuardReport({
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'malfunction',
          reason: 'reviewer or judge malfunctioned',
          guard: guardData,
        }),
        stderr: joinArtifactStderrBlocks([
          ...reviewStderrBlocks,
          ...judgeStderrBlocks,
        ]),
      }),
    };
  }

  // check for genuine constraints (exit code 2 without blockers)
  // .note = exit 2 with blockers = review completed, found issues (not a constraint)
  // .note = exit 2 without blockers = genuine constraint (e.g., absent API key)
  // .note = a constraint at an overruled level is forgiven (human waved it through)
  const reviewConstraints = reviewArtifacts.filter(
    (r) =>
      r.exitClass === 'constraint' &&
      r.blockers === 0 &&
      !isReviewLevelOverruled(r.index),
  );
  const hasConstraint = reviewConstraints.length > 0;

  if (hasConstraint) {
    // record blocked status in passage.jsonl
    await setPassageReport({
      report: new PassageReport({
        stone: stoneMatched.name,
        status: 'blocked',
      }),
      route: input.route,
    });

    // build guard data for output
    const guardDataForConstraint = computeGuardData({
      stone: stoneMatched,
      artifactFiles,
      reviewArtifacts,
      judgeArtifacts,
      events,
      route: input.route,
      gitRoot,
      peerMeters,
      judgeRungForgiven,
    });

    // collect constraint details for stderr
    const stderrBlocks = await Promise.all(
      reviewConstraints.map((review) =>
        formatArtifactStderrBlock({
          emoji: '🔎',
          label: 'review',
          index: review.index,
          path: review.path,
          fallback: `constraint (exit code ${review.exitCode})`,
        }),
      ),
    );

    return {
      passed: false,
      refs: {
        reviews: reviewArtifacts.map((r) => r.path),
        judges: judgeArtifacts.map((j) => j.path),
      },
      emit: await stampGuardReport({
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: 'blocked',
          reason: 'reviewer constraint',
          guard: guardDataForConstraint,
        }),
        stderr: joinArtifactStderrBlocks(stderrBlocks),
      }),
    };
  }

  // build guard data from artifacts and events for tree output
  const guardData = computeGuardData({
    stone: stoneMatched,
    artifactFiles,
    reviewArtifacts,
    judgeArtifacts,
    events,
    route: input.route,
    gitRoot,
    peerMeters,
    judgeRungForgiven,
  });

  // check if all judges pass — each judge either passed on merit OR was forgiven per-judge by a
  // rung overrule (a malfunction only). a stone-wide `judgeRungForgiven || every(passed)` would
  // forgive an awaited approval too, the skeleton-key defect this behavior exists to close, one
  // tier up. scope forgiveness to the malfunction via the shared predicate above.
  const allJudgesPassed = judgeArtifacts.every(
    (judge) => judge.passed || isJudgeForgivenByRung(judge),
  );

  if (allJudgesPassed) {
    // gate: peer reviews must be contemplated before passage
    // .why = a driver may not progress until it has written a .taken response to
    //        every current-iteration peer critique that carries blockers (the wish)
    // .note = slots BETWEEN allJudgesPassed and setStonePassage so it runs only
    //         when judges would pass, and BEFORE the report is cleared below
    const contemplation = await getRouteGuardReviewPeerContemplationStatus({
      route: input.route,
      stone: stoneMatched,
    });

    // forgive contemplation for reviewers at an overruled level
    // .why = an admin escape (--as overruled / --as forced) must not be re-gated
    //        by a requirement a driver must satisfy; the human took responsibility
    //        for the passage, so a waved-through level's critique needs no .taken
    //        (design-note B6; mirrors the malfunction/constraint per-level forgiveness)
    // read the ONE source of truth for "uncontemplated AND not forgiven by an overrule" — the
    // same primitive the overrule short-circuits (setStoneAsOverruled / setStoneAsForced via
    // getStoneGuardOverruleTarget) read — so the passage gate cannot drift from them on which
    // reviewers a waved level forgives. this is the exact seam the whole behavior exists to close:
    // the forgiveness rule lives in one place, not hand-rolled here and there.
    const unforgiven = await getStoneGuardReviewPeerUncontemplatedUnforgiven({
      stone: stoneMatched,
      route: input.route,
    });
    const unforgivenSlugs = new Set(
      unforgiven.map((reviewer) => reviewer.slug),
    );
    const uncontemplatedToBlock = contemplation.uncontemplated.filter(
      (reviewer) => unforgivenSlugs.has(reviewer.slug),
    );

    if (uncontemplatedToBlock.length > 0) {
      // .note = no onGuardHalted here — the contemplation gate runs only inside
      //         allJudgesPassed, so the judge event already closed the tree; the
      //         reply-prompt below states the halt reason. a redundant onGuardHalted
      //         would append a second └─ terminator after the judge.

      // blocked on absent peer contemplation — persist + return via the shared tail
      return genStoneGuardBlockedEmit({
        stone: stoneMatched.name,
        route: input.route,
        blocker: 'review.peer.uncontemplated',
        reason: `peer review awaits contemplation: ${asRouteGuardReviewPeerSlugList(
          { reviewers: uncontemplatedToBlock },
        )}`,
        refs: {
          reviews: reviewArtifacts.map((r) => r.path),
          judges: judgeArtifacts.map((j) => j.path),
        },
        emit: await stampGuardReport({
          stdout: formatRouteGuardReviewPeerContemplatePrompt({
            case: 'reply-prompt',
            stone: stoneMatched.name,
            reviewers: uncontemplatedToBlock,
          }),
        }),
      });
    }

    await setStonePassage({ stone: stoneMatched, route: input.route });

    // clear blocked triggers for this stone and all earlier stones
    await clearBlockedTriggersUpTo({
      stone: stoneMatched,
      stones,
      route: input.route,
    });

    // update bouncer cache (stone passage may release protected artifacts)
    const bouncerCache = await computeRouteBouncerCache({
      cwd: process.cwd(),
      route: input.route,
    });
    await setRouteBouncerCache({ cache: bouncerCache, route: input.route });

    // clear any prior blocker report
    await delStoneGuardBlockerReport({
      stone: stoneMatched.name,
      route: input.route,
    });

    // determine passage reason
    // .note = if any rung was overruled (a peer level or the judge rung), passage was
    //         enabled by overrule; else it passed the judges cleanly
    const passageReason = overruledLevels.size > 0 ? 'overruled' : 'allowed';

    return {
      passed: true,
      refs: {
        reviews: reviewArtifacts.map((r) => r.path),
        judges: judgeArtifacts.map((j) => j.path),
      },
      emit: await stampGuardReport({
        stdout: formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: stoneMatched.name,
          action: 'passed',
          passage: passageReason,
          guard: guardData,
        }),
      }),
    };
  }

  // collect rejection reasons — a judge forgiven by a rung overrule (a malfunction the human
  // waved) is no longer a failure, so it drops out; only a judge that genuinely holds (e.g.
  // approved? that awaits sign-off) stays, so the blocked reason names the real gate, not the crash
  const failedJudges = judgeArtifacts.filter(
    (judge) => !judge.passed && !isJudgeForgivenByRung(judge),
  );
  const reasons = failedJudges
    .map((j) => j.reason || `judge ${j.index} failed`)
    .join('; ');

  // determine blocker type from failed judges
  const blocker = computeBlockedOn({
    failedJudges,
    guard: stoneMatched.guard,
  });

  // build detailed stderr for failed judges as tree bucket
  const stderrBlocks = await Promise.all(
    failedJudges.map((judge) =>
      formatArtifactStderrBlock({
        emoji: '🪶',
        label: 'judge',
        index: judge.index,
        path: judge.path,
        fallback: judge.reason ?? null,
      }),
    ),
  );

  // blocked on failed judges — persist + return via the shared blocked tail
  return genStoneGuardBlockedEmit({
    stone: stoneMatched.name,
    route: input.route,
    blocker,
    reason: reasons,
    refs: {
      reviews: reviewArtifacts.map((r) => r.path),
      judges: judgeArtifacts.map((j) => j.path),
    },
    emit: await stampGuardReport({
      stdout: formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: stoneMatched.name,
        action: 'passed',
        passage: 'blocked',
        reason: reasons,
        guard: guardData,
      }),
      stderr: joinArtifactStderrBlocks(stderrBlocks),
    }),
  });
};

/**
 * .what = builds guard data for tree output from artifacts and events
 * .why = bridges review/judge artifacts with progress events for display
 */
const computeGuardData = (input: {
  stone: RouteStone;
  artifactFiles: string[];
  reviewArtifacts: RouteStoneGuardReviewArtifact[];
  judgeArtifacts: RouteStoneGuardJudgeArtifact[];
  events: GuardProgressEvent[];
  route: string;
  gitRoot: string;
  peerMeters?: GuardPeerMeterStatus[];
  // whether the human overruled the judge rung (JUDGE_LEVEL)
  // .why = a forgiven judge must read "overruled ✓ — forgiven by human" in the tree, not a
  //        bare "✗ blocked" that contradicts the top-line `passage = overruled` (the judge-tier
  //        twin of the peer-level overrule display; rule.require.single-source-of-truth-for-render)
  judgeRungForgiven?: boolean;
}) => {
  // find events that completed (have endedAt)
  const reviewEventsCompleted = input.events.filter(
    (e) => e.step.phase === 'review' && e.inflight?.endedAt,
  );
  const judgeEventsCompleted = input.events.filter(
    (e) => e.step.phase === 'judge' && e.inflight?.endedAt,
  );

  // extract peer reviews for command lookup
  const stonePeerReviews = input.stone.guard
    ? getGuardPeerReviews(input.stone.guard)
    : [];

  // use original artifact globs for display (not expanded file paths)
  // this prevents 700+ lines of output when guard declares src/**/*
  const artifactGlobs = input.stone.guard?.artifacts ?? [];

  return {
    artifactFiles: artifactGlobs,
    reviews: input.reviewArtifacts.map((r) => {
      // match event by step.index (0-based) to artifact.index (1-based)
      const event = reviewEventsCompleted.find(
        (e) => e.step.index === r.index - 1,
      );
      const isCached = !event;
      // for cached reviews, use duration from artifact (parsed from stdout)
      // for fresh reviews, use duration from event time
      const durationSec = isCached
        ? r.durationMs !== null
          ? r.durationMs / 1000
          : null
        : computeDuration(event);
      const peerReview = stonePeerReviews[r.index - 1];

      // build peer info from review + meter state
      const peer = peerReview
        ? {
            slug: peerReview.slug,
            level: peerReview.level ?? 1,
            rounds:
              input.peerMeters?.find((m) => m.slug === peerReview.slug)
                ?.rounds ?? 0,
            budget: peerReview.budget,
          }
        : undefined;

      return {
        index: r.index,
        cmd: peerReview ? getReviewPeerRunCmd(peerReview) : '',
        cached: isCached
          ? ({ hit: true, on: artifactGlobs } as { hit: true; on: string[] })
          : (false as const),
        durationSec,
        blockers: r.blockers,
        nitpicks: r.nitpicks,
        tallier: r.tallier,
        path: path.relative(input.gitRoot, r.path),
        exitClass: r.exitClass,
        peer,
      };
    }),
    judges: input.judgeArtifacts.map((j) => {
      const event = judgeEventsCompleted.find(
        (e) => e.step.index === j.index - 1,
      );
      const durationSec = computeDuration(event);
      const isCached = !event;
      // a judge reads as overruled only when the rung was forgiven AND this judge malfunctioned —
      // the same per-judge scope the passage gate uses (allJudgesPassed), so a co-judge that
      // legitimately holds (e.g. approved? awaiting sign-off) never falsely paints as forgiven
      const overruled =
        (input.judgeRungForgiven ?? false) && j.exitClass === 'malfunction';
      return {
        index: j.index,
        cmd: input.stone.guard?.judges[j.index - 1] ?? '',
        cached: isCached
          ? ({ hit: true, on: artifactGlobs } as { hit: true; on: string[] })
          : (false as const),
        durationSec,
        passed: j.passed,
        reason: j.reason,
        path: path.relative(input.route, j.path),
        overruled,
      };
    }),
    // use peerMeters as-is (source of truth for verdicts)
    // .note = getAllReviewPeerMeterStatuses already computed verdict
    //         with full context (exitClass, nitpicks, allowBlockers, allowNitpicks)
    // @see rule.require.single-source-of-truth-for-render
    peerMeters: input.peerMeters,
  };
};

/**
 * .what = computes duration in seconds from a completed progress event
 * .why = derives display duration from event timestamps
 */
const computeDuration = (
  event: GuardProgressEvent | undefined,
): number | null => {
  if (!event?.inflight?.endedAt) return null;
  const beganMs = new Date(event.inflight.beganAt).getTime();
  const endedMs = new Date(event.inflight.endedAt).getTime();
  return (endedMs - beganMs) / 1000;
};

/**
 * .what = determines blocker type from failed judges
 * .why = enables hook mode to determine if agent can stop
 *
 * priority:
 * 1. review failures (agent can fix code)
 * 2. approval failures (agent must wait for human)
 * 3. other judge failures (agent may be able to fix)
 */
const computeBlockedOn = (input: {
  failedJudges: RouteStoneGuardJudgeArtifact[];
  guard: RouteStone['guard'];
}): 'review.self' | 'review.peer' | 'approval' | 'judge' => {
  if (!input.guard) return 'judge';

  // classify each failed judge
  let hasReviewFailure = false;
  let hasApprovalFailure = false;
  let hasOtherFailure = false;

  for (const judge of input.failedJudges) {
    const judgeCmd = input.guard.judges[judge.index - 1] ?? '';

    if (judgeCmd.includes('--mechanism reviewed?')) {
      hasReviewFailure = true;
    } else if (judgeCmd.includes('--mechanism approved?')) {
      hasApprovalFailure = true;
    } else {
      hasOtherFailure = true;
    }
  }

  // priority: review > approval > other
  if (hasReviewFailure) return 'review.peer';
  if (hasApprovalFailure && !hasOtherFailure) return 'approval';
  return 'judge';
};

/**
 * .what = clears blocked triggers for a stone and all earlier stones
 * .why = when a later stone is passed, earlier blocked states are resolved
 */
const clearBlockedTriggersUpTo = async (input: {
  stone: RouteStone;
  stones: RouteStone[];
  route: string;
}): Promise<void> => {
  // find index of current stone
  const stoneIndex = input.stones.findIndex((s) => s.name === input.stone.name);
  if (stoneIndex < 0) return;

  // clear blocked triggers for this stone and all earlier stones
  const stonesToClear = input.stones.slice(0, stoneIndex + 1);
  for (const stone of stonesToClear) {
    await delBlockedTriggeredReport({ stone: stone.name, route: input.route });
  }
};
