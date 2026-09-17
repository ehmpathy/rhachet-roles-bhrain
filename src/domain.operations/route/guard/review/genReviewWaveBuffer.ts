import { UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = a level's ordered-release buffer — holds each settled reviewer block until
 *         every earlier-declared slot in that level has landed, then releases the run
 * .why  = under a concurrent pour two lanes settle in a race, and the live stream is
 *         captured by every peer acceptance snapshot. a settle-order append would make
 *         those snapshots a coin flip, so release order must be DECLARED order rather
 *         than settle order (fulcrum F9)
 *
 * .note = this owns the wave's STATE and no i/o at all. the renderer that drives it owns
 *         the spinner, the overwrite, and the tty gate — so the release policy and the
 *         status display evolve apart, which is what a mixed closure refused
 *         (`rule.prefer.decomposable-architecture`)
 */
export interface ReviewWaveStatus {
  /** how many lanes of this level are aloft right now */
  inflight: number;
  /** how many have settled */
  done: number;
  /**
   * how many have NOT yet settled — inflight PLUS queued, never queued alone
   * .why = so the invariant `done + left = members` reads true at every tick. the two
   *        senses coincide on an unbounded level and diverge at `concurrency: 1`, which
   *        is the level this feature exists to make possible
   */
  left: number;
  /** when the FIRST lane of this level went aloft, or null if none has */
  beganMs: number | null;
}

export interface ReviewWaveBuffer {
  /**
   * ensure a wave of `total` members is open for `level`, and answer whatever an
   * unspent prior wave left buffered
   *
   * .why = it fires on EVERY event of its level, so it is an ENSURE rather than an
   *        OPEN. the wave boundary is the LEVEL — never the arrival of slot 0, which
   *        a cached member declared later can beat to the stream
   *
   * 🟡 .note = it keys on `level` rather than on a spent cursor, and that is the whole
   *         point. a cursor proxy reads `spent` and `left short` alike, so a prior
   *         wave that a mid-flight throw cut short would silently absorb the NEXT
   *         level's blocks — the buffer would hold them behind a gap that can never
   *         close, and emit naught, with no error. keyed on the level, a new level
   *         always gets a correct wave (raised i004/r011)
   *
   * ⚠️ .note = it RETURNS the orphans rather than discards them, so the caller can
   *         flush what the prior wave never released. today that return is always
   *         empty — every member of a level reaches `settle`, cached and exhausted
   *         alike — which is what makes this change observable to no snapshot
   *
   * 🔴 .the invariant the level key RESTS on = one wave instance sees the levels of
   *     exactly ONE stone, so a level number is visited at most once per instance.
   *     it holds by CONSTRUCTION rather than by luck: `genContextCliEmit` is
   *     instantiated once per cli invocation (`route.ts`), and `stepRouteStoneSet`
   *     drives exactly one `--stone` per invocation with no loop over stones — so
   *     `runStoneGuardReviews` is entered once, and its levels ascend monotonically.
   *
   *     ⇒ a future caller that batched SEVERAL stones through one emit context would
   *       break it: a second stone whose first level number equals a prior stone's
   *       last would read as `the same level, already open`, reuse a spent
   *       `total`/`cursor`, and release no block. the verdicts and artifacts on disk
   *       would still be correct — it is a RENDER hazard, and only that.
   *
   *     ⚠️ so the key is deliberately the narrowest one that is correct today, and
   *       the composite a batched caller would need is `{stone, level}`. this note is
   *       the tripwire: read it before you batch, rather than debug an empty stream
   *       (raised i005/r011, and independently verified unreachable-by-construction
   *       by i005/r010)
   */
  begin: (input: { level: number; total: number }) => string[][];
  /** mark a slot aloft, and stamp the wave's clock if it is the first */
  launch: (input: { slot: number; beganMs: number }) => void;
  /**
   * buffer one slot's whole block, then answer the blocks now releasable — in declared
   * order, possibly empty, possibly several at once when a gap closes
   */
  settle: (input: { slot: number; block: string[] }) => string[][];
  /**
   * answer each block still buffered, whatever the cursor is owed, and spend the wave
   * .why = a lane that throws lands no block, so the cursor would stall on it forever and
   *        every block behind it would be lost
   */
  drain: () => string[][];
  /** the counters a status line reads */
  status: () => ReviewWaveStatus;
}

export const genReviewWaveBuffer = (): ReviewWaveBuffer => {
  // .note = deliberate mutation, per `rule.require.immutable-vars`. a wave is a state
  //         machine ticked by events that arrive one at a time; the two collections stay
  //         `const` because a clear-and-repopulate needs no rebind
  let levelOpen: number | null = null;
  let total = 0;
  let cursor = 0;
  let done = 0;
  let beganMs: number | null = null;
  const inflight = new Set<number>();
  const blocks = new Map<number, string[]>();
  // which slots have settled, so a repeat cannot re-count
  // .why = `blocks` cannot answer it — a released block is deleted from the map,
  //        so `blocks.has(slot)` reads false for a slot that already settled AND
  //        for one that never did. the two must be told apart
  const settled = new Set<number>();

  const begin: ReviewWaveBuffer['begin'] = (input) => {
    // the same level, already open — every event of a level calls this
    if (input.level === levelOpen) return [];

    // a new level supersedes the prior wave, so hand back what it never released
    const orphans = [...blocks.keys()]
      .sort((a, b) => a - b)
      .map((slot) => blocks.get(slot)!);

    levelOpen = input.level;
    total = input.total;
    cursor = 0;
    done = 0;
    beganMs = null;
    inflight.clear();
    blocks.clear();
    settled.clear();
    return orphans;
  };

  const launch: ReviewWaveBuffer['launch'] = (input) => {
    inflight.add(input.slot);
    beganMs ??= input.beganMs;
  };

  const settle: ReviewWaveBuffer['settle'] = (input) => {
    // 🔴 a slot outside the declared roster is a CALLER defect, never an event
    // .why = `total` is the level's own size, so a slot at or past it belongs to
    //        no member of this wave. to absorb it would increment `done` past
    //        `total` and drive `status.left` NEGATIVE — a wrong peak reported
    //        with no error, on the one seam the frozen oracles read
    if (input.slot < 0 || input.slot >= total)
      UnexpectedCodePathError.throw(
        'review wave settled a slot outside its level roster',
        { slot: input.slot, total, levelOpen },
      );

    // 🔴 a repeat settle CONVERGES rather than counts twice
    // .why = `done` is a counter, so a double settle for one slot would report
    //        one more lane finished than exists and push `left` negative. the
    //        launch/settle contract implies once per slot, and a contract the
    //        caller must uphold alone is one a retry or a double-emitted finish
    //        breaks silently ⇒ so the buffer holds it (`rule.require.idempotent-operations`)
    // .note = it is a NO-OP rather than a throw, because a repeat is what an
    //         at-least-once delivery legitimately looks like. the first settle's
    //         block already released, so there is naught left to hand back
    if (settled.has(input.slot)) return [];
    settled.add(input.slot);

    inflight.delete(input.slot);
    done++;
    blocks.set(input.slot, input.block);

    // release every block the cursor is owed, and stop at the first gap
    const released: string[][] = [];
    while (cursor < total) {
      const block = blocks.get(cursor);
      if (!block) break;
      released.push(block);
      blocks.delete(cursor);
      cursor++;
    }
    return released;
  };

  const drain: ReviewWaveBuffer['drain'] = () => {
    const slots = [...blocks.keys()].sort((a, b) => a - b);
    const released = slots.map((slot) => blocks.get(slot)!);

    // 🔴 drain is TERMINAL on the counters, not just on the block map. it
    // releases every buffered slot, so each one is now settled and done — and a
    // status() read after a drain must reflect that, or it reports lanes still
    // aloft and still owed that were in fact all flushed
    // .why = the lie was unobservable while drain fired only on a closing render,
    //        but a future caller that drained mid-wave and read status() would
    //        inherit `left > 0` and `inflight > 0` for a wave with no work left
    //        (`rule.forbid.maintenance-hazards`, i025/r2 blocker.3)
    for (const slot of slots)
      if (!settled.has(slot)) {
        settled.add(slot);
        done++;
      }
    inflight.clear();
    blocks.clear();
    cursor = total;
    return released;
  };

  const status: ReviewWaveBuffer['status'] = () => ({
    inflight: inflight.size,
    done,
    left: total - done,
    beganMs,
  });

  return { begin, launch, settle, drain, status };
};
