/**
 * .what = whether a declared value carries a glob metachar
 * .why = a bare path is matched as a prefix, a glob by the glob matcher; every token the
 *        matcher reads (`*`, `?`, `[`, `{`) must route here to it, or that glob claims naught
 */
const isGlobShaped = (input: { value: string }): boolean =>
  /[*?[{]/.test(input.value);

/**
 * .what = casts one declared glob into the matcher a target is tested against
 * .why = a bare dir names its whole subtree, which a prefix test states plainly; only a
 *        value with a glob token needs the glob matcher
 *
 * .note = a `!` at the head marks an EXCLUSION: the member subtracts what it matches from
 *         what the partition's other members claim. 🔴 a flat directory has no subdirectory
 *         to cut along, so without it a vertical subdomain inside one (`compileReviewPrompt*`)
 *         could be claimed by a second partition only as common, never moved out of the first
 */
export const asMemberOfGlob = (input: {
  glob: string;
}): { kind: 'prefix' | 'glob'; value: string; exclude: boolean } => {
  const exclude = input.glob.startsWith('!');
  const value = exclude ? input.glob.slice(1) : input.glob;
  return isGlobShaped({ value })
    ? { kind: 'glob', value, exclude }
    : { kind: 'prefix', value: value.replace(/\/+$/, ''), exclude };
};
