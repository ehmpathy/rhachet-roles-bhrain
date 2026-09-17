import { BadRequestError } from 'helpful-errors';

/**
 * .what = reads a guard's numeric declaration, or refuses it at parse
 * .why = one transformer for every numeric knob a guard exposes —
 *        `concurrency:`, `budget:`, `level:`, and the `RHACHET_LEVEL_CONCURRENCY`
 *        override — so a value the author did not write can never bind at any of
 *        them. the three keys had drifted apart: `concurrency:` tested its raw
 *        text while its two neighbours used a bare `parseInt`, so one key refused
 *        what the other two silently truncated
 *
 * 🔴 .why the RAW text is tested, never `parseInt`'s answer = `parseInt` reads a
 *     PREFIX, so it answers `2` for `2.5`, `1` for `1e3`, and `NaN` for `abc`. a
 *     check on its answer therefore accepts the first two and truncates them
 *     SILENTLY — the author declares `2.5` and the level pours `2`, with no line
 *     of output to say so.
 *
 *     ⚠️ and `NaN` is worse than a truncation, because it does not merely bind at
 *       the wrong value — it never compares true. `rounds >= NaN` is `false` for
 *       every `rounds`, so a typo'd `budget:` makes a reviewer NEVER exhaust: an
 *       unbounded ladder, reported nowhere.
 *
 * .note = the strictness costs no extant guard. a census of every `.guard` in
 *         this repo (2026-09-10) read 1,538 `budget:`/`level:` values across 117
 *         files and found ZERO non-integers — and a non-integer has no correct
 *         interpretation to take away: `2.5` cannot mean half a round, and `abc`
 *         is not a count at all. so the refusal cannot break a guard that meant
 *         what its author wrote; it can only surface one that did not
 *
 * .note = it lives in its own file rather than private to `parseStoneGuard`
 *         because a second consumer arrived — the env override. a strictness rule
 *         with two implementations is two places the rule can go absent, which is
 *         the defect its own `.why` above describes
 *
 * .note = it sits at the `domain.operations/` root — the common ancestor of the
 *         two contexts that read it (`route/guard/` and `review/`) — rather than
 *         private to `route/guard/`, so `review/runOneReview` and
 *         `review/stepReview` read it with no reach-in across a bounded context.
 *         a transformer with consumers in two domains is a shared utility
 *         (`rule.prefer.most-common-denominator`), and `getFsErrorCode` sets the
 *         precedent for a shared helper at this root (raised i020/r005)
 *
 * 🔴 .why the message ends in a REPAIR clause = it named the violated constraint
 *     and the value at fault, and stopped there — so a driver read the fault and
 *     had to derive the edit. the group-level refusals in the SAME cli surface
 *     already name theirs ("declare it under `reviews.groups`", "remove the
 *     `group:` key"), so one screen taught two conventions. raised i020 by two
 *     lanes (r5 nitpick.3, r7 nitpick.2)
 *
 *     ⚠️ the clause is DELIBERATELY generic — `whole number of 1 or more` rather
 *       than a per-key sentence. this one transformer serves four knobs with
 *       four different senses (`concurrency:` slots, `budget:` rounds, `level:`
 *       an ordinal, and the env override), and a per-key hint would need a
 *       branch here on a key this operation does not otherwise interpret. the
 *       generic clause is true at every one of the four and names the edit, which
 *       is the whole ask (`rule.require.errors-name-the-fix`)
 */
export const asGuardPositiveInt = (input: {
  raw: string;
  key: string;
  at: string;
}): number => {
  if (!/^[0-9]+$/.test(input.raw) || parseInt(input.raw, 10) < 1)
    throw new BadRequestError(
      `${input.key} must be a positive integer: ${input.at} declares "${input.raw}". write a whole number of 1 or more, or drop the key to take its default.`,
    );
  return parseInt(input.raw, 10);
};
