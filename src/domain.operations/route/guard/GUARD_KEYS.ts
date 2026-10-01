/**
 * .what = the top-level guard keys, and which of them carry an INLINE value
 * .why = the parser, the near-miss detector, and the advisory reporter must agree on one set;
 *        three unlinked copies let a new key be parsed-and-dropped with no compile error
 *
 * .note = the parser still branches per header key (each sets a different accumulator); what
 *         this owns is the SET. two mechanisms hold the three in step:
 *         - `PATTERN_INLINE` is DERIVED here, so the parser carries no literal alternation
 *         - `GUARD_KEYS.integration.test.ts` walks `KEYS_KNOWN` and fails on a key the
 *           parser does not carry
 */

/**
 * .what = the top-level keys whose value sits on the lines BENEATH the key
 * .why = a bare `artifacts:` is correct syntax, so no empty-value advisory fires on one
 *        (case=10)
 */
export const KEYS_HEADER = [
  'artifacts',
  'reviews',
  'judges',
  'protect',
] as const;

/**
 * .what = the top-level keys whose value rides INLINE on the key's own line
 * .why = these keys can be declared EMPTY in a way the parser drops, so the empty-value
 *        advisory reads them
 *
 * .note = `brain` is the only inline-value key (`F-f`), and also the one key that doubles as
 *         a header — see `KEYS_EXPLODABLE`
 */
export const KEYS_INLINE = ['brain'] as const;

/**
 * .what = the top-level keys that accept BOTH an inline value and a bare header
 * .why = a bare `brain:` opens the exploded form, so it is legal syntax, not a dropped value;
 *        without this exemption every exploded guard warns on its own first line
 *
 * .note = a SUBSET of `KEYS_INLINE`: only the EMPTY advisory is exempted; an unreadable
 *         inline value still warns
 */
export const KEYS_EXPLODABLE = ['brain'] as const;

/**
 * .what = the sub-keys the exploded `brain:` form accepts, beneath the key
 * .why = the parser and its tests must agree on the set
 *
 * .note = `effort` nests under `brain`, never beside it: a level is model-scoped (`xhigh` is
 *         offered by some brains and refused by others)
 * .note = both optional, at least one present. `effort:` alone keeps the driver's brain
 */
export const KEYS_BRAIN_SUB = ['choice', 'effort'] as const;

/**
 * .what = every top-level key the parser knows
 * .why = the near-miss detector compares against this, so a typo of a real key is named
 *        while a future key from a newer producer stays silent (the F4 open-set verdict)
 *
 * .note = `model` is NOT here. it is a declared ALIAS of `brain` and carries its own
 *         warn, which names the canonical word outright rather than guesses at it
 */
export const KEYS_KNOWN = [...KEYS_HEADER, ...KEYS_INLINE] as const;

/**
 * .what = the canonical key `model:` is an alias of
 * .why = `/model` is the slash command and `--model` was the flag on archived enroll
 *        lines, so a hand reaches for `model:`. the alias is KNOWN, so its warn names
 *        `brain:` outright
 */
export const KEY_ALIASED = { alias: 'model', canonical: 'brain' } as const;

/**
 * .what = the branch condition the parser fires on for an INLINE key, derived
 * .why = derived from the sets above, so a new inline key cannot be warned by the detector
 *        and silently dropped by the parser
 *
 * .note = the alias rides in the alternation: the parser must MATCH `model:` to drop it with a
 *         warn; unmatched, it would drop silently (case=4)
 * .note = `\s*` before the colon and the `i` flag live here so the extractor and the parser
 *         fold case and admit space identically — each once caused a silent drop
 */
export const PATTERN_INLINE = new RegExp(
  `^(${[...KEYS_INLINE, KEY_ALIASED.alias].join('|')})\\s*:`,
  'i',
);
