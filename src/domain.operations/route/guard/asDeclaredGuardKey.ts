/**
 * .what = the TOP-LEVEL key a guard line declares, lowercased — or null when the line
 *         declares none
 * .why = EXTRACTED from an inline `trimmed.split(':')[0]`. positional array access
 *        carries the semantics in the index rather than in a name, so a reader must
 *        simulate the split to learn what element 0 holds
 *        (`rule.forbid.inline-decode-friction`)
 *
 * .note = `indent === 0` is the whole of what "top-level" means here. a `- slug:` under
 *         `reviews:` and an indented `say: |` body are keys of their own scope, so a
 *         line with any whitespace before its key declares no top-level key at all
 *
 * .note = a comment and an empty line declare no key. they are refused here rather than
 *         by each caller, so the predicate lives in one place
 *
 * .note = lowercased on the way out, because the key set it is compared against is
 *         lowercase and a `Brain:` is the same key a driver meant to write
 *
 * 🔴 .note = `\s*` before the colon, and its absence was the ONE dropped shape with no
 *           signal at all. `brain : opus` is valid yaml and a hand writes it that way —
 *           yet it matched neither this extractor nor the parser's own branch, so it
 *           yielded no carry AND no advisory. every other malformed key reaches one of
 *           the two, which is what `case=4` was built to guarantee. the parser matches
 *           the same way, so the two halves admit the space TOGETHER or neither holds
 */
export const asDeclaredGuardKey = (input: { line: string }): string | null => {
  // whitespace before the key means it belongs to a nested scope, never the top level
  const indent = input.line.match(/^(\s*)/)?.[1]?.length ?? 0;
  if (indent !== 0) return null;

  // an empty line or a comment declares no key
  const trimmed = input.line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  // the key is what precedes the first colon, and only where the line opens with one
  const matched = trimmed.match(/^([a-z][a-z0-9_-]*)\s*:/i);
  if (!matched?.[1]) return null;

  return matched[1].toLowerCase();
};
