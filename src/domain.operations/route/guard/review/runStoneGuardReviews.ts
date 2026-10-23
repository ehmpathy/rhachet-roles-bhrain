import { UnexpectedCodePathError } from 'helpful-errors';
import type { IsoDuration } from 'iso-time';
import { type Bottleneck, genBottleneck } from 'with-bottleneck';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import type { ContextStoneGuardRound } from '@src/domain.objects/Driver/ContextStoneGuardRound';
import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import {
  getGuardPeerReviews,
  getReviewPeerRunCmd,
  type RouteStoneGuard,
  type RouteStoneGuardReviewPeer,
} from '@src/domain.objects/Driver/RouteStoneGuard';
import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';
import type { ContextReviewBrainSupply } from '@src/domain.operations/brain/genReviewBrainSupply'; // brain/ is a declared shared subdomain (its .readme.md)

import { asGuardPositiveInt } from '../../../asGuardPositiveInt';
import { findsertReviewPeerGitignore } from '../../gitignore/findsertReviewPeerGitignore';
import { getStoneGuardLevelsPoured } from '../../judges/getStoneGuardLevelsPoured';
import { getStoneGuardOverruledLevels } from '../../judges/getStoneGuardOverruledLevels';
import { setPassageReport } from '../../passage/setPassageReport';
import { getAllStoneGuardArtifactsByHash } from '../artifact/getAllStoneGuardArtifactsByHash';
import { asGuardDisplayPath } from '../asGuardDisplayPath';
import { getRepoRootWithFallback } from '../getRepoRootWithFallback';
import { isCmdOfRuntimeVar } from '../isCmdOfRuntimeVar';
import { setStoneGuardRoundOutput } from '../round/setStoneGuardRoundOutput';
import { asConcurrencyGroupLeakAdvisory } from './asConcurrencyGroupLeakAdvisory';
import { asLevelSlotByIndex } from './asLevelSlotByIndex';
import { asMeterBySlug } from './asMeterBySlug';
import { asReviewLevelPourAnnounce } from './asReviewLevelPourAnnounce';
import { asReviewProgressOutcome } from './asReviewProgressOutcome';
import { genOnceOfPromise } from './genOnceOfPromise';
import { getAllCachedPassedReviews } from './getAllCachedPassedReviews';
import { getAllConcurrencyGroupLeaks } from './getAllConcurrencyGroupLeaks';
import { getAllReviewLevelsAsc } from './getAllReviewLevelsAsc';
import { getAllReviewPeersByLevel } from './getAllReviewPeersByLevel';
import { getAllReviewPeerVerdicts } from './getAllReviewPeerVerdicts';
import { getAllStoneGuardReviewTargetPaths } from './getAllStoneGuardReviewTargetPaths';
import { getOneReviewLevelPourBound } from './getOneReviewLevelPourBound';
import { getOneReviewLevelPrimeMeet } from './getOneReviewLevelPrimeMeet';
import { isReviewRoundCompleted } from './isReviewRoundCompleted';
import { getOneCacheSafePeerReviewArtifact } from './peer/getOneCacheSafePeerReviewArtifact';
import { getOneLatestReviewArtifactForSlug } from './peer/getOneLatestReviewArtifactForSlug';
import { computeDisputedConcernCounts } from './peer/getStoneDisputedConcernCounts';
import { getStoneReviewCorpus } from './peer/getStoneReviewCorpus';
import { isLaneSkippedByDispute } from './peer/isLaneSkippedByDispute';
import { isPeerTakenNewerThanGiven } from './peer/isPeerTakenNewerThanGiven';
import { computeReviewPeerVerdict } from './peer/meter/computeReviewPeerVerdict';
import { getAllRouteStoneGuardReviewPeerMeters } from './peer/meter/getAllRouteStoneGuardReviewPeerMeters';
import { getOneReviewLevelAwaited } from './peer/meter/getOneReviewLevelAwaited';
import { getReviewedJudgeThresholds } from './peer/meter/getReviewedJudgeThresholds';
import { getStoneGuardLevelClearance } from './peer/meter/getStoneGuardLevelClearance';
import { isReviewLevelUnlocked } from './peer/meter/isReviewLevelUnlocked';
import { isReviewPeerVerdictExhausted } from './peer/meter/isReviewPeerVerdictExhausted';
import { setRouteStoneGuardReviewPeerMeter } from './peer/meter/setRouteStoneGuardReviewPeerMeter';
import { runOneStoneGuardReview } from './runOneStoneGuardReview';
import { runWithinConcurrencyBounds } from './runWithinConcurrencyBounds';

/**
 * .what = default timeout for review command execution
 * .why = preserves backwards compat when timeout not specified
 */
const DEFAULT_REVIEW_TIMEOUT: IsoDuration = 'PT21M';

/**
 * .what = extracts timeout from peer review, with default
 */
const getOneReviewPeerTimeout = (
  review: RouteStoneGuardReviewPeer,
): IsoDuration => review.timeout ?? DEFAULT_REVIEW_TIMEOUT;

/**
 * .what = the concurrency group this reviewer joins, if it declared one
 * .why = a reviewer with no group contends with no other reviewer for a group slot
 */
const getOneReviewPeerGroup = (
  review: RouteStoneGuardReviewPeer,
): string | null => review.group ?? null;

/**
 * .what = how many reviews may be in flight at one level when no group binds them
 * .why = permissive but bounded floor every level inherits (fulcrum F2)
 * .note = level-wide, and narrower than a group bound. a grouped reviewer answers to
 *         both; a groupless one answers only to this. "contends with nobody" means
 *         nobody's group, never nobody at all.
 */
const DEFAULT_LEVEL_CONCURRENCY = 10;

/**
 * .what = the level default, overridable at run time
 * .why = fulcrum F2's value is open, so an operator must be able to move it without a
 *        code edit and snapshot re-baseline. reuses the override pattern of
 *        `RHACHET_REVIEW_TIMEOUT_MS` and `RHACHET_FALLBACK_BRAIN_TIMEOUT_MS`, but
 *        stricter: it reads through `asGuardPositiveInt` (as `concurrency:`, `budget:`,
 *        `level:` already do) so a typo refuses loud rather than yielding `NaN`.
 */
const getOneDefaultLevelConcurrency = (): number =>
  process.env.RHACHET_LEVEL_CONCURRENCY !== undefined
    ? asGuardPositiveInt({
        raw: process.env.RHACHET_LEVEL_CONCURRENCY,
        key: 'concurrency',
        at: 'env RHACHET_LEVEL_CONCURRENCY',
      })
    : DEFAULT_LEVEL_CONCURRENCY;

/**
 * .what = executes guard review commands and produces review artifacts
 * .why = enables guard to validate stone artifacts via review tools
 */
export const runStoneGuardReviews = async (
  input: {
    stone: RouteStone;
    guard: RouteStoneGuard;
    hash: string;
    iteration: number;
    route: string;
  },
  context: ContextCliEmit & ContextReviewBrainSupply & ContextStoneGuardRound,
): Promise<{
  artifacts: RouteStoneGuardReviewArtifact[];
  exhaustedReviewerSlugs: string[];
}> => {
  // git root for path relativization (output relative to git root, not route)
  const gitRoot = await getRepoRootWithFallback({ from: input.route });

  // prior artifacts for this hash, so reviews unchanged by content can be reused
  const priorArtifacts = await getAllStoneGuardArtifactsByHash({
    stone: input.stone,
    hash: input.hash,
    route: input.route,
  });

  // only successful reviews are cached
  // .note = a malfunction may mean the reviewer was fixed; a constraint may mean the
  //         artifact was fixed — both need a re-run
  const cachedReviews = getAllCachedPassedReviews({
    reviews: priorArtifacts.reviews,
  });

  // reviews are added as we process each peer review (not pre-populated)
  // .note = deliberate mutation. both lists are born in this call and appended only at the
  //         level seal (in declared order, after the level's pour settles). the level gate
  //         must read the lanes of lower levels, so the lists grow level by level; only the
  //         final arrays escape, via the return (rule.require.immutable-vars, scoped zone)
  const reviews: RouteStoneGuardReviewArtifact[] = [];

  // reviewers skipped due to exhaustion in this iteration
  const exhaustedReviewerSlugs: string[] = [];

  // current meters for budget state (per stone)
  // .note = slugs are guaranteed unique at parse time via standardizePeerReviewSlugs
  // .note = deliberate mutation, and a SCOPED ZONE: `meterBySlug` is born in this call and
  //         never handed out. each lane writes only its own slug's key, once, after its round
  //         completes, so the lanes a level pours at once never write one key twice
  //         (rule.require.immutable-vars)
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone.name,
  });
  const meterBySlug = asMeterBySlug({ meters });

  // the stance corpus, read once for every lane — the per-lane skip below folds over it
  const { absorptions, givens } = await getStoneReviewCorpus({
    route: input.route,
    stone: input.stone.name,
  });

  // peer reviews with indices, sorted by level (cheapest first)
  const peerReviewsWithIndex = getAllReviewPeersByLevel({
    peerReviews: getGuardPeerReviews(input.guard),
  });

  // thresholds for verdict computation (defaults to 0,0 when no reviewed? judge configured)
  const thresholds = getReviewedJudgeThresholds(input.guard) ?? {
    allowBlockers: 0,
    allowNitpicks: 0,
  };
  const { allowBlockers, allowNitpicks } = thresholds;

  // human overrules, so an overruled level counts as terminal for unlock
  const overruledLevels = await getStoneGuardOverruledLevels({
    stone: input.stone,
    route: input.route,
  });

  // the level-unlock latch — levels that have already poured. once a level begins it
  // keeps its door open, so a later regression at a lower level can never shut it again
  // (define.invariant.review.peer.level-unlock-is-a-latch)
  const levelsPoured = await getStoneGuardLevelsPoured({
    stone: input.stone,
    route: input.route,
  });

  // the levels, ascending — a level pours only once the level before it settled
  // .why = the gate must read a settled snapshot; a concurrent pour that reads a
  //        co-member mid-write would produce a nondeterministic gate. the level is the
  //        natural seam because `isReviewLevelUnlocked` only reads entries below it, so
  //        a same-level verdict never moves the gate
  const levelsAsc = getAllReviewLevelsAsc({ peers: peerReviewsWithIndex });

  // keep peer-review artifacts out of git, once for the whole pass
  // .why = a read-then-write findsert; under a concurrent pour every lane could become
  //        a writer of one shared file, so it is hoisted here. the content is a
  //        compile-time constant, so multiple writers were never a correctness bug —
  //        only an undeclared cross-lane write that a future dynamic value would corrupt
  await findsertReviewPeerGitignore({ route: input.route });

  // the $targets list, computed at most once for the whole pass
  // .why = it costs a git read of the whole branch and is identical for every lane of
  //        one pass (one route, one hash, one since-main range)
  // .note = lazy and shared in flight — see `genOnceOfPromise`
  const getTargetsOfPass = genOnceOfPromise({
    read: async () => getAllStoneGuardReviewTargetPaths({ repoRoot: gitRoot }),
  });

  // the level bound, read once for the whole pass
  // .why = it has two consumers — the bottleneck that enforces it and the announce
  //        that displays it — so the number shown must equal the number enforced
  const levelConcurrency = getOneDefaultLevelConcurrency();

  // the bound every level inherits, and one bound per declared concurrency group
  // .note = only one level pours at a time, so one instance of each is correct
  const levelBottleneck = genBottleneck({ concurrency: levelConcurrency });
  const bottleneckByGroup = new Map<string, Bottleneck>(
    Object.entries(input.guard.reviews.groups ?? {}).map(([name, group]) => [
      name,
      genBottleneck({ concurrency: group.concurrency }),
    ]),
  );

  /**
   * .what = the reviewer metadata every progress event carries, roster included
   * .why = the roster rides the event rather than the second argument, because
   *        `setStoneAsPassed` wraps `cliEmit` and replaces that argument with the
   *        guard-wide step position — a roster passed there never arrives
   * .note = the roster (`slots`) is built fresh per level by `asLevelSlotByIndex` and
   *         handed in, so no map is shared or mutated across levels
   */
  const asEventReviewer = (input: {
    pr: (typeof peerReviewsWithIndex)[number];
    rounds: number;
    slots: Map<number, { index: number; total: number }>;
  }) => ({
    index: input.pr.index,
    slug: input.pr.slug,
    level: input.pr.level,
    budget: input.pr.budget,
    rounds: input.rounds,
    // a pour event always carries a slot; `slots` holds the whole roster of the level
    // that emits, so an absent slot here is an invariant breach — the throw makes it
    // impossible rather than silent
    slot:
      input.slots.get(input.pr.index) ??
      UnexpectedCodePathError.throw(
        'a level-pour progress event has no declared slot — its index is absent from the level roster',
        { index: input.pr.index, slug: input.pr.slug, level: input.pr.level },
      ),
  });

  /**
   * .what = emit the progress event of a lane held without a run — cached clean, set
   *         aside by dispute, held at exhaustion, or a cached rejection reused
   * .why = the four short circuits emit one payload shape; one builder means a new event
   *        field lands in all four, never in three with the fourth tree silently different
   */
  const emitReviewHeld = ({
    pr,
    rounds,
    slots,
    review,
    mark,
  }: {
    pr: (typeof peerReviewsWithIndex)[number];
    rounds: number;
    slots: Map<number, { index: number; total: number }>;
    review: RouteStoneGuardReviewArtifact | null;
    mark: 'exhausted' | 'disputed' | null;
  }): void =>
    context.cliEmit.onGuardProgress({
      stone: input.stone,
      step: { phase: 'review', index: pr.arrayIndex },
      reviewer: asEventReviewer({ pr, rounds, slots }),
      inflight: null,
      outcome: {
        path: review
          ? asGuardDisplayPath({ pathAbsolute: review.path, root: gitRoot })
          : null,
        review: {
          ...(mark === 'exhausted' ? { exhausted: true } : {}),
          ...(mark === 'disputed' ? { disputed: true } : {}),
          blockers: review?.blockers ?? 0,
          nitpicks: review?.nitpicks ?? 0,
        },
        judge: null,
      },
    });

  /**
   * .what = the whole of one reviewer's pass — emit, run, meter, artifact — poured
   *         inside the bounds that govern it
   * .why = bound selection and nest order are `runWithinConcurrencyBounds`'s own concern
   * .note = answers the reviewer's declared index beside the artifact, so the caller
   *         needs no correlation with settle order (`Promise.allSettled` preserves
   *         input order, but a positional read would credit one reviewer's review to
   *         another, silently)
   */
  const runOneBounded = async ({
    pr,
    slots,
    meet,
  }: {
    pr: (typeof peerReviewsWithIndex)[number];
    slots: Map<number, { index: number; total: number }>;
    meet: 'join' | 'skip';
  }): Promise<{ index: number; artifact: RouteStoneGuardReviewArtifact }> => {
    const run = async (): Promise<RouteStoneGuardReviewArtifact> => {
      const rounds = meterBySlug.get(pr.slug)?.rounds ?? 0;

      // emit inflight event before review
      const beganAt = new Date().toISOString();
      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'review', index: pr.arrayIndex },
        reviewer: asEventReviewer({ pr, rounds, slots }),
        inflight: { beganAt, endedAt: null },
        outcome: null,
      });

      const review = await runOneStoneGuardReview(
        {
          stone: input.stone,
          reviewCmd: getReviewPeerRunCmd(pr.review),
          index: pr.index,
          hash: input.hash,
          iteration: input.iteration,
          route: input.route,
          slug: pr.slug,
          timeout: getOneReviewPeerTimeout(pr.review),
          repoRoot: gitRoot,
          getTargetsOfPass,
          meet,
        },
        context,
      );

      // did the reviewer get its turn? — the meter charges on that one question, and the rule
      // lives in `isReviewRoundCompleted` (with its unit clamp; an unreadable review counts 0
      // here and 1 at the passage gate, see `asPeerGivenVerdict`)
      const reviewCompleted = isReviewRoundCompleted({ review });

      // increment meter only when review actually completed
      // .note = the write is an append whose read takes last-per-slug, so two lanes
      //         that settle together interleave lines and clobber no row
      if (reviewCompleted) {
        const newMeter = new RouteStoneGuardReviewPeerMeter({
          stone: input.stone.name,
          reviewer: { slug: pr.slug },
          rounds: rounds + 1,
        });
        await setStoneGuardRoundOutput({
          route: input.route,
          stone: input.stone.name,
          generation: context.guardRound.generation,
          write: () =>
            setRouteStoneGuardReviewPeerMeter({
              meter: newMeter,
              route: input.route,
            }),
        });
        meterBySlug.set(pr.slug, newMeter);
      }

      // emit finished event after review (rounds is +1 only when review completed)
      const roundsAfter = reviewCompleted ? rounds + 1 : rounds;

      const reviewOutcome = asReviewProgressOutcome({
        exitClass: review.exitClass,
        exitCode: review.exitCode,
        blockers: review.blockers,
        nitpicks: review.nitpicks,
        stderr: review.stderr,
      });

      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'review', index: pr.arrayIndex },
        reviewer: asEventReviewer({ pr, rounds: roundsAfter, slots }),
        inflight: { beganAt, endedAt: new Date().toISOString() },
        outcome: {
          path: asGuardDisplayPath({
            pathAbsolute: review.path,
            root: gitRoot,
          }),
          review: reviewOutcome,
          judge: null,
        },
      });

      return review;
    };

    const artifact = await runWithinConcurrencyBounds({
      group: getOneReviewPeerGroup(pr.review),
      level: levelBottleneck,
      byGroup: bottleneckByGroup,
      run,
    });
    return { index: pr.index, artifact };
  };

  // execute peer reviews one level at a time, concurrently within a level
  for (const level of levelsAsc) {
    const members = peerReviewsWithIndex.filter((pr) => pr.level === level);

    // hand the emit path this level's roster, so a settled block can be released in
    // declared order and the tail status line can report how many are left
    const slots = asLevelSlotByIndex({ members });

    // outcomes keyed by declared index, never by settle position
    // .why = `computeGuardData` renders `reviewArtifacts` in array order, so push
    //        order is tree order. a concurrent settle stays invisible to every snapshot
    // .note = deliberate mutation. both are born per level and written once per lane, keyed by
    //         its declared index, so two settles never touch one key. neither escapes the level:
    //         the seal below reads them in declared order into `reviews`
    const artifactByIndex = new Map<number, RouteStoneGuardReviewArtifact>();
    const exhaustedIndices = new Set<number>();

    // the short circuits, decided before the pour — a skip must take no slot
    // .note = deliberate mutation: `toPour` accumulates via `.push` because the loop
    //         does i/o per skip (a disk write and an emit) and must run in declared
    //         order; a `.filter` predicate cannot carry side effects
    const toPour: typeof members = [];
    for (const pr of members) {
      // the cache is keyed by position; a rung whose tenant changed must not reuse it
      const cachedReview = getOneCacheSafePeerReviewArtifact({
        cachedReviews,
        index: pr.index,
        slug: pr.slug,
      });

      const meter = meterBySlug.get(pr.slug);
      const rounds = meter?.rounds ?? 0;

      // skip if already approved (cached with no blockers) — cache check comes before
      // exhaustion check so an already-clean review never spends budget
      if (cachedReview && cachedReview.blockers === 0) {
        emitReviewHeld({ pr, rounds, slots, review: cachedReview, mark: null });
        artifactByIndex.set(pr.index, cachedReview);
        continue;
      }

      // skip a lane whose residual verdict clears once its disputed concerns are
      // subtracted — a dispute is a tally exclusion (S07), so a lane the driver already
      // answered spends no further round on the same point
      // gated on `cachedReview` (this lane spoke at this hash) so the skip covers one
      // generation, never the stone: move the artifact and the cache misses, and the
      // lane runs again to grade what is new
      // sits beside, not in place of, the clean-cache skip above — that keys on raw
      // `blockers === 0` and folding the two would silently move nitpick-only behavior
      if (cachedReview) {
        const disputed = computeDisputedConcernCounts({
          absorptions,
          givens,
          scope: { slug: pr.slug },
        });

        if (
          isLaneSkippedByDispute({
            cachedReview,
            disputed,
            allowBlockers,
            allowNitpicks,
          })
        ) {
          // the marker, or the skip is invisible: the counts are re-emitted from cache,
          // so with no marker the live tree paints a stale rejection as fresh
          // (rule.require.status-feedback)
          emitReviewHeld({
            pr,
            rounds,
            slots,
            review: cachedReview,
            mark: 'disputed',
          });
          artifactByIndex.set(pr.index, cachedReview);
          continue;
        }
      }

      // compute verdict (exhaustion check): wasExhausted = rounds >= budget
      const wasExhausted = rounds >= pr.budget;
      const verdict = computeReviewPeerVerdict({
        rounds,
        budget: pr.budget,
        blockers: cachedReview?.blockers ?? Infinity,
        nitpicks: cachedReview?.nitpicks ?? 0,
        exitClass: cachedReview?.exitClass,
        allowBlockers,
        allowNitpicks,
        wasExhausted,
      });

      // skip if exhausted, still holding the latest review for display
      if (isReviewPeerVerdictExhausted(verdict)) {
        // hash may have changed since exhaustion, so look up this reviewer's latest by
        // slug (never by index — this reach can straddle a config change where a
        // retired reviewer's rung was reused by its successor)
        const reviewForDisplay =
          cachedReview ??
          (await getOneLatestReviewArtifactForSlug({
            stone: input.stone,
            index: pr.index,
            slug: pr.slug,
            route: input.route,
          }));

        if (reviewForDisplay) {
          artifactByIndex.set(pr.index, reviewForDisplay);
        }
        emitReviewHeld({
          pr,
          rounds,
          slots,
          review: reviewForDisplay,
          mark: 'exhausted',
        });
        exhaustedIndices.add(pr.index);
        continue;
      }

      // if cached with blockers, reuse the cached rejection unless the driver posted a
      // fresh response — a .taken.by_self newer than this given. for a --conversation
      // reviewer that means "reconsider" (re-run so it can see the taken and drop a
      // refuted blocker); a blind reviewer always reuses, spending no round
      if (cachedReview && cachedReview.blockers > 0) {
        const optedIntoConversation = isCmdOfRuntimeVar({
          cmd: getReviewPeerRunCmd(pr.review),
          name: '$conversation',
        });
        const shouldReconsider =
          optedIntoConversation &&
          (await isPeerTakenNewerThanGiven({ pathGiven: cachedReview.path }));

        if (!shouldReconsider) {
          // budget not consumed here — no review command runs; it was consumed
          // when the review originally ran
          emitReviewHeld({
            pr,
            rounds,
            slots,
            review: cachedReview,
            mark: null,
          });

          // still add to reviews array for judge to see
          artifactByIndex.set(pr.index, cachedReview);
          continue;
        }
        // else: a fresh response exists → fall through to re-run with --conversation
      }

      toPour.push(pr);
    }

    // the gate, read once per level on a settled snapshot
    // .why = cheap (low level) runs first, expensive (high level) only after cheap
    //        clears. reads the shared clearance ladder (overrule as an explicit flag),
    //        so it never disagrees with the passage judge reading the same primitive
    const clearance = getStoneGuardLevelClearance({
      reviewers: getAllReviewPeerVerdicts({
        peers: peerReviewsWithIndex,
        meterBySlug,
        reviews,
        cachedReviews,
        exhaustedSlugs: exhaustedReviewerSlugs,
        allowBlockers,
        allowNitpicks,
      }),
      overruledLevels,
    });
    // `levelsPoured` is the latch: a level already begun keeps its door open, whatever
    // the ladder now says (define.invariant.review.peer.level-unlock-is-a-latch)
    const canRun = isReviewLevelUnlocked({ clearance, level, levelsPoured });

    // announce the pour on genuine stderr, once, before any lane launches, so a piped
    // log can tell "this level is slow" from "this level never began"
    // .note = the concurrency bound shown is computed the same way
    //         `runWithinConcurrencyBounds` nests it, so the number displayed matches
    //         the number enforced
    const announce = asReviewLevelPourAnnounce({
      level,
      members: toPour.map((pr) => ({ index: pr.index, slug: pr.slug })),
      concurrency: getOneReviewLevelPourBound({
        members: toPour.map((pr) => ({
          group: getOneReviewPeerGroup(pr.review),
        })),
        levelConcurrency,
        groups: input.guard.reviews.groups ?? {},
      }),
    });
    // advise the author where an ungrouped lane pours past a co-member's bound
    // .why = fulcrum F13, option G. an ungrouped lane contends for a level slot only, so
    //        a level whose grouped members pour one-at-a-time behind a provider ratelimit
    //        still admits its ungrouped co-member alongside them, which slips past the
    //        ratelimit in silence. an advisory rather than a refusal because the mix is
    //        sometimes exactly what the author wants and no parser can tell the two
    //        apart — only the guard author knows which reviewers share a ratelimit
    // .why here rather than at parse = the failure is an absence, legible only once the
    //        roster is in hand, at the pour, where the author is watchful
    // .why stderr = the live frames already go there; the frozen guard-tree oracles are
    //        captured off stdout, so an advisory here moves none of them
    // .why over `toPour` = it must be the lanes that will actually pour, so a
    //        cached-approved or exhausted lane is never counted as a leaker
    // .note = it sits above the announce: it says "this level's bound is about to be
    //         escaped", the announce says "here is the bound" — reversed, the pair would
    //         read as a claim then its retraction
    const [concurrencyGroupLeak] = getAllConcurrencyGroupLeaks({
      peers: toPour.map((pr) => ({
        slug: pr.slug,
        level: pr.level,
        group: getOneReviewPeerGroup(pr.review),
      })),
    });
    if (canRun && concurrencyGroupLeak)
      console.error(asConcurrencyGroupLeakAdvisory(concurrencyGroupLeak));
    if (canRun && announce) console.error(announce);

    // the pour. the prime meet is the pour's to grant: a level that pours two or more
    // lanes has peers to gather, and a lone lane has none, so it never waits on a meet
    // .note = the guard is the one party that knows its peers. a review child alone
    //         is no such evidence (a streamed `review.by --for` lane is a child too),
    //         so the lane learns it from here and from no subprocess marker
    const meet = getOneReviewLevelPrimeMeet({ lanes: toPour.length });
    const settled = canRun
      ? await Promise.allSettled(
          toPour.map((pr) => runOneBounded({ pr, slots, meet })),
        )
      : [];

    // latch the level the first time it opens — once poured, always poured. the gate
    // above is recomputed from scratch every pass, so a lower level that reads terminal
    // now can read non-terminal later; this record holds the door open across that, so
    // a lane the driver is already in conversation with is never withdrawn
    // (define.invariant.review.peer.level-unlock-is-a-latch)
    // .note = the condition is a genuine pour (`canRun && toPour.length`), never
    //         `canRun` alone: `canRun` is the gate's derived output, `poured` is an
    //         input recorded once — collapsing the two onto one name would be the
    //         synonym rule.forbid.ambiguous-labels forbids
    // .note = an all-cached level releases no lane here and still stays latched,
    //         because the pass that minted those caches poured and latched then
    if (canRun && toPour.length > 0 && !levelsPoured.has(level)) {
      levelsPoured.add(level);
      await setStoneGuardRoundOutput({
        route: input.route,
        stone: input.stone.name,
        generation: context.guardRound.generation,
        write: () =>
          setPassageReport({
            report: new PassageReport({
              stone: input.stone.name,
              status: 'poured',
              level,
            }),
            route: input.route,
          }),
      });
    }

    // merge by declared index, never by settle position
    // .why = `pr.index` is a durable identity key written into the artifact filename
    //        and read back as the cache key; re-derive it from completion order and it
    //        would silently credit one reviewer's review to another
    for (const outcome of settled)
      if (outcome.status === 'fulfilled')
        artifactByIndex.set(outcome.value.index, outcome.value.artifact);

    // a co-member that threw must not cancel the ones still aloft — hence
    // allSettled, never Promise.all. captured here, thrown below after the level
    // settles, so the merge above is never skipped on this path
    const rejected = settled.find(
      (outcome): outcome is PromiseRejectedResult =>
        outcome.status === 'rejected',
    );

    // the queued, when the level never opened
    if (!canRun)
      for (const pr of toPour)
        context.cliEmit.onGuardProgress({
          stone: input.stone,
          step: { phase: 'review', index: pr.arrayIndex },
          reviewer: asEventReviewer({
            pr,
            rounds: meterBySlug.get(pr.slug)?.rounds ?? 0,
            slots,
          }),
          inflight: null,
          outcome: {
            path: null,
            review: {
              queued: true,
              awaits: getOneReviewLevelAwaited({ clearance, level }),
            },
            judge: null,
          },
        });

    // settle the level, in declared order
    for (const pr of members) {
      const artifact = artifactByIndex.get(pr.index);
      if (artifact) reviews.push(artifact);
      if (exhaustedIndices.has(pr.index)) exhaustedReviewerSlugs.push(pr.slug);
    }

    // a lane that threw propagates now, with the level's fulfilled co-members
    // already merged above
    if (rejected) throw rejected.reason;
  }

  return { artifacts: reviews, exhaustedReviewerSlugs };
};
