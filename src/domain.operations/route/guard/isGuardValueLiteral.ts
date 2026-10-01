/**
 * .what = the characters a guard's inline value may be made of, and no others
 * .why = an ALLOWLIST: a blocklist of forms that fabricate a slug is always one character
 *        behind; the question is "can i read this AS a literal", which a closed set answers
 *
 * .note = `asReviewPeerBrain`'s `LITERAL_SLUG`, widened by the two characters this surface's
 *         own clamps prove legitimate: `:` (`asGuardKey.test.ts [case2]`, `vendor:model:v2`)
 *         and `#` (`[case6]`, `vendor#v2`)
 * .note = SPACE is out: `/model` takes one argument. `brain: 'a # b'` still EXTRACTS as `a # b`
 *         (`[case6]`); it no longer DISPATCHES — extraction and dispatch gate are two acts
 * .note = the `-` sits LAST, where it is a literal rather than a range
 */
const LITERAL_VALUE = /^[A-Za-z0-9._/:#[\]-]+$/;

/**
 * .what = whether a guard's extracted inline value is a plain literal this build may carry
 * .why = the driver-side twin of `asReviewPeerBrain`'s defense, on the path that MUTATES the
 *        clone: `brain: 'opus` extracts as `'opus` (unclosed quote), and without this gate
 *        `/model 'opus` goes onto the wire, and no refusal comes back to read (F5)
 *
 * .note = the gate sits at the CONSUMER, not inside `asGuardKeyValue`: that extractor folds
 *         every absent shape onto '', so a refusal there would render as `key-empty` ("NO
 *         value") — a false diagnosis. a distinct predicate keeps `key-unreadable` apart
 * .note = it fails SAFE: an unknown character is refused and warned, one line to widen,
 *         never a fabricated slug dispatched (`rule.forbid.failhide`)
 * .note = '' answers `true`: `key-empty` owns that class, so no double warn
 */
export const isGuardValueLiteral = (input: { value: string }): boolean =>
  input.value === '' || LITERAL_VALUE.test(input.value);
