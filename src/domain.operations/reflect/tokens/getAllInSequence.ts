/**
 * .what = maps each item through an async step, one item at a time, in order
 * .why = each step streams a transcript that may weigh gigabytes; a corpus of hundreds,
 *        each with its subagents, read all at once would open every file and hold every
 *        call list in memory together. one at a time bounds both to a single transcript
 */
export const getAllInSequence = async <TItem, TResult>(input: {
  items: TItem[];
  step: (item: TItem) => Promise<TResult>;
}): Promise<TResult[]> => {
  // .note = deliberate mutation: one flat O(n) walk, scoped to this function; each step
  //         awaits before the next begins, which a map over the items cannot express
  const results: TResult[] = [];
  for (const item of input.items) results.push(await input.step(item));
  return results;
};
