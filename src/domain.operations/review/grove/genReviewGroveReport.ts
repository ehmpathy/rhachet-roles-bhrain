import type { IsoPriceWords } from 'iso-price';
import * as path from 'path';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';
import { asReviewLogsDir } from '@src/domain.operations/review/asReviewLogsDir';
import { getOneCacheHitRate } from '@src/domain.operations/review/getOneCacheHitRate';
import {
  type GradeCensus,
  getOneGradeCensus,
} from '@src/domain.operations/review/getOneGradeCensus';
import {
  getOnePromptInputsCensus,
  type PromptInputsCensus,
} from '@src/domain.operations/review/getOnePromptInputsCensus';
import { getOneReviewTokensOfRuns } from '@src/domain.operations/review/getOneReviewTokensOfRuns';
import { asTreeReadsSplit } from '@src/domain.operations/review/grove/asTreeReadsSplit';
import {
  type GroveDaySample,
  getAllGroveDaySamples,
} from '@src/domain.operations/review/grove/getAllGroveDaySamples';
import {
  getAllReviewTrees,
  type ReviewTree,
} from '@src/domain.operations/review/grove/getAllReviewTrees';
import { getOneDenialOfBarredGrove } from '@src/domain.operations/review/grove/getOneDenialOfBarredGrove';
import { getOneFullRateTokens } from '@src/domain.operations/review/grove/getOneFullRateTokens';
import { getOnePrefixCensusOfTrees } from '@src/domain.operations/review/grove/getOnePrefixCensusOfTrees';
import { isPathPresent } from '@src/domain.operations/review/isPathPresent';
import { PROVIDER_OF_ABSENT_SUPPLY } from '@src/domain.operations/review/meter/genReviewMeterReport';
import { getAllReviewRunMeters } from '@src/domain.operations/review/meter/getAllReviewRunMeters';
import { getOneAccountedCost } from '@src/domain.operations/review/meter/getOneAccountedCost';
import type { ReviewPrefixCensus } from '@src/domain.operations/review/meter/ReviewPrefixPair';
import { SLUG_OF_ABSENT_IDENTITY } from '@src/domain.operations/review/SLUG_OF_ABSENT_IDENTITY';
import { asCountedNoun } from '@src/utils/asCountedNoun';
import { compareStrings } from '@src/utils/compareStrings';
import { isErrorOfDenial } from '@src/utils/fs/isErrorOfDenial';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

/**
 * .what = one axis-value's share of the grove's review spend
 * .why = the row every rollup renders — by tree, by stone, by reviewer slug
 */
export interface GroveRollupRow {
  key: string;
  runs: number;
  census: GradeCensus;
  tokens: ReviewTokens;
  /** spend over the accounted runs; null when NO run here could account for its own */
  cost: IsoPriceWords | null;
}

/**
 * .what = where this machine's review tokens went, across every tree that ran one
 * .why = the deliverable. a grove total hides which lane is dear, so every figure is
 *        carried on three axes at once — tree, stone, and reviewer slug
 */
export interface ReviewGroveReport {
  /** the root that was walked */
  root: string;
  /** every tree considered, with whether it carried logs at all */
  trees: ReviewTree[];
  /** trees that carried a review log root */
  treesWithLogs: number;
  /**
   * trees whose log root could not be read at all — a permission denial, an i/o
   * fault. each is named with its fault, and none enters a sum.
   *
   * .why = one denied tree of nineteen must not abort the report into a stack trace,
   *        and it must not vanish either: a dropped tree lowers every figure by an
   *        amount no reader can see (rule.forbid.failhide)
   */
  treesUnreadable: Array<{ tree: string; fault: string }>;
  /** total review runs found across the grove */
  runsFound: number;
  /** the honesty census over every run found */
  census: GradeCensus;
  /** disjoint token totals, over METERED runs only */
  tokens: ReviewTokens;
  /** total spend over the accounted runs; null when NOT ONE run could account for its own */
  cost: IsoPriceWords | null;
  /** the cache hit rate: cacheGet / (input + cacheSet + cacheGet); null when no input */
  rateOfCacheHit: number | null;
  /** what the prompts were made of, by named input */
  inputs: PromptInputsCensus;
  /** spend by tree, richest first */
  byTree: GroveRollupRow[];
  /** spend by behavior route, richest first — the axis a route owner reads */
  byRoute: GroveRollupRow[];
  /** spend by stone, richest first */
  byStone: GroveRollupRow[];
  /** spend by reviewer slug, richest first */
  byReviewer: GroveRollupRow[];
  /**
   * spend by the provider that served each answer, richest first
   *
   * .why = a prompt cache lives on the provider that served the call, so the grove's
   *        cache rate must be readable by provider here as it is at `--of tree`
   *        (rule.require.report-both-cost-levers-with-trend-and-locus)
   */
  byProvider: GroveRollupRow[];
  /**
   * the corpus cut by the UTC day each run was minted, oldest first
   *
   * .why = the four rollups above are keyed by place. this is the one time axis the
   *        grove carries, so the two levers can show which way they moved here too
   *        (rule.require.report-both-cost-levers-with-trend-and-locus)
   */
  byDay: GroveDaySample[];
  /**
   * the shared-prefix census — every reviewer's round beside its prior round, across
   * every readable tree, and the verdict counts over them
   *
   * .why = the same figures its `tree` peer carries, from the same operation, so the
   *        breadths cannot judge one pair two ways. pairs never cross trees: a round's
   *        prior is in the same log root (`getOnePrefixCensusOfRuns`)
   */
  prefix: ReviewPrefixCensus;
}

/**
 * .what = the stages a grove walk passes through, in the order it passes them
 * .why = a CLOSED set, and `fold` is LAST by construction — which is what lets a
 *        renderer close a treestruct without a lookahead it cannot have while it
 *        streams
 */
export type ReviewGroveStage = 'walk' | 'mine' | 'fold';

/**
 * .what = one stage boundary the grove walk has reached
 * .why = the walk reads every review log on the machine, one tree at a time, and
 *        it took MINUTES with no output at all — a silent wait a human cannot tell
 *        from a hang, so they ctrl-c a healthy process
 *        (rule.require.status-feedback, def.frictionless).
 *
 * .note = it reports MEASURED counts, never a percentage of an estimate. `total`
 *         is nil until the walk has actually counted the trees, because a progress
 *         line that guesses its denominator is the same defect this whole branch
 *         exists to catch, one layer up.
 */
export interface ReviewGroveProgress {
  /** which stage reached a boundary */
  stage: ReviewGroveStage;
  /** steps of this stage that are done */
  done: number;
  /** steps this stage holds; null where the stage is ONE step */
  total: number | null;
  /** what the step touched, in the reader's words */
  detail: string;
}

/**
 * .what = what a caller hands in to watch the walk
 * .why = OPTIONAL, so every extant caller — and every test — is untouched. a walk
 *        with no watcher behaves exactly as it did
 */
type OnReviewGroveProgress = (progress: ReviewGroveProgress) => void;

/**
 * .what = the route, keyed relative to the tree it was driven in
 * .why = a guard records `--output` with whatever path shape it was invoked
 *        under, so `identity.route` arrives ABSOLUTE from some runs and RELATIVE
 *        from others. two shapes of one route split its spend across two rows.
 *
 * .note = a bare `path.relative(tree, route)` is WRONG for the relative case:
 *         node resolves a relative input against `process.cwd()`, which is the
 *         tree the MINE runs in, never the tree the review ran in. that produced
 *         keys like `../<other-tree>/.behavior/<slug>` — every route attributed
 *         to the one worktree this command happened to be invoked from.
 */
const asRouteKey = (input: { route: string; tree: string }): string =>
  path.isAbsolute(input.route)
    ? path.relative(input.tree, input.route)
    : input.route;

/**
 * .what = one run, with the tree it was found in
 * .why = the unit every rollup keys off. a meter alone cannot answer "which tree",
 *        because the tree is a fact about WHERE it was read, never about the run
 */
interface GroveFlatRun {
  tree: ReviewTree;
  meter: ReviewRunMeter;
}

/**
 * .what = the axes the grove rolls its spend up along
 * .why = a CLOSED set. the report declares four `by*` fields and each is one
 *        position on this axis, so the union is the contract those four share
 */
type GroveAxis = 'tree' | 'route' | 'stone' | 'reviewer' | 'provider';

/**
 * .what = how each axis reads its key off a run
 * .why = it must stay a Record, never four inline `.map` callbacks at the call
 *        sites. the Record is what goes red when a fifth axis joins `GroveAxis`,
 *        where four anonymous maps in an orchestrator body compile while they
 *        silently leave the new axis unkeyed — and each is decode-friction a
 *        reader must simulate (rule.forbid.inline-decode-friction).
 *
 * .note = `null` is a real answer, never an error. a hand `rhx review` carries no
 *         guard identity, so its route, stone, and slug are genuinely absent — and
 *         `LABEL_OF_ABSENT_KEY` names that absence rather than drops the run
 */
const KEY_OF_AXIS: Record<GroveAxis, (one: GroveFlatRun) => string | null> = {
  tree: (one) => one.tree.name,
  route: (one) =>
    one.meter.identity?.route
      ? asRouteKey({ route: one.meter.identity.route, tree: one.tree.dir })
      : null,
  stone: (one) => one.meter.identity?.stone ?? null,
  reviewer: (one) => one.meter.identity?.slug ?? null,
  provider: (one) => one.meter.provider,
};

/**
 * .what = what each axis calls a run it could not key
 * .why = the bucket is NAMED rather than dropped, so a corpus total always equals
 *        the sum of its rows. a dropped run would make the rows understate the
 *        headline and no reader could see by how much (rule.forbid.failhide)
 */
export const LABEL_OF_ABSENT_KEY: Record<GroveAxis, string> = {
  /**
   * NOT `'(unattributed)'`, which this label once read.
   *
   * .why = `unattributed` is a DECLARED term with one sense here —
   *        `AttributionGrade`, the prompt census's verdict on whether it can
   *        vouch for its own rows. to spend the same word on *"a run whose tree
   *        could not be named"* is one word over two concepts, in RENDERED
   *        output, where a reader has no type to tell the two apart
   *        (rule.forbid.domain-term-ambiguity).
   *
   * .note = it now takes the shape its three peers already had — `(no X — …)` —
   *         so the four read as one set rather than three and an outlier.
   */
  tree: '(no tree name — a log root outside a named tree)',
  route: '(no route — a hand or review.by run)',
  // the meter's own constant, never a copy of its bytes. `--of tree` and
  //    `--of grove` render one bucket for one absence, so a reword in one place
  //    must not leave the two surfaces with two names for it
  stone: SLUG_OF_ABSENT_IDENTITY,
  reviewer: SLUG_OF_ABSENT_IDENTITY,
  // the meter's own constant, for the same reason as the two above
  provider: PROVIDER_OF_ABSENT_SUPPLY,
};

/**
 * .what = the trees that carried a review log root at all
 * .why = read twice — once to know which trees to mine, once to report the count.
 *        two expressions of one predicate can disagree, and the count is what a
 *        reader weighs every grove figure against
 */
const asTreesWithLogs = (input: { trees: ReviewTree[] }): ReviewTree[] =>
  input.trees.filter((one) => one.present);

/**
 * .what = flattens tree-grouped runs into one run-per-row list
 * .why = every rollup keys off `{ tree, meter }` pairs, so the flatten happens
 *        ONCE here rather than as a nested flatMap/map a reader must simulate
 *        inside the orchestrator (rule.forbid.inline-decode-friction)
 */
const asGroveFlatRuns = (input: {
  readable: Array<{ tree: ReviewTree; runs: ReviewRunMeter[] }>;
}): GroveFlatRun[] =>
  input.readable.flatMap((one) =>
    one.runs.map((meter) => ({ tree: one.tree, meter })),
  );

/**
 * .what = how many trees are read at once
 * .why = the tree reads are independent, so they pour
 *        (rule.forbid.serial-reviews-that-could-pour) — but each tree's read already
 *        pours its own runs at a heap bound of 8 prompts (`getAllReviewRunMeters`), so
 *        the tree bound MULTIPLIES that one. at 2, the live set is ~16 prompts, far
 *        under the 2gb death an unbounded grove mine measured over ~20 trees. a larger
 *        cap trades heap for wall time the grove does not need
 */
const BOUND_OF_CONCURRENT_TREES = 2;

/**
 * .what = reads every tree's run meters off disk, in bounded waves
 * .why = a named operation rather than an accumulation loop in the composer body.
 *        the composer then reads as a chain of named calls, and the bound below
 *        lives with the read it constrains rather than as a comment a later
 *        refactor can lift away from it (rule.forbid.inline-decode-friction).
 *
 * .note = bounded, never a `Promise.all`: an unbounded fan would multiply the
 *         run-level heap bound by the tree count and put the heap back where it
 *         OOM'd (`BOUND_OF_CONCURRENT_TREES`).
 *
 *         it is `getAll*` rather than `as*` because it REACHES DISK: a transformer
 *         prefix would promise a pure fold and hide an i/o boundary
 *         (rule.require.get-set-gen-verbs).
 */
const getAllRunMetersByTree = async (input: {
  trees: ReviewTree[];
  onProgress: OnReviewGroveProgress | null;
}): Promise<{
  readable: Array<{ tree: ReviewTree; runs: ReviewRunMeter[] }>;
  unreadable: Array<{ tree: string; fault: string }>;
}> => {
  // .note = deliberate mutation, and a SCOPED ZONE — the counter is born here and
  //         never leaves (rule.require.immutable-vars). it gives `onProgress` a truthful
  //         per-tree line in the order the reads FINISH, so a reader who watches a slow
  //         grove learns WHICH tree is slow
  const progress = { done: 0 };

  // read each tree, isolated PER TREE — the grain above the per-run isolation inside
  //    the read. a log root this process may not read (EACCES, EPERM) throws there by
  //    design; here it is recorded, named, and excluded from every sum
  const reads = await getAllResultsInBoundedPool({
    items: input.trees,
    bound: BOUND_OF_CONCURRENT_TREES,
    map: (tree) =>
      getOneTreeRunMetersWithProgress({
        tree,
        progress,
        total: input.trees.length,
        onProgress: input.onProgress,
      }),
  });

  // fold the reads, in tree order, into the readable and the unreadable
  const { readable, unreadable } = asTreeReadsSplit({ reads });

  // a grove where EVERY tree with logs is barred refuses exactly as the tree breadth
  //    does: the first denial surfaces to the shared barred-root refusal (`[case10]`)
  const barred = getOneDenialOfBarredGrove({
    reads,
    readableCount: readable.length,
  });
  if (barred !== null) throw barred.denial;

  return { readable, unreadable };
};

/**
 * .what = reads one tree's run meters, then reports its progress line
 * .why = the per-tree act of the bounded read, named, so the read reads as "each tree,
 *        with its progress" rather than a four-step lambda to simulate
 *        (rule.prefer.decomposable-architecture)
 *
 * .note = deliberate mutation of `progress.done`, the counter its caller scopes to one
 *         grove read (rule.require.immutable-vars' scoped-zone clause). it is the one
 *         truthful count of reads FINISHED, in the order they finish
 */
const getOneTreeRunMetersWithProgress = async (input: {
  tree: ReviewTree;
  progress: { done: number };
  total: number;
  onProgress: OnReviewGroveProgress | null;
}): Promise<{
  tree: ReviewTree;
  read: Awaited<ReturnType<typeof getOneTreeRunMetersOrFault>>;
}> => {
  const read = await getOneTreeRunMetersOrFault({ tree: input.tree });

  // emitted AFTER the read, never before it. a line printed ahead of the work
  // reports an intention; this reports a fact, with the run count the read just
  // measured — so a slow tree reads as BIG, not as hung
  input.progress.done += 1;
  input.onProgress?.({
    stage: 'mine',
    done: input.progress.done,
    total: input.total,
    detail: asTreeReadProgressDetail({ tree: input.tree, read }),
  });
  return { tree: input.tree, read };
};

/**
 * .what = the detail one tree's progress line carries once its read is done
 * .why = the glyph names WHO fixes a fault: a denial is the caller's to fix (chmod),
 *        the same class the all-barred refusal raises; a vanished root is the
 *        system's (rule.require.qualified-error-headers). a healthy tree names its run
 *        count, so a slow tree reads as big rather than hung
 */
const asTreeReadProgressDetail = (input: {
  tree: ReviewTree;
  read: { runs: ReviewRunMeter[]; fault: string | null; denial: unknown };
}): string => {
  // a denied root is the caller's to fix
  if (input.read.denial !== null)
    return `${input.tree.name} · ✋ ConstraintError: barred`;

  // a vanished root is the system's
  if (input.read.fault !== null)
    return `${input.tree.name} · 💥 MalfunctionError: unreadable`;

  // a healthy tree names its run count
  return `${input.tree.name} · ${asCountedNoun({
    count: input.read.runs.length,
    one: 'run',
    many: 'runs',
  })}`;
};

/**
 * .what = reads one tree's run meters, or names why its log root could not be read
 * .why = the per-tree isolation, named so the loop above reads as a narrative. a
 *        per-RUN defect is already graded `unknown` inside the read; what reaches
 *        this catch is a fault at the ROOT — the dir read itself failed — so the whole
 *        tree is unreadable and is reported as such, loud, beside the figures
 */
const getOneTreeRunMetersOrFault = async (input: {
  tree: ReviewTree;
}): Promise<{
  runs: ReviewRunMeter[];
  fault: string | null;
  denial: unknown;
}> => {
  try {
    const { runs } = await getAllReviewRunMeters({ cwd: input.tree.dir });

    // a tree the scan listed as PRESENT, whose root is gone by its turn in the loop:
    //    a worktree removed mid-scan. the read answers the empty list it keeps for a
    //    tree that never reviewed, so unnamed here its whole spend would drop from
    //    every sum with no discordant count (rule.forbid.failhide). the scan runs for
    //    minutes, and a worktree teardown in that window is routine
    if (runs.length === 0) {
      const rootPresent = await isPathPresent({
        at: asReviewLogsDir({ cwd: input.tree.dir }),
      });
      if (!rootPresent)
        return {
          runs: [],
          fault:
            'the log root vanished after the scan listed it; its spend is absent from every figure',
          denial: null,
        };
    }
    return { runs, fault: null, denial: null };
  } catch (error) {
    // allowlist the DENIAL alone — the one root fault `getAllEntriesInDir` passes
    //    up untouched, and the one a human fixes with a chmod. every other throw is a
    //    defect and surfaces loud (rule.forbid.failhide).
    //
    // read off the errno SHAPE, never `instanceof Error`: a native fs rejection
    //    can cross a vm realm (a test runner's sandbox), where `instanceof` answers
    //    false and every denial would rethrow
    if (!isErrorOfDenial({ error })) throw error;
    return { runs: [], fault: String(error), denial: error };
  }
};

/**
 * .what = drops the tree from each flat row — the run meters alone
 * .why = the census, the token sum, and the accounted cost all key off runs with
 *        no regard for which tree carried them. a named pluck says that plainly,
 *        where an inline `.map((one) => one.meter)` is a shape change a reader
 *        must simulate (rule.forbid.inline-decode-friction)
 */
const asRunMeters = (input: { flat: GroveFlatRun[] }): ReviewRunMeter[] =>
  input.flat.map((one) => one.meter);

/**
 * .what = rolls a set of runs up along one axis
 * .why = one rollup operation, four axes — so tree, route, stone, and reviewer
 *        cannot drift on how they aggregate or how they sort
 */
const asRollup = (input: {
  flat: GroveFlatRun[];
  axis: GroveAxis;
}): GroveRollupRow[] => {
  const keyOf = KEY_OF_AXIS[input.axis];

  // .note = deliberate mutation, and a SCOPED ZONE — `byKey` is born here and is
  //         spread into a fresh array before it is returned, so the map itself never
  //         escapes (rule.require.immutable-vars).
  //
  //         a group-by cannot be a `map`: many runs collapse onto one key, so the
  //         output is shorter than the input and keyed by a different axis. the
  //         accumulator carries what the earlier runs already put under each key,
  //         which is the dependence that makes it a fold rather than a projection.
  const byKey = new Map<string, ReviewRunMeter[]>();
  for (const one of input.flat) {
    const key = keyOf(one) ?? LABEL_OF_ABSENT_KEY[input.axis];
    byKey.set(key, [...(byKey.get(key) ?? []), one.meter]);
  }

  // clone before sort, so the order is set on a list this operation owns
  return [
    ...[...byKey.entries()].map(([key, runs]) => ({
      key,
      runs: runs.length,
      census: getOneGradeCensus({ runs }),
      tokens: getOneReviewTokensOfRuns({ runs }),
      cost: getOneAccountedCost({ runs }),
    })),
  ].sort((a, b) => asRollupOrder({ a, b }));
};

/**
 * .what = the rollup rank: most full-rate tokens first, then by key for a stable tie
 * .why = the grove ranks on what a run BILLED at full rate, so the costliest axis value
 *        leads; the key tiebreak keeps two equal rows in one order every run
 */
const asRollupOrder = (input: {
  a: Pick<GroveRollupRow, 'key' | 'tokens'>;
  b: Pick<GroveRollupRow, 'key' | 'tokens'>;
}): number =>
  getOneFullRateTokens({ tokens: input.b.tokens }) -
    getOneFullRateTokens({ tokens: input.a.tokens }) ||
  compareStrings(input.a.key, input.b.key);

/**
 * .what = mines where this machine's review tokens went, across every tree
 * .why = the meter answers "what did THIS tree spend". this answers "where, across
 *        the grove, did the spend actually land" — which is the only question a
 *        cut can be aimed at.
 *
 * .note = the figures read the runs of every READABLE tree, and each states which
 *         grades it weighs: tokens count `metered` runs alone (no other grade carries
 *         tokens); cost counts the accounted runs — `metered`, plus a `refused` run's
 *         proven nil — and renders absent where none are; the census and the input
 *         census read every grade. an `unknown` run's spend is
 *         UNRECORDED, never zero, and the census carries it so a reader can weigh the
 *         total against its coverage.
 */
export const genReviewGroveReport = async (input: {
  root: string;
  /**
   * a watcher over the three stages, so a minutes-long walk can say what it does.
   * null where no one watches — named, never left undefined (rule.forbid.undefined-inputs)
   */
  onProgress: OnReviewGroveProgress | null;
}): Promise<ReviewGroveReport> => {
  const onProgress = input.onProgress;

  const trees = await getAllReviewTrees({ root: input.root });
  const treesWithLogs = asTreesWithLogs({ trees });
  onProgress?.({
    stage: 'walk',
    done: trees.length,
    total: null,
    detail: [
      asCountedNoun({ count: trees.length, one: 'tree', many: 'trees' }),
      `${asCountedNoun({
        count: treesWithLogs.length,
        one: 'carries',
        many: 'carry',
      })} review logs`,
    ].join(' · '),
  });

  const { readable, unreadable } = await getAllRunMetersByTree({
    trees: treesWithLogs,
    onProgress,
  });
  const flat = asGroveFlatRuns({ readable });
  const runs = asRunMeters({ flat });
  const tokens = getOneReviewTokensOfRuns({ runs });
  const prefix = await getOnePrefixCensusOfTrees({ readable });
  onProgress?.({
    stage: 'fold',
    done: runs.length,
    total: null,
    detail: `${asCountedNoun({
      count: runs.length,
      one: 'run',
      many: 'runs',
    })} priced`,
  });

  return {
    root: input.root,
    trees,
    treesWithLogs: treesWithLogs.length,
    treesUnreadable: unreadable,
    runsFound: runs.length,
    census: getOneGradeCensus({ runs }),
    tokens,
    cost: getOneAccountedCost({ runs }),
    rateOfCacheHit: getOneCacheHitRate({ tokens }),
    inputs: getOnePromptInputsCensus({ runs }),
    byTree: asRollup({ flat, axis: 'tree' }),
    byRoute: asRollup({ flat, axis: 'route' }),
    byStone: asRollup({ flat, axis: 'stone' }),
    byReviewer: asRollup({ flat, axis: 'reviewer' }),
    byProvider: asRollup({ flat, axis: 'provider' }),
    byDay: getAllGroveDaySamples({ runs }),
    prefix,
  };
};
