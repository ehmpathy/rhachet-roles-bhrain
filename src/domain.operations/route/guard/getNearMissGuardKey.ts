import { KEYS_KNOWN } from './GUARD_KEYS';

/**
 * .what = the edit distance past which two keys are unrelated
 * .why = 2 catches a transposition, which is the shape a typo of a real word takes
 *        — `brian` is 2 from `brain`, and a single-char slip is 1. beyond 2 the
 *        words are different words
 */
const DISTANCE_MAX = 2;

/**
 * .what = the shortest key this detector will judge
 * .why = at 3 chars or fewer, a distance of 2 rewrites most of the word, so every
 *        short key would read as a near miss of every other
 */
const LENGTH_MIN = 4;

/**
 * .what = the known key an unrecognized guard key is one or two edits from, or null
 * .why = a TYPO is not an unknown key — it is a key one edit from a known one, and
 *        that is mechanically detectable with the key set left OPEN. so a future key
 *        from a newer producer stays silent while a misspelled known key is named
 *        (case=4 [t8]; the F4 verdict kept the parser permissive)
 *
 * .note = pure — it takes a key and yields the nearest known key or null. the caller
 *         owns the prose, per the renderer convention getBudgetClobberWarnings states
 *
 * .note = an EXACT match returns null. a key the parser already handles is not a near
 *         miss of itself, and the caller never reaches this for a key it matched
 */
export const getNearMissGuardKey = (input: { key: string }): string | null => {
  const key = input.key.toLowerCase();

  // a key the parser knows is no near miss at all
  if ((KEYS_KNOWN as readonly string[]).includes(key)) return null;

  // too short to judge — at this length every key is near every other
  if (key.length < LENGTH_MIN) return null;

  // the nearest known key, when it sits inside the threshold
  const ranked = KEYS_KNOWN.map((known) => ({
    known,
    distance: computeEditDistance({ from: key, to: known }),
  })).sort((a, b) => a.distance - b.distance);

  const nearest = ranked[0];
  if (!nearest) return null;
  if (nearest.distance > DISTANCE_MAX) return null;
  return nearest.known;
};

/**
 * .what = the levenshtein distance between two strings
 * .why = the standard edit-distance measure: the fewest single-character inserts,
 *        deletes, or substitutions that turn one string into the other
 *
 * .note = a row-at-a-time table, so it holds two rows rather than the full matrix.
 *         guard keys are short, so this is for clarity over speed
 *
 * .note = DELIBERATE MUTATION, scoped entirely to this operation's body
 *         (rule.require.immutable-vars). the dynamic-program table is defined by a
 *         recurrence over its own prior row, so a fold that rebuilt each row would
 *         obscure what a reader needs to see: the three costs below. the operation
 *         stays pure — no local outlives the return, and it reads no outer state
 */
const computeEditDistance = (input: { from: string; to: string }): number => {
  const { from, to } = input;

  let rowPrior = Array.from({ length: to.length + 1 }, (_unused, i) => i);

  for (let i = 1; i <= from.length; i += 1) {
    const rowThis = [i];
    for (let j = 1; j <= to.length; j += 1) {
      const cost = from[i - 1] === to[j - 1] ? 0 : 1;
      rowThis[j] = Math.min(
        (rowThis[j - 1] ?? 0) + 1, // an insert
        (rowPrior[j] ?? 0) + 1, // a delete
        (rowPrior[j - 1] ?? 0) + cost, // a substitute
      );
    }
    rowPrior = rowThis;
  }

  return rowPrior[to.length] ?? 0;
};
