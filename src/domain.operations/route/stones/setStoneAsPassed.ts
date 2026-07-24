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
import { getAllReviewPeerMeterStatuses } from '../guard/review/peer/meter/getAllReviewPeerMeterStatuses';
import {
  isReviewPeerVerdictExhausted,
  isReviewPeerVerdictTerminal,
} from '../guard/review/peer/meter/isReviewPeerLevelTerminal';
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

  // compute peer meter statuses for guard tree output
  // pass skipped slugs so wasExhausted can be computed correctly
  const peerMeters = await getAllReviewPeerMeterStatuses({
    stone: stoneMatched,
    hash,
    route: input.route,
    exhaustedReviewerSlugs: reviewResult.exhaustedReviewerSlugs,
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
  // load human overrules so an exhausted-but-overruled level does not halt
  // .why = a level the human waved through must not block passage on exhaustion;
  //        the judge forgives its blockers, so let the flow reach the judge
  const { levels: overruledLevels, all: overruledAll } =
    await getStoneGuardOverruledLevels({
      stone: stoneMatched,
      route: input.route,
    });

  // map review index -> level, to scope error forgiveness per level
  // .why = an overrule at level N forgives that level's malfunction/constraint,
  //        but a higher level's error still surfaces (it was not waved through)
  const peerReviewsForLevel = stoneMatched.guard
    ? getGuardPeerReviews(stoneMatched.guard)
    : [];
  const levelByReviewIndex = new Map<number, number>();
  peerReviewsForLevel.forEach((review, i) =>
    levelByReviewIndex.set(i + 1, review.level ?? 1),
  );
  const isReviewLevelOverruled = (index: number): boolean => {
    if (overruledAll) return true;
    const level = levelByReviewIndex.get(index) ?? 1;
    return overruledLevels.has(level);
  };
  // get slugs of reviews that were SKIPPED (not ran) due to exhaustion
  // .note = verdict 'exhausted' is only set when wasExhausted = true (see define.invariant.review.peer.exhausted)
  // .note = exhausted reviewers at overruled levels are excluded — they are forgiven
  const exhaustedMeters = peerMeters.filter(
    (m) =>
      isReviewPeerVerdictExhausted(m.verdict) && !overruledLevels.has(m.level),
  );
  const skippedSlugs = exhaustedMeters.map((m) => m.slug);
  const allTerminal =
    peerMeters.length > 0 &&
    peerMeters.every((m) => isReviewPeerVerdictTerminal(m.verdict));
  const exhaustionCheck = {
    anySkippedDueToExhaustion: exhaustedMeters.length > 0,
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
      const stderrLines: string[] = [];
      for (const review of [
        ...concurrentMalfunctions,
        ...concurrentConstraints,
      ]) {
        if (stderrLines.length > 0) stderrLines.push('');
        stderrLines.push(`🔎 review ${review.index}`);
        try {
          const content = await fs.readFile(review.path, 'utf-8');
          for (const line of content.split('\n')) stderrLines.push(`   ${line}`);
        } catch (error) {
          const isExpected =
            error instanceof Error &&
            (error.message.includes('ENOENT') ||
              error.message.includes('EACCES'));
          if (!isExpected) throw error;
          stderrLines.push(
            `   └─ ${review.exitClass} (exit code ${review.exitCode})`,
          );
        }
      }

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
          stderr: stderrLines.length > 0 ? stderrLines.join('\n') : undefined,
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

  // check for malfunctions (exit code != 0 and != 2)
  // .note = a malfunction at an overruled level is forgiven (human waved it through)
  // .note = judge malfunctions are forgiven only by a legacy stone-wide overrule
  const reviewMalfunctions = reviewArtifacts.filter(
    (r) => r.exitClass === 'malfunction' && !isReviewLevelOverruled(r.index),
  );
  const judgeMalfunctions = overruledAll
    ? []
    : judgeArtifacts.filter((j) => j.exitClass === 'malfunction');
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
    });

    // collect malfunction details for stderr
    const stderrLines: string[] = [];
    for (const review of reviewMalfunctions) {
      if (stderrLines.length > 0) stderrLines.push('');
      stderrLines.push(`🔎 review ${review.index}`);
      try {
        const content = await fs.readFile(review.path, 'utf-8');
        for (const line of content.split('\n')) {
          stderrLines.push(`   ${line}`);
        }
      } catch (error) {
        // graceful fallback for display: file may not exist or be unreadable
        const isExpected =
          error instanceof Error &&
          (error.message.includes('ENOENT') ||
            error.message.includes('EACCES'));
        if (!isExpected) throw error;
        stderrLines.push(`   └─ malfunction (exit code ${review.exitCode})`);
      }
    }
    for (const judge of judgeMalfunctions) {
      if (stderrLines.length > 0) stderrLines.push('');
      stderrLines.push(`🪶 judge ${judge.index}`);
      try {
        const content = await fs.readFile(judge.path, 'utf-8');
        for (const line of content.split('\n')) {
          stderrLines.push(`   ${line}`);
        }
      } catch (error) {
        // graceful fallback for display: file may not exist or be unreadable
        const isExpected =
          error instanceof Error &&
          (error.message.includes('ENOENT') ||
            error.message.includes('EACCES'));
        if (!isExpected) throw error;
        stderrLines.push(`   └─ malfunction (exit code ${judge.exitCode})`);
      }
    }

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
        stderr: stderrLines.length > 0 ? stderrLines.join('\n') : undefined,
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
    });

    // collect constraint details for stderr
    const stderrLines: string[] = [];
    for (const review of reviewConstraints) {
      if (stderrLines.length > 0) stderrLines.push('');
      stderrLines.push(`🔎 review ${review.index}`);
      try {
        const content = await fs.readFile(review.path, 'utf-8');
        for (const line of content.split('\n')) {
          stderrLines.push(`   ${line}`);
        }
      } catch (error) {
        // graceful fallback for display: file may not exist or be unreadable
        const isExpected =
          error instanceof Error &&
          (error.message.includes('ENOENT') ||
            error.message.includes('EACCES'));
        if (!isExpected) throw error;
        stderrLines.push(`   └─ constraint (exit code ${review.exitCode})`);
      }
    }

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
        stderr: stderrLines.length > 0 ? stderrLines.join('\n') : undefined,
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
  });

  // check if all judges pass
  const allJudgesPassed = judgeArtifacts.every((j) => j.passed);

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
    const overruledSlugs = new Set(
      peerReviewsForLevel
        .filter((_, i) => isReviewLevelOverruled(i + 1))
        .map((review) => review.slug),
    );
    const uncontemplatedToBlock = contemplation.uncontemplated.filter(
      (reviewer) => !overruledSlugs.has(reviewer.slug),
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
    // .note = if any level (or legacy all) was overruled, passage was enabled
    //         by overrule; else it passed the judges cleanly
    const passageReason =
      overruledAll || overruledLevels.size > 0 ? 'overruled' : 'allowed';

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

  // collect rejection reasons
  const failedJudges = judgeArtifacts.filter((j) => !j.passed);
  const reasons = failedJudges
    .map((j) => j.reason || `judge ${j.index} failed`)
    .join('; ');

  // determine blocker type from failed judges
  const blocker = computeBlockedOn({
    failedJudges,
    guard: stoneMatched.guard,
  });

  // build detailed stderr for failed judges as tree bucket
  const stderrLines: string[] = [];
  for (const judge of failedJudges) {
    // blank line between judges (not before first)
    if (stderrLines.length > 0) {
      stderrLines.push('');
    }

    stderrLines.push(`🪶 judge ${judge.index}`);

    // read artifact content (already formatted with tree buckets)
    try {
      const artifactContent = await fs.readFile(judge.path, 'utf-8');
      // indent each line by 3 spaces to nest under 🔎 judge N
      for (const line of artifactContent.split('\n')) {
        stderrLines.push(`   ${line}`);
      }
    } catch (error) {
      // graceful fallback for display: file may not exist or be unreadable
      const isExpected =
        error instanceof Error &&
        (error.message.includes('ENOENT') || error.message.includes('EACCES'));
      if (!isExpected) throw error;
      // fallback to reason if file read fails
      if (judge.reason) {
        stderrLines.push(`   └─ ${judge.reason}`);
      }
    }
  }

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
      stderr: stderrLines.length > 0 ? stderrLines.join('\n') : undefined,
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
