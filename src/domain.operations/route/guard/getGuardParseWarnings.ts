import * as fs from 'fs/promises';

import { asDeclaredGuardKey } from './asDeclaredGuardKey';
import { asGuardKeyValue } from './asGuardKeyValue';
import { KEY_ALIASED, KEYS_EXPLODABLE, KEYS_INLINE } from './GUARD_KEYS';
import type { GuardParseWarning } from './GuardParseWarning';
import { getNearMissGuardKey } from './getNearMissGuardKey';
import { isGuardKeyExploded } from './isGuardKeyExploded';
import { isGuardValueLiteral } from './isGuardValueLiteral';

/**
 * .what = the top-level guard keys a driver was warned about, as structured advisories
 * .why = the key set stays OPEN (F4), so a dropped key cannot throw; case=4's harm is that a
 *        typo reads identical to a deliberate key, so the drop is reported instead
 *
 * .note = it yields structured advisories; the caller renders them on the route's own
 *         `{ emit: { stdout } }`, as `getBudgetClobberWarnings` does. a `console.warn` from a
 *         parser writes on a channel the engine does not own
 * 🔴 .note = it re-reads the guard file rather than rides `parseStoneGuard`'s return — a
 *           DEFERRAL a council may overrule (either fold shape ripples through 31 test call
 *           sites). the record:
 *           `.fulcrums/inventory.of=fulcrums.case=F20-the-advisory-re-reads-the-guard-per-tick.md`
 * .note = the key set is owned by `GUARD_KEYS`, and a test fails on a key the parser drops
 * .note = `indent === 0` parts a top-level key from a nested one, as the parser does
 */
export const getGuardParseWarnings = async (input: {
  path: string;
}): Promise<GuardParseWarning[]> => {
  const content = await fs.readFile(input.path, 'utf-8');

  // named, because the explodable-key arm reads FORWARD: a bare `brain:` is legal or empty
  // by what follows it
  const lines = content.split('\n');

  return lines.flatMap((line, index): GuardParseWarning[] => {
    const key = asDeclaredGuardKey({ line });
    if (!key) return [];

    // 🔴 derived ONCE, so the value an advisory REPORTS is structurally the one the
    // predicate REFUSED — a second derivation could drift and name a value no one rejected
    const value = asGuardKeyValue({ line });

    // the declared alias — its canonical key is known, so the fix is named outright
    if (key === KEY_ALIASED.alias)
      return [
        {
          type: 'key-alias',
          key,
          canonical: KEY_ALIASED.canonical,
          value,
          guard: input.path,
          line: index + 1,
        },
      ];

    // 🔴 a known key declared with no value (`brain:`, `brain: "  "`) — the parser leaves it
    // unset, which would otherwise run silently identical to a stone that declared none
    // .note = an EXPLODABLE key is exempt only where it actually exploded (sub-keys follow);
    //         a bare `brain:` with none beneath it is the empty prescription this catches
    if (
      (KEYS_INLINE as readonly string[]).includes(key) &&
      !value &&
      !(
        (KEYS_EXPLODABLE as readonly string[]).includes(key) &&
        isGuardKeyExploded({ lines, at: index })
      )
    )
      return [{ type: 'key-empty', key, guard: input.path, line: index + 1 }];

    // 🔴 a known key whose value is not a literal (`brain: 'opus`) — the parser refuses
    // it, and a refusal with no advisory would be a silent drop (case=4)
    // .note = below the empty check, and the predicate answers `true` for '', so the two
    //         arms never both fire on one line
    if (
      (KEYS_INLINE as readonly string[]).includes(key) &&
      !isGuardValueLiteral({ value })
    )
      return [
        {
          type: 'key-unreadable',
          key,
          value,
          guard: input.path,
          line: index + 1,
        },
      ];

    // a key one or two edits from one the parser knows — a typo, never a future key
    const nearest = getNearMissGuardKey({ key });
    if (!nearest) return [];
    return [
      {
        type: 'key-near-miss',
        key,
        nearest,
        guard: input.path,
        line: index + 1,
      },
    ];
  });
};
