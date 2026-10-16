/**
 * .what = casts a list of file reads into a lookup, keyed by path
 *
 * .why = the orchestrator built this `Map` inline from a `.map` over an awaited
 *        read, so a reader had to decode the tuple shape to learn what the lookup
 *        was keyed by (rule.forbid.inline-decode-friction).
 *
 * .note = a duplicate path keeps the LAST read, which is `Map`'s own rule. the read
 *         set upstream is already unique by path, so the case does not arise here —
 *         it is stated so a future caller with a non-unique set knows what it gets.
 */
export const asContentByPath = (input: {
  /** what the bounded reader returned, one entry per file it read */
  reads: { path: string; content: string }[];
}): Map<string, string> =>
  new Map(input.reads.map((one) => [one.path, one.content]));
