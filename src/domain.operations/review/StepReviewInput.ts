import type { ReviewPartitionOfTargets } from '@src/domain.operations/review/partition/getAllTargetsByPartition';

/**
 * .what = the input a review run takes, internal fields and all
 * .why = declared in its own file, apart from the step, because a split review repeats it
 *        once per partition (`stepReviewByPartitions`), and that leaf must name its shape —
 *        `partition` and `prime` among it, which the public `stepReview` omits. a leaf that
 *        imported it back from its orchestrator would close a type cycle
 */
export type StepReviewInput = StepReviewInputOfContract & StepReviewInputOfRun;

/**
 * .what = the internal role of one run — a whole lane, one partition of a split, or the
 *         prime of a split's shared prefix
 * .why = a prime with no partition would compile the WHOLE lane and send it as a one-token
 *        poke: a full-price prefill that reviews naught. keyed as a union, that run cannot
 *        be written — a `prime` exists only beside the `partition` it primes — so the law
 *        holds at every builder, never by one setter's habit (`setOneReviewPartitionsPrime`)
 */
export type StepReviewInputOfRun =
  | { partition?: undefined; prime?: undefined }
  | {
      /**
       * 🔴 internal — the partition this run reviews, set by `stepReviewByPartitions` and by
       * no caller. a run with a partition never splits again; its overflow refuses
       */
      partition: ReviewPartitionOfTargets;
      /**
       * 🔴 internal — the other partitions of this split, by slug and declared globs, set by
       * `stepReviewByPartitions` and by no caller. empty on a prime, which reviews naught
       *
       * .why = a partition sees only its own slice of the lane, so a file another partition
       *        grades is absent from its prompt — and a reviewer that cannot see a file reads
       *        it as absent from the branch. the prompt names the peers, so "not in my target"
       *        is never mistaken for "not in the tree"
       */
      peers: Pick<ReviewPartitionOfTargets, 'name' | 'globs'>[];
      /**
       * 🔴 internal — set by `stepReviewByPartitions` and by no caller. a prime run compiles
       * the prompt of its partition (`common` only) and sends it as a one-token poke, so the
       * concurrent partition runs that follow read the common prefix from cache
       * (`rule.require.prime-the-shared-prefix-before-a-pour`). it reviews naught
       */
      prime?: boolean;
    };

/**
 * .what = the fields of a review run that every caller may set
 */
type StepReviewInputOfContract = {
  /**
   * the partitions a whole run may split into, should its prompt overflow —
   * `--partition '<slug>=<globs>'`, repeatable
   *
   * .why = a lane whose scope is large by construction (a since-main diff on a big
   *        branch) cannot fit one prompt, and a narrower bind cannot reach an added
   *        body. its caller declares overlapped file sets, each one judged alone; the
   *        overlap is computed (seed S44). the split happens only on overflow, and the
   *        verdicts merge into one report. the declaration is checked only where a split
   *        is read — a `--mode plan` preview, or an overflow that splits — so a lane that
   *        fits runs exactly as if none were declared
   */
  partitions?: string[];
  /**
   * the `--partition` values the run's route declares for its reviewer, and the command
   * that re-declares them, read by the caller from the route context
   * (`getAllPartitionFlagsOfReviewRun`)
   *
   * .why = the route owns its declaration; the review receives it as plain flags and plain
   *        command text, and never reaches into route internals (rule.forbid.scope-leaks).
   *        `partitions` wins where both are given, and this set is narrowed to the
   *        partitions with work in the lane. the command lets a split refusal print the
   *        repaired set paste-ready (rule.forbid.workarounds)
   */
  partitionsOfRoute?: {
    partition: string[];
    command: { head: string; tail: string } | null;
  };
  /**
   * `plan` previews the declared split and calls no brain; `apply` (default) reviews
   */
  mode?: 'plan' | 'apply';
  /**
   * whether this lane meets the peers of its pour on the prime watermark — `join` or
   * `skip` (default)
   *
   * .why = only a lane the guard spawned has peers to meet; a lone run must not pay the
   *        gather wait. the contract reads that fact once, at its boundary
   *        (`isReviewSubprocess`), and states it here, so the domain reads no hidden env
   */
  meet?: 'join' | 'skip';
  rules: string | string[];
  diffs?: string;
  paths?: string | string[];
  pathsWith?: string | string[];
  pathsWout?: string | string[];
  /**
   * whether the default polluter exclusion applies — `drop` (default) or `keep`
   *
   * .why = the exclusion is a DEFAULT, never a law. a driver who reviews the
   *        route machinery itself has a real subject, and `--polluters keep`
   *        is how they name it — so the default never becomes a wall
   */
  polluters?: 'drop' | 'keep';
  join?: 'union' | 'intersect';
  refs?: string | string[];
  optional?: string[];
  conversation?: string | string[];
  output: string;
  focus: 'pull' | 'push';
  goal: 'exhaustive' | 'representative';
  cwd?: string;
};
