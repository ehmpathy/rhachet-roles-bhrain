/**
 * .what = the args before the first bare `--`, or every arg where none is typed
 * .why = `--` closes option parse (posix); a token after it is positional by contract
 */
const asArgsBeforeEndOfOptions = (input: { args: string[] }): string[] => {
  const end = input.args.indexOf('--');
  return end === -1 ? input.args : input.args.slice(0, end);
};

/**
 * .what = parses clean cli args into an options record, and names each value flag typed bare
 * .why = 🔴 a bare `--key` once read as the string `'true'` for every flag, so `--stone` with its
 *        value forgotten became a stone named `true` — it passed each `!options.stone` check and
 *        ran on a nonsense value. a bare value flag is a slip, never a value, so it is recorded
 *        apart (`valueless`) for the caller to refuse, and only a declared boolean reads bare
 *
 * .note = each value `--key` takes the token after it as its value. a value never starts with
 *         `--`, so a value token is never read as a key. a repeated key keeps its last value in
 *         `options`, and every value, in the order typed, in `optionsMulti`
 * .note = a declared boolean NEVER takes a value: it always reads `'true'`, and the token after
 *         it stays positional. so `--hard foo` is hard plus the word `foo`, never hard=`foo`
 * .note = a flag typed bare at ANY occurrence is in `valueless`, even if another occurrence
 *         gave it a value — which one the human meant is theirs to say
 * .note = an EMPTY value (`--stone ''`, or `--stone=` once spaced by `asArgvSpaced`) is no
 *         usable value, so the flag is `valueless` — a stone named `''` is the same slip as a
 *         stone named `true`
 * .note = a bare `--` is the posix end-of-options marker: no token at or after it is read as
 *         a flag, and it never names a flag of its own (a key of `''` no caller could act on)
 */
export const asCliOptionsOfArgs = (input: {
  args: string[];
  booleans: readonly string[];
}): {
  options: Record<string, string | undefined>;
  optionsMulti: Record<string, string[]>;
  valueless: string[];
} => {
  // every flag, paired with the value it reads: 'true' for a declared boolean, the token
  // that follows for a value flag, or null when a value flag has none
  const pairs = asArgsBeforeEndOfOptions({ args: input.args }).flatMap(
    (arg, index, args) => {
      if (!arg.startsWith('--')) return [];
      const key = arg.slice(2);
      if (input.booleans.includes(key)) return [{ key, value: 'true' }];
      const after = args[index + 1];
      const value = !!after && !after.startsWith('--') ? after : null;
      return [{ key, value }];
    },
  );

  // each flag that read a value; a bare value flag reads naught
  const pairsValued = pairs.flatMap((pair) =>
    pair.value === null ? [] : [{ key: pair.key, value: pair.value }],
  );

  // the last value per key
  const options = Object.fromEntries(
    pairsValued.map((pair) => [pair.key, pair.value]),
  );

  // every value per key, in the order typed
  const optionsMulti = pairsValued.reduce<Record<string, string[]>>(
    (multi, pair) => ({
      ...multi,
      [pair.key]: [...(multi[pair.key] ?? []), pair.value],
    }),
    {},
  );

  // each value flag typed bare, once, in the order typed
  const valueless = [
    ...new Set(
      pairs.filter((pair) => pair.value === null).map((pair) => pair.key),
    ),
  ];
  return { options, optionsMulti, valueless };
};
