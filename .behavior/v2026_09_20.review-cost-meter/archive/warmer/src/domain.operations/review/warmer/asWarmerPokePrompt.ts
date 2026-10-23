/**
 * .what = how much of the tail a poke replays
 * .why = not a cost lever. the poke's own call is itself a cache hit, so its bytes
 *        bill at the cache rate — measured at $0.000428 for a 65k-token hit
 *        against $0.019488 for the same call cold, a 45.5x spread — so a larger
 *        replay is nearly free to the warmer.
 *
 *        the bound is replica capacity. the cache evicts oldest-first, and with N
 *        lanes that each keep a warmed prefix, a warmer that makes 2.5M chars
 *        resident to protect 150k evicts other lanes' prefixes to do it. that cost
 *        lands on a neighbour lane's bill, not the warmer's own, so it would go
 *        unmeasured.
 *
 * .note = 400k is the reach of the largest hit the prefix census measured (a
 *         400.5k-char prefix that served at 90.0%) — the observed cap of what a
 *         prefix has ever been worth, not a round number.
 */
export const CHARS_OF_POKE_TAIL_MAX = 400_000;

/**
 * .what = the two message slots a poke replays, from a run's own artifacts
 * .why = the split matters and fails silently if wrong. the real call sends the
 *        head as `role.briefs` (the system prompt) and the tail as `prompt` (the
 *        user message), and the replica affinity pin is
 *        `sha256(model + \0 + systemPrompt)`. the head must be byte-identical — it
 *        derives the pin, and a warmer that truncates it lands on a replica the
 *        real call never reaches, spending and protecting naught while every
 *        surface test passes. the tail is where truncation is safe — it changes
 *        no key, and a shorter prefix simply protects fewer bytes. this is why
 *        `brain.cache({ prefix })` cannot take one opaque blob: a blob lands in
 *        the system slot and breaks the key.
 */
export interface WarmerPokePrompt {
  /** the byte-identical head — rides the system slot, and derives the pin */
  head: string;
  /** the tail's stable front — rides the user slot, and may be truncated */
  tail: string;
}

/**
 * .what = splits a run's compiled prompt into the two slots a poke replays
 * .why = the run wrote both artifacts already (`input.prompt.head.md` and
 *        `input.prompt.md`), so a poke needs no re-compile — which matters
 *        because a re-compile would read a tree that has since MOVED, and
 *        produce a prefix the next round will not share
 *
 * .note = the tail is derived by subtraction rather than re-read: the full prompt
 *         is `head + tail` by construction, so a head that does not prefix the
 *         prompt means the two artifacts disagree, and a poke built on them would
 *         warm bytes no round ever sent (rule.require.failfast)
 */
export const asWarmerPokePrompt = (input: {
  head: string;
  prompt: string;
}): WarmerPokePrompt | null => {
  // the artifacts disagree — refuse rather than warm a prefix nobody sent
  if (!input.prompt.startsWith(input.head)) return null;

  const tail = input.prompt.slice(input.head.length);
  return {
    head: input.head,
    tail: tail.slice(0, CHARS_OF_POKE_TAIL_MAX),
  };
};
