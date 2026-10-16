/**
 * .what = the byte offset at which two prompts stop to agree
 * .why = a prefix cache keys on an exact byte prefix from token 0. one byte that
 *        diverges at position N voids every token after it, so "at what byte do
 *        they part" is the only question a cache answers to. named and tested
 *        here rather than inlined, so the instrument behind every prefix claim
 *        in the cache diagnosis is checkable.
 *
 * .note = measures bytes, not characters — a multibyte glyph that diverges
 *         mid-sequence parts the prefix at its first divergent byte, not its
 *         character index.
 *
 * .note = carries `One` cardinality as a `get` compute-subtype — a deterministic
 *         derivation, never a shape cast (rule.require.get-set-gen-verbs).
 *
 * .note = takes raw bytes as well as text, so a caller that streams two prompt files
 *         chunk by chunk (`getOneSharedPrefixOfPromptFiles`) measures each chunk with
 *         this same scan, rather than a second copy of it
 */
export const getOneSharedPrefixByteCount = (input: {
  a: string | Uint8Array;
  b: string | Uint8Array;
}): number => {
  const bytesA = asUtf8Bytes({ of: input.a });
  const bytesB = asUtf8Bytes({ of: input.b });
  const bound = Math.min(bytesA.length, bytesB.length);

  // .note = deliberate mutation. a scan for the first divergent byte is the clearest
  //         shape for this, and the alternative allocates a parallel array over a
  //         prompt that runs to hundreds of kilobytes
  //         (rule.require.immutable-vars — annotated-mutation exception)
  let at = 0;
  while (at < bound && bytesA[at] === bytesB[at]) at += 1;
  return at;
};

/**
 * .what = the utf-8 bytes of a text, or the bytes as given
 * .why = one shape for the scan above, whichever form the caller held
 */
const asUtf8Bytes = (input: { of: string | Uint8Array }): Uint8Array =>
  typeof input.of === 'string' ? Buffer.from(input.of, 'utf-8') : input.of;
