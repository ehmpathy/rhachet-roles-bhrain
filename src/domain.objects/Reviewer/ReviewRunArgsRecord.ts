import type { IsoPriceHuman } from 'iso-price';

/**
 * .what = the payload `input.args.json` carries — the invocation a review was
 *         given, the scope it resolved, and the projection it made before the call
 *
 * .why = a shared declaration for the write side and the read side (the meter),
 *        so a reader cannot look for a field at a level the writer never puts it.
 *        the `output` path sits under `args`, one level in; a reader typed by hand
 *        that read it off the root would match no run in silence, since an absent
 *        match reads exactly like "this reviewer has not run"
 *
 * .note = the peer of `ReviewRunMetricsRealized`, for the other artifact. the
 *         read sides bind through `Partial<…>` per level, since a file on disk is
 *         untrusted input; the link is the field names, so a rename fails both
 *         sides at compile time
 */
export interface ReviewRunArgsRecord {
  /**
   * the whole invocation, so one artifact can rebuild the call.
   *
   * 🔴 it held only a part of it, and the scope trace held a different part:
   * a guard run bound by `--paths-with` recorded `paths: undefined` here, and
   * no single artifact could replay it (raised i041/r027). one value now feeds
   * both writers, so the two cannot drift apart again
   */
  args: {
    rules: string | string[];
    diffs?: string;
    paths?: string | string[];
    pathsWith?: string | string[];
    pathsWout?: string | string[];
    polluters: 'drop' | 'keep';
    join: 'union' | 'intersect';
    refs?: string | string[];
    conversation?: string | string[];
    output: string;
    focus: 'pull' | 'push';
    goal: 'exhaustive' | 'representative';
    /** the brain slug the call rode on — a replay on another brain is a different review */
    brain: string;
    /** the supplies the run let be absent, `--optional` */
    optional: string[];
    /** the partitions the run may split into on overflow, `--partition '<slug>=<globs>'` */
    partitions: string[];
    /** the partition this run reviewed, when a split lane ran it; null for a whole run */
    partition: string | null;
  };
  scope: {
    ruleFiles: string[];
    refFiles: string[];
    /** the prior peer-review dialogue, a first-class input that grows each round */
    conversationFiles: string[];
    targetFiles: string[];
  };
  metrics: {
    tokenEstimate: number;
    contextWindowPercent: number;
    costEstimate: IsoPriceHuman;
  };
}

/**
 * .what = the shape a reader may assume of an `input.args.json` off disk
 * .why = every level may be absent on an old or hand-edited file, and the field
 *        names still come from the one declaration above
 */
export type ReviewRunArgsRecordRead = {
  args?: Partial<ReviewRunArgsRecord['args']>;
  scope?: Partial<ReviewRunArgsRecord['scope']>;
  metrics?: Partial<ReviewRunArgsRecord['metrics']>;
};
