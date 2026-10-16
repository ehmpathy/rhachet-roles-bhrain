import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

/**
 * .what = runs an async map over a list with at most `bound` items in flight, and
 *         answers each item's settled outcome in the order asked — a rejected item
 *         never stops the pour
 *
 * .why = 🔴 a pour of independent reviews must settle, never fail fast
 *        (rule.forbid.dropped-partial-review-progress). the plain bounded pour stops
 *        on the first item that throws and rejects, so every result not yet returned
 *        is discarded — verdicts already paid for, gone. this variant hands each
 *        item's outcome back as a `PromiseSettledResult`, so the caller can keep each
 *        completed verdict and name each fault on its own row.
 *
 * .note = it reuses the plain pour's pool whole — the bound check, the shared item
 *         iterator, the order guarantee — and only wraps each item so it cannot
 *         reject. one loop, two contracts.
 *
 * .note = the map is entered through an async arrow, so a SYNCHRONOUS throw from the
 *         mapper settles as a rejection too, rather than escapes the pour.
 */
export const getAllSettledResultsInBoundedPool = async <TItem, TResult>(input: {
  /** the items to pour, in the order the answer must preserve */
  items: readonly TItem[];
  /** how many may be in flight at one time — each caller owes its own number */
  bound: number;
  /** what to do with one item */
  map: (item: TItem) => Promise<TResult>;
}): Promise<PromiseSettledResult<TResult>[]> =>
  getAllResultsInBoundedPool({
    items: input.items,
    bound: input.bound,
    map: (item) =>
      (async () => input.map(item))().then(
        (value): PromiseSettledResult<TResult> => ({
          status: 'fulfilled',
          value,
        }),
        (reason: unknown): PromiseSettledResult<TResult> => ({
          status: 'rejected',
          reason,
        }),
      ),
  });
