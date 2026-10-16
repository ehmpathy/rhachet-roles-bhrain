import { UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = runs an async map over a list with at most `bound` items in flight, and
 *         answers the results in the order asked
 *
 * .why = 🔴 three operations in this subsystem hand-wrote the identical loop —
 *        `getAllFileContentsByGroup`, `getAllTargetsTouchedAt`, and
 *        `getAllReviewRunMeters`. verbatim structure, three times over; only the
 *        bound value and the per-item mapper differed. that meets this repo's own
 *        abstraction bar of 3+ usages (`rule.prefer.wet-over-dry`), and until it
 *        was met the duplication was correct to leave alone.
 *
 * .note = 🔴 the three bound values stay where they are, and deliberately so. each
 *         carries its own hard-won justification — 64 for a descriptor/threadpool
 *         subject, 8 for a heap subject against a measured 2gb death — and those
 *         are not one number seen three times. what is shared is the iteration
 *         mechanism, and that is all this takes.
 *
 * .note = order is preserved. a caller that poured by hand relied on it (the
 *         cache-stability sort reads `getAllTargetsTouchedAt`'s output positionally
 *         against its input), so the contract states it rather than leaves it to
 *         be rediscovered from the implementation.
 *
 * .note = 🟡 a settled item frees its memory only where the caller discards it. this
 *         bounds how many run at once; it does not bound peak heap by itself. the
 *         two call sites whose subject is descriptors say so in their own notes,
 *         and the one whose subject is heap earns its lower bound there.
 */
export const getAllResultsInBoundedPool = async <TItem, TResult>(input: {
  /** the items to pour, in the order the answer must preserve */
  items: readonly TItem[];
  /** how many may be in flight at one time — each caller owes its own number */
  bound: number;
  /** what to do with one item */
  map: (item: TItem) => Promise<TResult>;
}): Promise<TResult[]> => {
  // 🔴 a bound below 1 opens zero slots (`Math.min(bound, items.length)` below), so
  // no item is ever mapped and the pour returns an array of `undefined` as though it
  // were data — a quiet wrong answer, strictly worse than a hang, since no reader
  // ever sees it fail (rule.require.failfast, rule.forbid.surprises). refuse it by name
  if (!Number.isInteger(input.bound) || input.bound < 1)
    UnexpectedCodePathError.throw(
      'a bounded pour needs a bound of at least 1 — a lower one opens no slot and maps no item',
      { bound: input.bound },
    );

  // .note = deliberate mutation, and a scoped zone — `results`, `next`, and `fault`
  //         are all born inside this call and none escapes it until `results` is
  //         returned whole. no caller holds a reference while the pour runs, so no
  //         observer can see a partial state (rule.require.immutable-vars' scoped-zone
  //         carve). each slot writes its result at its item's own index, so order holds
  //         whatever order the items finish in.
  //
  //         🔴 a continuous pool, never lockstep waves. a wave waits on its slowest item
  //         before the next wave starts, so one lane whose brain call runs minutes long
  //         idles every other slot of its wave. here a slot pulls the next item the
  //         moment its own settles, so `bound` items stay in flight until the list
  //         runs dry, and wall time is set by the bound, never by each wave's tail.
  //
  //         🔴 a fault stops further pulls: the first rejection sets `fault`, every
  //         slot stops to pull once it sees it, and the pour rejects with it. items
  //         already in flight run out, exactly as a wave's peers did.
  //
  //         the slots share one iterator, so each `for…of` pulls the next unclaimed
  //         item and no two slots ever take the same one.
  const results: TResult[] = new Array<TResult>(input.items.length);
  const faults: unknown[] = [];
  const queue = input.items.entries();
  const runOneSlot = async (): Promise<void> => {
    for (const [at, item] of queue) {
      if (faults.length > 0) return;
      try {
        results[at] = await input.map(item);
      } catch (error) {
        faults.push(error);
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(input.bound, input.items.length) }, () =>
      runOneSlot(),
    ),
  );
  if (faults.length > 0) throw faults[0];
  return results;
};
