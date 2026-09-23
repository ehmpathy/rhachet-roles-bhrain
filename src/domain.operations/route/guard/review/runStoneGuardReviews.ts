import * as fs from 'fs/promises';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import type { IsoDuration } from 'iso-time';
import * as path from 'path';
import { type Bottleneck, genBottleneck } from 'with-bottleneck';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import {
  getGuardPeerReviews,
  getReviewPeerRunCmd,
  type RouteStoneGuard,
  type RouteStoneGuardReviewPeer,
} from '@src/domain.objects/Driver/RouteStoneGuard';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import { asGuardPositiveInt } from '../../../asGuardPositiveInt';
import { runOneReview } from '../../../review/runOneReview';
import {
  type ContextReviewBrainSupply,
  FIXED_FALLBACK_BRAIN,
} from '../../genReviewBrainSupply';
import { findsertReviewPeerGitignore } from '../../gitignore/findsertReviewPeerGitignore';
import { getStoneGuardLevelsPoured } from '../../judges/getStoneGuardLevelsPoured';
import { getStoneGuardOverruledLevels } from '../../judges/getStoneGuardOverruledLevels';
import { setPassageReport } from '../../passage/setPassageReport';
import { getAllStoneGuardArtifactsByHash } from '../artifact/getAllStoneGuardArtifactsByHash';
import { asGuardDisplayPath } from '../asGuardDisplayPath';
import { asStoneGuardCounter } from '../asStoneGuardCounter';
import { getExitCodeClass } from '../getExitCodeClass';
import { getRepoRootWithFallback } from '../getRepoRootWithFallback';
import { isENOENT } from '../isENOENT';
import {
  RUNTIME_GUARD_VAR_NAMES,
  type RuntimeGuardVarName,
} from '../RUNTIME_GUARD_VAR_NAMES';
import { formatArtifactFooters } from '../tree/formatArtifactFooters';
import { formatArtifactStreamBuckets } from '../tree/formatArtifactStreamBuckets';
import { asConcurrencyGroupLeakAdvisory } from './asConcurrencyGroupLeakAdvisory';
import { asReviewLevelPourAnnounce } from './asReviewLevelPourAnnounce';
import { asReviewProgressOutcome } from './asReviewProgressOutcome';
import { computeReviewCompleted } from './computeReviewCompleted';
import { getAllConcurrencyGroupLeaks } from './getAllConcurrencyGroupLeaks';
import { getAllReviewLevelsAsc } from './getAllReviewLevelsAsc';
import { getOneReviewLevelPourBound } from './getOneReviewLevelPourBound';
import { asSanitizedPeerReviewSlug } from './peer/asSanitizedPeerReviewSlug';
import { enumRouteGuardReviewPeerConversationFiles } from './peer/enumRouteGuardReviewPeerConversationFiles';
import { getCacheSafePeerReviewArtifact } from './peer/getCacheSafePeerReviewArtifact';
import { getLatestReviewArtifactForSlug } from './peer/getLatestReviewArtifactForSlug';
import { getRouteGuardReviewPeerPathTaken } from './peer/getRouteGuardReviewPeerPathTaken';
import { computeDisputedConcernCounts } from './peer/getStoneDisputedConcernCounts';
import { getStoneReviewCorpus } from './peer/getStoneReviewCorpus';
import { isLaneSkippedByDispute } from './peer/isLaneSkippedByDispute';
import { computeReviewPeerVerdict } from './peer/meter/computeReviewPeerVerdict';
import { getAllRouteStoneGuardReviewPeerMeters } from './peer/meter/getAllRouteStoneGuardReviewPeerMeters';
import { getReviewedJudgeThresholds } from './peer/meter/getReviewedJudgeThresholds';
import { getStoneGuardLevelClearance } from './peer/meter/getStoneGuardLevelClearance';
import { isReviewLevelUnlocked } from './peer/meter/isReviewLevelUnlocked';
import { isReviewPeerSkippedForBudget } from './peer/meter/isReviewPeerSkippedForBudget';
import { isReviewPeerVerdictExhausted } from './peer/meter/isReviewPeerVerdictExhausted';
import { setRouteStoneGuardReviewPeerMeter } from './peer/meter/setRouteStoneGuardReviewPeerMeter';
import { runWithinConcurrencyBounds } from './runWithinConcurrencyBounds';

/**
 * .what = extracts slug from peer review
 * .why = accessor for slug
 */
const getReviewPeerSlug = (review: RouteStoneGuardReviewPeer): string =>
  review.slug;

/**
 * .what = extracts level from peer review
 * .why = accessor for level with default
 */
const getReviewPeerLevel = (review: RouteStoneGuardReviewPeer): number =>
  review.level ?? 1;

/**
 * .what = extracts budget from peer review
 * .why = accessor for budget
 */
const getReviewPeerBudget = (review: RouteStoneGuardReviewPeer): number =>
  review.budget;

/**
 * .what = default timeout for review command execution
 * .why = preserves backwards compat when timeout not specified
 */
const DEFAULT_REVIEW_TIMEOUT: IsoDuration = 'PT21M';

/**
 * .what = extracts timeout from peer review
 * .why = accessor for timeout with default
 */
const getReviewPeerTimeout = (review: RouteStoneGuardReviewPeer): IsoDuration =>
  review.timeout ?? DEFAULT_REVIEW_TIMEOUT;

/**
 * .what = the concurrency group this reviewer joins, if it declared one
 * .why = accessor for membership; a reviewer that names none contends with no
 *        other reviewer for a group slot
 */
const getReviewPeerGroup = (review: RouteStoneGuardReviewPeer): string | null =>
  review.group ?? null;

/**
 * .what = how many reviews may be in flight at one level when no group binds them
 * .why = the wisher retracted their own "l1 is infinite" mid-round:
 *        "ets expect that even l1 may have a bottleneck of 10 in parallel."
 *        so a permissive-but-bounded default is the floor every level inherits.
 *
 * .note = this bound is LEVEL-WIDE and a group bound is NARROWER. a grouped
 *         reviewer answers to both; a groupless one answers only to this. that
 *         is what "a groupless reviewer contends with nobody" means — nobody's
 *         GROUP, never nobody at all.
 *
 * .note = at ten or fewer members this bound and an unbounded one are
 *         indistinguishable, so it changes no extant guard whose level is
 *         smaller than it. this repo's own widest level holds eight.
 */
const DEFAULT_LEVEL_CONCURRENCY = 10;

/**
 * .what = the level default, as an operator may override it at run time
 * .why = the number above is fulcrum F2's OPEN call — permissive is settled, the
 *        value is not, and it awaits the wisher. so an operator must be able to
 *        move it without a code edit and a snapshot re-baseline, which is the
 *        cheapest de-risk available while the fulcrum stands unruled.
 *
 * .note = it reuses an extant precedent in this same file family, rather than a
 *         freshly coined one — `RHACHET_REVIEW_TIMEOUT_MS` (`runOneReview.ts`,
 *         `stepReview.ts`) and `RHACHET_FALLBACK_BRAIN_TIMEOUT_MS`
 *         (`getReviewCountsViaBrain.ts`) each let an operator override a risky
 *         default the same way.
 *
 * 🟡 .note = it is STRICTER than that precedent, deliberately. the timeout
 *     overrides take a bare `parseInt`, which answers `NaN` for a typo — and a
 *     `NaN` concurrency does not merely bind wrong, it makes every bottleneck
 *     comparison false. so this reads through `asGuardPositiveInt`, the same
 *     transformer `concurrency:`, `budget:`, and `level:` already read through,
 *     and a typo is refused loudly at the first pour rather than absorbed.
 */
const getDefaultLevelConcurrency = (): number =>
  process.env.RHACHET_LEVEL_CONCURRENCY !== undefined
    ? asGuardPositiveInt({
        raw: process.env.RHACHET_LEVEL_CONCURRENCY,
        key: 'concurrency',
        at: 'env RHACHET_LEVEL_CONCURRENCY',
      })
    : DEFAULT_LEVEL_CONCURRENCY;

/**
 * .what = executes a single guard review command and produces review artifact
 * .why = enables guard to validate stone artifacts via review tools
 */
export const runOneStoneGuardReview = async (
  input: {
    stone: RouteStone;
    reviewCmd: string;
    index: number;
    hash: string;
    iteration: number;
    route: string;
    slug: string;
    timeout: IsoDuration;
  },
  context: ContextReviewBrainSupply,
): Promise<RouteStoneGuardReviewArtifact> => {
  // ensure .reviews/peer directory found or created
  // .why = peer reviews go to .reviews/peer/ so drivers can read them
  //        (.route/ is sealed by route.mutate.guard)
  // .note = `mkdir --recursive` is the ONE cross-lane write this function keeps.
  //          it is race-free by fs semantics — it never raises EEXIST — so N lanes
  //          that arrive together converge on one directory and no write is lost.
  //          the `.gitignore` findsert that once sat beside it is NOT race-free in
  //          that way, so it was hoisted to the guard pass; the argument lives at
  //          its one call site in `runStoneGuardReviews`
  const reviewsDir = path.join(input.route, '.reviews', 'peer');
  await fs.mkdir(reviewsDir, { recursive: true });

  // lookup repo root for $rhx/$rhachet paths (cwd fallback when not in a git repo)
  const repoRoot = await getRepoRootWithFallback({ from: input.route });

  // validate no npx patterns before variable substitution
  validateNoNpx(input.reviewCmd);

  // sanitize slug for filename
  // .why = legacy peer reviews use command as slug (e.g., ".test/mock-review.sh")
  //        path separators would create nested directories
  // .note = this is the WRITE side of a grammar the READ side must match exactly
  //         (setStoneAsFeedbackAbsorbed validates `--that <slug>` against these names),
  //         so the rule lives in one transformer rather than two inline copies
  const sanitizedSlug = asSanitizedPeerReviewSlug({ slug: input.slug });

  // generate stdout path (what guard writes) and report path (what review skill writes)
  // .note = symmetric names: stdout is .md, report is .report.md
  const iSeg = asStoneGuardCounter({ value: input.iteration });
  const rSeg = asStoneGuardCounter({ value: input.index });
  const stdoutPath = path.join(
    reviewsDir,
    `${input.stone.name}._.review.i${iSeg}.${input.hash}.r${rSeg}._.given.by_peer.${sanitizedSlug}.md`,
  );
  const reportPath = path.join(
    reviewsDir,
    `${input.stone.name}._.review.i${iSeg}.${input.hash}.r${rSeg}._.given.by_peer.${sanitizedSlug}.report.md`,
  );

  // expand the peer-review conversation for the opt-in $conversation var
  // .why = a reviewer declared with --conversation $conversation sees the full
  //        prior dialogue (every .given + .taken). EXCLUDES the current
  //        {iteration, hash} generation so a later reviewer in this same guard
  //        run never sees an earlier reviewer's brand-new, unanswered given (B4)
  const conversationFiles = await enumRouteGuardReviewPeerConversationFiles({
    route: input.route,
    stone: input.stone.name,
    exclude: { iteration: input.iteration, hash: input.hash },
  });
  // .why = convert to repo-root-relative paths so $conversation matches the
  //        cwd-relative convention every reviewer runs under (reviewer cwd =
  //        repoRoot). the enumerator yields absolute paths; a raw absolute in
  //        the value breaks a consumer that joins it onto cwd (path.join doubles
  //        the path). this mirrors the path.relative(repoRoot, ...) the stdout
  //        tree already uses for display paths.
  // .note = COMMA-joined (not space) so $conversation expands to ONE shell token.
  //         a consumer parses it as a single flag value + splits on comma — no
  //         variadic multi-token consumption needed (review file paths hold no comma).
  const conversation = conversationFiles
    .map((file) => path.relative(repoRoot, file))
    .join(',');

  // substitute variables in command
  // .note = $output points to report path (for review skill to write)
  const cmd = substituteVars(input.reviewCmd, {
    stone: input.stone.name,
    route: input.route,
    hash: input.hash,
    output: reportPath,
    conversation,
    repoRoot,
  });

  // dispatch the shared review runner: exec + capture + tally + malfunction-promotion
  // .why = one execution path shared with review.by — no in-process fork that would drift
  //        from this subprocess path over time. the guard only wraps the result into its
  //        artifact below. see src/domain.operations/review/runOneReview.ts.
  const run = await runOneReview(
    { cmd, timeout: input.timeout, cwd: repoRoot },
    context,
  );
  const { stdout, stderr, exitCode, blockers, nitpicks, tallier, durationMs } =
    run;

  // classify exit code (after possible malfunction promotion)
  const exitClass = getExitCodeClass({ code: exitCode });

  // format artifact content with tree buckets; an empty stream earns no box.
  // TWO footers can follow here — the passage footer below (non-zero exit) and the
  // tally footer further down (a detected verdict) — and either one means the last
  // stream bucket is NOT the artifact's final child.
  const artifactLines: string[] = [
    ...formatArtifactStreamBuckets({
      stdout,
      stderr,
      hasFooter: exitCode !== 0 || run.detected,
    }),
  ];

  // both footers, composed together so exactly ONE of them carries the terminal marker.
  //
  // 🔴 they used to be pushed by two independent blocks, each of which hardcoded `└─`
  //    because each was authored as though it were last. when BOTH fired — a non-zero exit
  //    whose verdict was still readable — the artifact rendered two terminal branches at one
  //    level, which no other artifact in the corpus does
  //    (r6 ergo-snapshot-visual-blemishes, blocker.1, i019).
  //
  // ⚠️ the comment above already knew two footers could follow; what it missed is that the
  //    footers collide with EACH OTHER, not merely with the stream buckets. so the marker is
  //    now derived in one place, exactly as `formatArtifactStreamBuckets` derives its own.
  //
  // .note = the tally is persisted so a cache re-read recovers the SAME counts (and the
  //         tactic) with NO brain call. it is the LAST numeric declaration, so
  //         getReviewCountsViaRegex's last-match recovers it, and the `tallied by reviewer@`
  //         line lets getReviewTacticFromContent recover the tactic. this is one segment of a
  //         single authored write (an upsert that replaces the file wholesale), so a rerun
  //         re-authors the same content and cannot stack footers.
  artifactLines.push(
    ...formatArtifactFooters({
      passage:
        exitCode !== 0
          ? {
              blockReason:
                exitClass === 'constraint'
                  ? 'blocked by constraints'
                  : 'blocked by malfunction',
              exitCode,
              exitEmoji: exitClass === 'constraint' ? '✋' : '💥',
            }
          : null,
      tally: run.detected
        ? {
            blockers,
            nitpicks,
            talliedBy:
              tallier === 'probabilistic' ? FIXED_FALLBACK_BRAIN : null,
          }
        : null,
    }),
  );

  const artifactContent = artifactLines.join('\n');

  // write stdout artifact file
  await fs.writeFile(stdoutPath, artifactContent);

  return new RouteStoneGuardReviewArtifact({
    stone: { path: input.stone.path },
    hash: input.hash,
    iteration: input.iteration,
    index: input.index,
    path: stdoutPath,
    blockers,
    nitpicks,
    tallier,
    exitCode,
    exitClass,
    stdout,
    stderr,
    durationMs,
  });
};

/**
 * .what = decides whether the driver has posted a response newer than a given
 * .why = a .taken.by_self written after its .given.by_peer means "reconsider" —
 *        it forces a conversation-enabled reviewer to re-run so it can see the
 *        response and drop a refuted blocker. once the reviewer re-runs it
 *        overwrites the given (newer mtime), so the trigger clears and the loop
 *        terminates; a further response bumps the taken newer again (a fresh
 *        round, bounded by budget).
 */
const hasResponseNewerThanReview = async (input: {
  pathGiven: string;
}): Promise<boolean> => {
  const pathTaken = getRouteGuardReviewPeerPathTaken({
    pathGiven: input.pathGiven,
  });
  try {
    const [givenStat, takenStat] = await Promise.all([
      fs.stat(input.pathGiven),
      fs.stat(pathTaken),
    ]);
    return takenStat.mtimeMs > givenStat.mtimeMs;
  } catch (error) {
    // no taken (or no given) on disk → no response to reconsider
    if (isENOENT(error)) return false;
    throw error;
  }
};

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
  context: ContextCliEmit & ContextReviewBrainSupply,
): Promise<{
  artifacts: RouteStoneGuardReviewArtifact[];
  exhaustedReviewerSlugs: string[];
}> => {
  // lookup git root for path relativization
  // .why = paths in output should be relative to git root (e.g., .behavior/v.../...), not route
  const gitRoot = await getRepoRootWithFallback({ from: input.route });

  // get prior artifacts for this hash to determine which reviews already done
  // reviews are cached by hash: same artifact content = reuse prior review
  // this avoids redundant compute when artifact hasn't changed
  const priorArtifacts = await getAllStoneGuardArtifactsByHash({
    stone: input.stone,
    hash: input.hash,
    route: input.route,
  });

  // filter to only cache successful reviews (exitClass === 'passed')
  // .note = errors should not be cached because:
  //         - malfunctions: reviewer may have been fixed and needs re-run
  //         - constraints: artifact may have been fixed and needs re-review
  const cachedReviews = priorArtifacts.reviews.filter(
    (r) => r.exitClass === 'passed',
  );

  // reviews are added as we process each peer review (not pre-populated)
  const reviews: RouteStoneGuardReviewArtifact[] = [];

  // track which reviewers were skipped due to exhaustion in THIS iteration
  const exhaustedReviewerSlugs: string[] = [];

  // load current meters for budget state (per stone)
  // .note = slugs are guaranteed unique at parse time via standardizePeerReviewSlugs
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone.name,
  });
  const meterBySlug = new Map<string, RouteStoneGuardReviewPeerMeter>();
  for (const meter of meters) {
    meterBySlug.set(meter.reviewer.slug, meter);
  }

  // the stance corpus, read ONCE for every lane — the per-lane skip below folds over it
  // .why = one read rather than one per reviewer; the fold is pure and cheap
  const { absorptions, givens } = await getStoneReviewCorpus({
    route: input.route,
    stone: input.stone.name,
  });

  // get peer reviews with indices and sort by level (low-to-high = cheapest first)
  // .why = cheap (low level) runs first, expensive (high level) only after cheap clears
  const peerReviews = getGuardPeerReviews(input.guard);
  const peerReviewsWithIndex = peerReviews.map((review, i) => ({
    review,
    index: i + 1,
    arrayIndex: i,
    slug: getReviewPeerSlug(review),
    level: getReviewPeerLevel(review),
    budget: getReviewPeerBudget(review),
  }));
  peerReviewsWithIndex.sort((a, b) => a.level - b.level);

  // get thresholds for verdict computation
  // .why = verdicts need allowBlockers/allowNitpicks from guard judge
  // .note = defaults to (0, 0) when no reviewed? judge is configured
  const thresholds = getReviewedJudgeThresholds(input.guard) ?? {
    allowBlockers: 0,
    allowNitpicks: 0,
  };
  const { allowBlockers, allowNitpicks } = thresholds;

  // load human overrules so an overruled level counts as terminal for unlock
  // .why = after a human overrules l1, l1's blockers are forgiven and l1 is
  //        terminal, so the next level (l3) can run in this same pass
  const overruledLevels = await getStoneGuardOverruledLevels({
    stone: input.stone,
    route: input.route,
  });

  // load the level-unlock LATCH — the levels that have already poured
  // .why = unlock is a latch: once a level has begun to run it keeps its door open,
  //        so a later regression at a LOWER level can never shut it again. read once
  //        here, and added to in place as each level opens below
  //        (define.invariant.review.peer.level-unlock-is-a-latch)
  const levelsPoured = await getStoneGuardLevelsPoured({
    stone: input.stone,
    route: input.route,
  });

  // compute current verdicts for level unlock logic
  const computeVerdicts = () =>
    peerReviewsWithIndex.map((pr) => {
      const meter = meterBySlug.get(pr.slug);
      const rounds = meter?.rounds ?? 0;
      // check fresh reviews first (this run), then cached reviews (prior runs)
      // .note = `reviews` is minted by the CURRENT guard list, so its index is sound.
      //         only the cached side can cross a config change, so only it is guarded
      // 🔴 this verdict drives LEVEL UNLOCK, so a cache from a retired tenant would
      //    unlock a level on a verdict its current reviewer never gave
      // 🔴 `reviews` is NOT a list of reviews that ran this pass. a level's settle
      //    pushes whatever artifact each member should DISPLAY, and for a member
      //    skipped for want of budget that is its own stale cached review (search
      //    `reviewForDisplay` below). so this is the artifact to SHOW, never proof
      //    of a run — do not read it as one.
      const artifactThisPass = reviews.find((r) => r.index === pr.index);
      const cachedReview = getCacheSafePeerReviewArtifact({
        cachedReviews,
        index: pr.index,
        slug: pr.slug,
      });
      const review = artifactThisPass ?? cachedReview;
      const blockers = review?.blockers ?? Infinity;
      // wasExhausted = this reviewer was SKIPPED for want of budget, never merely
      // spent-out. the leaf owns the precedence between its two clauses and the
      // reasons for each; it was lifted out of this closure at i031/r3 because the
      // one boolean the level gate turns on read as an expression to simulate
      // rather than as a named claim (`rule.forbid.inline-decode-friction`)
      const wasExhausted = isReviewPeerSkippedForBudget({
        slug: pr.slug,
        exhaustedSlugs: exhaustedReviewerSlugs,
        hasArtifactThisPass: !!artifactThisPass,
        rounds,
        budget: pr.budget,
      });
      return {
        slug: pr.slug,
        level: pr.level,
        verdict: computeReviewPeerVerdict({
          rounds,
          budget: pr.budget,
          blockers,
          nitpicks: review?.nitpicks ?? 0,
          exitClass: review?.exitClass,
          allowBlockers,
          allowNitpicks,
          wasExhausted,
        }),
      };
    });

  // the levels, ascending — a level pours only once the level before it settled
  // .why = the gate must read a SETTLED snapshot. the serial walk recomputed it
  //        per reviewer, which under a concurrent pour would read a co-member
  //        mid-write — a nondeterministic gate on a decision that spends budget,
  //        and it would present as flake rather than as a defect. the level is
  //        the natural seam because `isReviewLevelUnlocked` only ever reads
  //        entries BELOW a level, so a same-level verdict never moved the gate.
  const levelsAsc = getAllReviewLevelsAsc({ peers: peerReviewsWithIndex });

  // keep peer-review artifacts out of git, ONCE for the whole pass
  // .why = guard runs spam git with one artifact per reviewer/iteration/hash, so
  //        the `.gitignore` is owed before any lane writes into `.reviews/peer/`
  //
  // 🔴 .why it runs HERE rather than per-lane = it is a read-then-write findsert,
  //     so N lanes at the head of `runOneStoneGuardReview` each read ENOENT and
  //     each then write. under the old serial walk that could not happen; the
  //     concurrent pour made every lane a writer of one shared file.
  //
  //     ⚠️ the content is a compile-time constant, so every one of those writers
  //       wrote identical bytes and no run was ever corrupted. the defect is that
  //       an undeclared cross-lane write is one nobody prices — the next author to
  //       make that content dynamic inherits a real lost-update race with no note
  //       to warn them. hoisted, there is exactly one writer and the question
  //       cannot arise
  await findsertReviewPeerGitignore({ route: input.route });

  // the level bound, read ONCE for the whole pass
  // .why = it has two consumers — the bottleneck that ENFORCES it and the
  //        announce that DISPLAYS it — and a number displayed that differs from
  //        the number enforced is a lie no error reports. two independent reads
  //        agree only by the accident that the env var is immutable, so the
  //        agreement is derived here rather than assumed twice. raised i011/r6
  const levelConcurrency = getDefaultLevelConcurrency();

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
   * .what = each reviewer's DECLARED slot within its level, and the level's size
   * .why = the emit path buffers a settled block and releases it in declared
   *        order, which it can only do against a roster it was handed. `total`
   *        is also what lets its tail status line report how many are LEFT
   * .note = re-keyed at the head of every level; only one level pours at a time.
   *         cleared and repopulated rather than reassigned, so it stays `const`
   *         — the same shape `genContextCliEmit` uses for its own per-wave state
   *         (`waveInflight.clear()`), and what `rule.require.immutable-vars` asks
   */
  const levelSlotByIndex = new Map<number, { index: number; total: number }>();

  /**
   * .what = the reviewer metadata every progress event carries, roster included
   * .why = the roster rides the EVENT rather than the second argument, because
   *        `setStoneAsPassed` wraps `cliEmit` and replaces that argument with the
   *        guard-wide step position. a roster passed there never arrives
   */
  const asEventReviewer = (input: {
    pr: (typeof peerReviewsWithIndex)[number];
    rounds: number;
  }) => ({
    index: input.pr.index,
    slug: input.pr.slug,
    level: input.pr.level,
    budget: input.pr.budget,
    rounds: input.rounds,
    // 🔴 a pour event ALWAYS carries a slot, or it fails loud here — never falls
    //    silently to the un-buffered emit path.
    // .why = `GuardProgressEvent.reviewer.slot` is optional on the CONTRACT because
    //        other producers (the status line, a non-pour display) legitimately
    //        carry no level slot — and `genContextCliEmit` reads `slot ?? null` to
    //        serve them the un-buffered render. but every emit from THIS producer is
    //        a level-pour event, and `levelSlotByIndex` is repopulated with the whole
    //        roster at the head of each level before any emit — so an absent slot
    //        here is an invariant breach, never a legacy display. a bare `.get()`
    //        would route such a breach through the un-buffered path with no signal
    //        (the silent-default shape `rule.forbid.behavior-hazards` names). the
    //        throw makes the one divergent path this producer must never take
    //        impossible rather than silent (r002 blocker.4)
    slot:
      levelSlotByIndex.get(input.pr.index) ??
      UnexpectedCodePathError.throw(
        'a level-pour progress event has no declared slot — its index is absent from the level roster',
        { index: input.pr.index, slug: input.pr.slug, level: input.pr.level },
      ),
  });

  /**
   * .what = the whole of one reviewer's pass — emit, run, meter, artifact —
   *         poured inside the bounds that govern it
   * .why = the bound selection and its nest order are a leaf with a clamp of its
   *        own: `runWithinConcurrencyBounds`. the argument for the order (a group
   *        slot is the one a lane can HOLD while blocked, so it is taken on the
   *        outside) lives there, beside the tests that hold it
   *
   * .note = it answers the reviewer's DECLARED index beside the artifact, so the
   *         caller needs no correlation at all. a bare artifact would leave the
   *         caller to pair `settled[i]` with `toPour[i]` and to recall that
   *         `Promise.allSettled` preserves input order — a positional read whose
   *         breach credits one reviewer's review to another, silently
   *         (r003 nitpick.1; `rule.forbid.inline-decode-friction`)
   */
  const runOneBounded = async (
    pr: (typeof peerReviewsWithIndex)[number],
  ): Promise<{ index: number; artifact: RouteStoneGuardReviewArtifact }> => {
    const run = async (): Promise<RouteStoneGuardReviewArtifact> => {
      const rounds = meterBySlug.get(pr.slug)?.rounds ?? 0;

      // emit inflight event before review
      const beganAt = new Date().toISOString();
      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'review', index: pr.arrayIndex },
        reviewer: asEventReviewer({ pr, rounds }),
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
          timeout: getReviewPeerTimeout(pr.review),
        },
        context,
      );

      // did the reviewer get its turn? — the meter charges on that one question, and the rule
      // lives in `computeReviewCompleted` (with its unit clamp, and the note on why an
      // unreadable review counts 0 here and 1 at the passage gate)
      const reviewCompleted = computeReviewCompleted({
        exitClass: review.exitClass,
        blockers: review.blockers,
      });

      // increment meter only when review actually completed
      // .note = the write is an APPEND whose read takes last-per-slug, so two
      //         lanes that settle together interleave lines and clobber no row
      if (reviewCompleted) {
        const newMeter = new RouteStoneGuardReviewPeerMeter({
          stone: input.stone.name,
          reviewer: { slug: pr.slug },
          rounds: rounds + 1,
        });
        await setRouteStoneGuardReviewPeerMeter({
          meter: newMeter,
          route: input.route,
        });
        meterBySlug.set(pr.slug, newMeter);
      }

      // emit finished event after review
      // .note = rounds is +1 only when review completed
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
        reviewer: asEventReviewer({ pr, rounds: roundsAfter }),
        inflight: { beganAt, endedAt: new Date().toISOString() },
        outcome: {
          // 🔴 this emit handed `review.path` RAW until i003, so a fresh round
          //    printed an absolute path in the progress tree while the guard
          //    report fifteen lines below printed the same artifact repo-relative
          //    (r7 nitpick.1). the three peer emits above always relativized;
          //    only this one — the hot path, the one a driver sees every round —
          //    did not
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
      group: getReviewPeerGroup(pr.review),
      level: levelBottleneck,
      byGroup: bottleneckByGroup,
      run,
    });
    return { index: pr.index, artifact };
  };

  // 🔴 advise the author where an ungrouped lane pours past a co-member's bound
  // .why = fulcrum F13, option G. an ungrouped lane contends for a level slot
  //        only, so a level whose grouped members pour one-at-a-time behind a
  //        provider ratelimit still admits its ungrouped co-member alongside
  //        them. the group's bound is honored and the RATELIMIT is not — the one
  //        outcome the whole feature exists to prevent, and it is SILENT today.
  //
  // .why an ADVISORY rather than a refusal = the mix is sometimes exactly what
  //        an author wants, and no parser can tell that case from the defect.
  //        seed S4: *"only the guard author knows which reviewers share a
  //        ratelimit."* so the valve advises and the author decides.
  //
  // .why HERE rather than at parse = the failure is the ABSENCE of a key, and
  //        `parseStoneGuard` reads what is present. at the pour the roster is in
  //        hand, so the absence is legible — and it lands where the author is
  //        watchful, which a comment in `RouteStoneGuard.ts` never is.
  //
  // .why STDERR = the live frames already go there (`genContextCliEmit`), and
  //        the frozen guard-tree oracles are captured off STDOUT. so an
  //        advisory here moves none of them, and the two streams stay split by
  //        purpose: stderr carries what a human watches, stdout what a test
  //        records.
  // 🔴 .why the leak advisory is computed PER LEVEL, over `toPour` = its whole
  //        claim is "this level is about to pour past a ratelimit", so its
  //        roster must be the lanes that will actually pour. it was hoisted here
  //        over the FULL roster once, which counted a cached-approved or
  //        exhausted lane as a leaker — so a routine re-run whose ungrouped
  //        lanes were all cached printed a leak warn beside a suppressed
  //        announce, and warned of a pour that would not happen. raised i028/r7
  //        (gate the level), then i031/r7 (gate the lane) — one defect at two
  //        grains
  // .why no cost is traded = the transformer walks its input once per level
  //        either way, and `toPour` is a subset of the members it already
  //        walked. so the per-level call is the same total work on less data
  //
  // execute peer reviews one LEVEL at a time, concurrently within a level
  for (const level of levelsAsc) {
    const members = peerReviewsWithIndex.filter((pr) => pr.level === level);

    // hand the emit path this level's roster, so a settled block can be released
    // in DECLARED order and the tail status line can report how many are left
    levelSlotByIndex.clear();
    members.forEach((pr, slot) =>
      levelSlotByIndex.set(pr.index, { index: slot, total: members.length }),
    );

    // outcomes keyed by the reviewer's DECLARED index, never by settle position
    // .why = `computeGuardData` renders `reviewArtifacts` in ARRAY ORDER, so the
    //        push order IS the tree order. collect here and push in declared
    //        order below, and a concurrent settle is invisible to every snapshot
    const artifactByIndex = new Map<number, RouteStoneGuardReviewArtifact>();
    const exhaustedIndices = new Set<number>();

    // ── the short circuits, decided BEFORE the pour ──
    // .why = a skip must take no slot. these reach disk but spawn no subprocess,
    //        so they stay serial and their emit order stays the declared one
    // .note = DELIBERATE MUTATION. `toPour` accumulates via `.push` across the
    //         loop below, which `rule.require.immutable-vars` forbids by default.
    //         a `.filter` cannot serve: the loop does i/o per skip (a disk write
    //         and an emit) and must run in declared order, so the predicate would
    //         carry side effects. the mutation is a single-threaded local that
    //         never escapes this block — it is read once, at the `.map` below
    const toPour: typeof members = [];
    for (const pr of members) {
      // 🔴 the cache is keyed by POSITION; a rung whose tenant changed must not reuse it
      const cachedReview = getCacheSafePeerReviewArtifact({
        cachedReviews,
        index: pr.index,
        slug: pr.slug,
      });

      // lookup meter state for this reviewer (needed for rounds display and verdict)
      const meter = meterBySlug.get(pr.slug);
      const rounds = meter?.rounds ?? 0;

      // skip if already approved (cached with no blockers)
      // .why = per wish: "if that review has said all good already, then its already cached and budget wont be used"
      // .note = cache check MUST come before exhaustion check to honor this contract
      if (cachedReview && cachedReview.blockers === 0) {
        context.cliEmit.onGuardProgress({
          stone: input.stone,
          step: { phase: 'review', index: pr.arrayIndex },
          reviewer: asEventReviewer({ pr, rounds }),
          inflight: null,
          outcome: {
            path: asGuardDisplayPath({
              pathAbsolute: cachedReview.path,
              root: gitRoot,
            }),
            review: {
              blockers: cachedReview.blockers,
              nitpicks: cachedReview.nitpicks,
            },
            judge: null,
          },
        });
        artifactByIndex.set(pr.index, cachedReview);
        continue;
      }

      // 🔴 skip a lane whose RESIDUAL verdict clears once its disputed concerns are subtracted
      // .why = a dispute is a tally exclusion (S07), so a lane that no longer holds the road has
      //        no reason to spend a round on a point the driver already answered and declared a
      //        stance on. acceptance #2: the disagreement consumes no budget.
      //
      // 🔴 .why gated on `cachedReview` = that is what makes S03's per-generation lapse fall out.
      //    a cached artifact means this lane already spoke AT THIS HASH; move the artifact and the
      //    cache misses, so the lane runs again and grades what is NEW — points it has never
      //    raised among them. the skip covers one generation, never the stone.
      //
      // ⚠️ it sits BESIDE the clean-cache skip above, never in place of it. that one keys on raw
      //    `blockers === 0` and is out of this change's scope; to fold the two would silently move
      //    a nitpick-only lane's behavior (case=10).
      //
      // 🔴 .why it sits in the PRE-POUR short-circuit loop = a skip must take no slot
      //    (`toPour` is what the announce, the leak advisory, and the bottlenecks all read).
      //    under the serial walk this decision sat inline with the run; the concurrent pour
      //    split the two, and a dispute-skipped lane that reached `toPour` would be counted
      //    in the level's announced roster and hold a bound it never uses.
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
          context.cliEmit.onGuardProgress({
            stone: input.stone,
            step: { phase: 'review', index: pr.arrayIndex },
            reviewer: asEventReviewer({ pr, rounds }),
            inflight: null,
            outcome: {
              path: asGuardDisplayPath({
                pathAbsolute: cachedReview.path,
                root: gitRoot,
              }),
              // 🔴 the marker, or the skip is invisible. the counts below are the lane's PRIOR
              //    ones, re-emitted from cache — so with no marker the live tree paints a stale
              //    rejection as a fresh one, and a driver reads a lane that fell silent as a lane
              //    that spoke again (`case=4`, and rule.require.status-feedback)
              review: {
                disputed: true,
                blockers: cachedReview.blockers,
                nitpicks: cachedReview.nitpicks,
              },
              judge: null,
            },
          });
          artifactByIndex.set(pr.index, cachedReview);
          continue;
        }
      }

      // compute verdict (exhaustion check)
      // wasExhausted = true when rounds >= budget (we will skip if exhausted)
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

      // skip if exhausted
      // .note = still add latest review for display purposes (shows blockers/nitpicks/path)
      //         when hash changed, cachedReview may be null, so lookup the latest by slug
      if (isReviewPeerVerdictExhausted(verdict)) {
        // use cached review if available; otherwise lookup this reviewer's latest review
        // .why = hash may have changed since exhaustion, but we still need prior review data
        // ⚠️ keyed by SLUG, never by index — this reach crosses hashes, so it can straddle a
        //    config change in which a retired reviewer's rung was reused by its successor
        const reviewForDisplay =
          cachedReview ??
          (await getLatestReviewArtifactForSlug({
            stone: input.stone,
            index: pr.index,
            slug: pr.slug,
            route: input.route,
          }));

        if (reviewForDisplay) {
          artifactByIndex.set(pr.index, reviewForDisplay);
        }
        context.cliEmit.onGuardProgress({
          stone: input.stone,
          step: { phase: 'review', index: pr.arrayIndex },
          reviewer: asEventReviewer({ pr, rounds }),
          inflight: null,
          outcome: {
            path: reviewForDisplay
              ? asGuardDisplayPath({
                  pathAbsolute: reviewForDisplay.path,
                  root: gitRoot,
                })
              : null,
            review: {
              exhausted: true,
              blockers: reviewForDisplay?.blockers ?? 0,
              nitpicks: reviewForDisplay?.nitpicks ?? 0,
            },
            judge: null,
          },
        });
        // track that this reviewer was skipped in THIS iteration
        exhaustedIndices.add(pr.index);
        continue;
      }

      // if cached with blockers, reuse the cached rejection UNLESS the driver has
      // posted a fresh response — a .taken.by_self newer than this given.
      // .why = for a reviewer that opted into --conversation, a fresh response
      //        means "reconsider": fall through to re-run so it can see the taken
      //        and converge (drop a refuted blocker). a blind reviewer (no
      //        --conversation) cannot see the response, so it always reuses — no
      //        wasted round. the re-run below spends a round, so the loop is
      //        bounded by budget.
      if (cachedReview && cachedReview.blockers > 0) {
        const optedIntoConversation = getReviewPeerRunCmd(pr.review).includes(
          '$conversation',
        );
        const shouldReconsider =
          optedIntoConversation &&
          (await hasResponseNewerThanReview({ pathGiven: cachedReview.path }));

        if (!shouldReconsider) {
          // .note = budget NOT consumed here because no actual review command runs
          //         budget was consumed when review originally ran
          context.cliEmit.onGuardProgress({
            stone: input.stone,
            step: { phase: 'review', index: pr.arrayIndex },
            reviewer: asEventReviewer({ pr, rounds }),
            inflight: null,
            outcome: {
              path: asGuardDisplayPath({
                pathAbsolute: cachedReview.path,
                root: gitRoot,
              }),
              review: {
                blockers: cachedReview.blockers,
                nitpicks: cachedReview.nitpicks,
              },
              judge: null,
            },
          });

          // still add to reviews array for judge to see
          artifactByIndex.set(pr.index, cachedReview);
          continue;
        }
        // else: a fresh response exists → fall through to re-run WITH --conversation
      }

      toPour.push(pr);
    }

    // ── the gate, read ONCE per level on a settled snapshot ──
    // .why = cheap (low level) runs first, expensive (high level) only after cheap clears
    // .note = read the shared clearance ladder (overrule as an explicit flag) so this
    //         unlock gate can never disagree with the ladder status / passage judge that
    //         read the same primitive. an overruled level is clear-for-unlock, so higher
    //         levels unlock even if it still holds blockers.
    // .note = one read per level is exactly equivalent to the serial walk's read
    //         per reviewer, because `isReviewLevelUnlocked` filters to entries
    //         BELOW the level asked about — a same-level verdict never moved it
    const clearance = getStoneGuardLevelClearance({
      reviewers: computeVerdicts(),
      overruledLevels,
    });
    // 🔴 `levelsPoured` is the LATCH — a level that has already begun keeps its door
    //    open, whatever the ladder now says. see
    //    define.invariant.review.peer.level-unlock-is-a-latch
    const canRun = isReviewLevelUnlocked({ clearance, level, levelsPoured });

    // 🔴 announce the pour on genuine stderr, once, BEFORE any lane launches
    // .why = the live status line is suppressed entirely under a pipe, for real
    //        arithmetic (`genContextCliEmit.drawStatus` — ~15,750 lines on one
    //        level). but that took the ANNOUNCEMENT with it, so a piped log went
    //        byte-silent from a level's launch to its settle, and a reader could
    //        not part "this level is slow" from "this level never began".
    //        raised i009/r10 point 1, where the tradeoff had been priced as a
    //        binary — spam or silence — and this O(1) third option was skipped
    // .why HERE and not on the emit path = `route.ts` hands the emit
    //        `process.stdout`, so a byte written there is read by 36 frozen peer
    //        snapshots; and a per-lane announce at LAUNCH is a settle race,
    //        measured on `[t5]`. this site holds the roster in DECLARED order
    //        before the first launch, and writes where no oracle reads
    // .note = the same stream and the same shape as the leak advisory above
    // 🔴 .why the bound is COMPUTED and not the level default = the announce
    //        once rendered `levelConcurrency` verbatim, so this repo's own
    //        `route-peer-concurrency` l3 — three lanes in a `concurrency: 1`
    //        group — printed `≤10 at a time` while exactly one lane ran. the
    //        one liveness line misreported the cap it exists to reveal, and the
    //        extant clamp asserted only `pours 4 lanes`, never the `≤N` clause.
    //        raised i011/r9. the arithmetic and its clamp are the leaf's
    const announce = asReviewLevelPourAnnounce({
      level,
      members: toPour.map((pr) => ({ index: pr.index, slug: pr.slug })),
      // .why = derived from the SAME two inputs `runWithinConcurrencyBounds`
      //        nests — this level's group bounds inside `levelConcurrency` — so
      //        the number displayed is the number enforced
      concurrency: getOneReviewLevelPourBound({
        members: toPour.map((pr) => ({ group: getReviewPeerGroup(pr.review) })),
        levelConcurrency,
        groups: input.guard.reviews.groups ?? {},
      }),
    });
    // 🔴 the leak advisory reads the SAME roster as the announce, and rides the
    //    same gate, and sits above it
    // .why the SAME roster = an advisory for a lane that will not pour warns of
    //        an event that will not occur. `toPour` is exactly the set the
    //        announce names, so the two signals can never disagree about who is
    //        about to run
    // .why gated on `canRun` = a level the gate never opens pours past no bound
    //        at all. an advisory that cries wolf on every blocked run is a valve
    //        an author stops to read
    // .why ABOVE the announce = the advisory says "this level's bound is about
    //        to be escaped"; the announce says "here is the bound". read in
    //        that order the pair is a caveat then its subject; reversed it is a
    //        claim then its retraction
    const [concurrencyGroupLeak] = getAllConcurrencyGroupLeaks({
      peers: toPour.map((pr) => ({
        slug: pr.slug,
        level: pr.level,
        group: getReviewPeerGroup(pr.review),
      })),
    });
    if (canRun && concurrencyGroupLeak)
      console.error(asConcurrencyGroupLeakAdvisory(concurrencyGroupLeak));
    if (canRun && announce) console.error(announce);

    // ── the pour ──
    const settled = canRun
      ? await Promise.allSettled(toPour.map(runOneBounded))
      : [];

    // 🔴 latch the level the FIRST time it opens — once poured, always poured
    // .why = the gate above is recomputed from scratch every pass, so a lower level
    //        that reads terminal now can read non-terminal later (a malfunctioned l1
    //        that is repaired and rejects is the live case, and it spends no round so
    //        it never exhausts either). this record holds this level's door open
    //        across that, so a lane the driver is already in conversation with is
    //        never withdrawn (define.invariant.review.peer.level-unlock-is-a-latch)
    // .why the `!has` guard = the ledger is append-only, so an unguarded write would
    //        append one row per level per pass forever. one row per (stone, level) is
    //        the whole fact, and the read is a set either way
    // 🔴 .why the condition is a genuine POUR — `canRun && toPour.length` — and never
    //        `canRun` alone = `canRun` IS "unlocked". to record it under the name
    //        `poured` would collapse the two words onto one concept, which is the
    //        synonym this status must not be (rule.forbid.ambiguous-labels):
    //        `unlocked` is derived per pass and is the gate's OUTPUT, `poured` is
    //        recorded once and is an INPUT to it. a name that does not match the fact
    //        it records is the defect, even where both happen to be true together.
    // .note = an all-cached level releases no lane here and still stays latched,
    //         because the pass that MINTED those caches poured and latched then — a
    //         cache cannot exist for a level that never ran
    // .note = it rides `passage.jsonl` rather than a new store because that ledger
    //        already carries a level-scoped sticky marker with exactly these semantics
    //        (`overruled`) — and the one lever that clears it, a rewind, with it
    if (canRun && toPour.length > 0 && !levelsPoured.has(level)) {
      levelsPoured.add(level);
      await setPassageReport({
        report: new PassageReport({
          stone: input.stone.name,
          status: 'poured',
          level,
        }),
        route: input.route,
      });
    }

    // merge by DECLARED index, never by settle position
    // .why = `pr.index` is a durable identity key — it is written into the
    //        review artifact's filename and read back as the cache key. to
    //        re-derive it from completion order credits one reviewer's review
    //        to another, and that failure is silent
    // .note = each lane ANSWERS its own index, so this pairs no arrays and
    //         leans on no order guarantee. the settle order is therefore
    //         unreadable from here, which is the point
    for (const outcome of settled)
      if (outcome.status === 'fulfilled')
        artifactByIndex.set(outcome.value.index, outcome.value.artifact);

    // a co-member that threw must not cancel the ones still aloft — hence
    // `allSettled`, never `Promise.all`
    // .why = it is CAPTURED here and thrown below, after the level settles, so
    //        the merge that follows cannot read as though it were skipped on
    //        this path. the throw still propagates once every lane has landed,
    //        exactly as the serial walk propagated it (raised i004/r011)
    const rejected = settled.find(
      (outcome): outcome is PromiseRejectedResult =>
        outcome.status === 'rejected',
    );

    // ── the queued, when the level never opened ──
    if (!canRun)
      for (const pr of toPour)
        context.cliEmit.onGuardProgress({
          stone: input.stone,
          step: { phase: 'review', index: pr.arrayIndex },
          reviewer: asEventReviewer({
            pr,
            rounds: meterBySlug.get(pr.slug)?.rounds ?? 0,
          }),
          inflight: null,
          outcome: {
            path: null,
            review: { queued: true },
            judge: null,
          },
        });

    // ── settle the level, in DECLARED order ──
    for (const pr of members) {
      const artifact = artifactByIndex.get(pr.index);
      if (artifact) reviews.push(artifact);
      if (exhaustedIndices.has(pr.index)) exhaustedReviewerSlugs.push(pr.slug);
    }

    // a lane that threw propagates NOW, with the level's fulfilled co-members
    // already merged above
    if (rejected) throw rejected.reason;
  }

  return { artifacts: reviews, exhaustedReviewerSlugs };
};

/**
 * .what = validates command does not use npx rhachet/rhx patterns
 * .why = npx adds 500-2000ms latency and has cross-platform issues
 */
const validateNoNpx = (cmd: string): void => {
  // reject guards that use npx patterns
  if (cmd.includes('npx rhachet') || cmd.includes('npx rhx')) {
    const pattern = cmd.includes('npx rhachet') ? 'npx rhachet' : 'npx rhx';
    const alias = cmd.includes('npx rhachet') ? '$rhachet' : '$rhx';
    throw new BadRequestError(
      `guard uses ${pattern} which causes latency and cross-platform issues`,
      {
        pattern,
        hint: `use ${alias} alias instead (expands to ./node_modules/.bin/${alias.slice(1)})`,
      },
    );
  }
};

/**
 * .what = substitutes variables in a command string
 * .why = enables dynamic command templates in guard files
 */
const substituteVars = (
  cmd: string,
  vars: {
    stone: string;
    route: string;
    hash: string;
    output: string;
    conversation: string;
    repoRoot: string;
  },
): string => {
  const rhxPath = path.join(vars.repoRoot, 'node_modules', '.bin', 'rhx');
  const rhachetPath = path.join(
    vars.repoRoot,
    'node_modules',
    '.bin',
    'rhachet',
  );

  // the name→value map for every runtime var. typed by RuntimeGuardVarName so the
  // COMPILER forbids drift: a var can be substituted here ONLY if it is in the shared
  // RUNTIME_GUARD_VAR_NAMES const — and that same const is what getUnknownGuardVars
  // (route.guard.upgrade) treats as the allowlist. so a new runtime var cannot be
  // substituted unless it is also made upgrade-safe. add a name to the const without a
  // value here, or a value without a name, and this literal fails typecheck.
  const valueByName: Record<RuntimeGuardVarName, string> = {
    $route: vars.route,
    $stone: vars.stone,
    $hash: vars.hash,
    $output: vars.output,
    $rhx: rhxPath,
    $rhachet: rhachetPath,
    $conversation: vars.conversation,
  };

  // replace each runtime var globally, in const order. no var name is contained within
  // another, so $conversation (substituted last) is unaffected by the shorter vars, and
  // its own expansion (a comma-joined file list) is never re-scanned.
  return RUNTIME_GUARD_VAR_NAMES.reduce(
    (out, name) => out.replace(new RegExp('\\' + name, 'g'), valueByName[name]),
    cmd,
  );
};
