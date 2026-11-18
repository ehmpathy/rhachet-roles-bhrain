/**
 * .what = a count of settings entries, in words: `an entry` for one, `N entries` for more
 * .why = the drift leaf and the also-removed leaf name a count on the same surface; one
 *        phrase keeps them alike
 */
export const asTermsHookEntryCountText = (input: { count: number }): string =>
  input.count === 1 ? 'an entry' : `${input.count} entries`;
